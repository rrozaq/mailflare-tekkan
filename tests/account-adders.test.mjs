import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const directory = mkdtempSync(join(root, "node_modules", "mailflare-account-adders-test-"));
after(() => rmSync(directory, { recursive: true, force: true }));
await build({
	stdin: {
		contents: `
			export { SqliteDatabase } from "./server/runtime/sqlite-database.ts";
			export { applyMigrations } from "./server/runtime/migrate.ts";
			export { createSession } from "./src/lib/auth/session.ts";
			export { GET as listAccounts, POST as createAccount } from "./src/app/api/accounts/route.ts";
			export { GET as getAccount, PATCH as updateAccount } from "./src/app/api/accounts/[id]/route.ts";
		`,
		resolveDir: root,
		sourcefile: "account-adders-test-entry.ts",
	},
	outfile: join(directory, "entry.mjs"),
	bundle: true,
	platform: "node",
	format: "esm",
	target: "node24",
	tsconfig: join(root, "tsconfig.json"),
	packages: "external",
	alias: { "next/headers": "next/headers.js", "next/server": "next/server.js", "cloudflare:workers": "./server/runtime/cloudflare-workers.ts" },
	logLevel: "silent",
});
const { SqliteDatabase, applyMigrations, createSession, listAccounts, createAccount, getAccount, updateAccount } =
	await import(pathToFileURL(join(directory, "entry.mjs")).href);

async function fixture(t) {
	const database = new SqliteDatabase(":memory:");
	t.after(() => database.db.close());
	await applyMigrations(database, join(root, "drizzle/migrations"));
	// Manual zones keep Cloudflare routing a no-op.
	database.db.exec(`
		INSERT INTO users (id, email, password_hash, name, role, is_primary_admin, created_at) VALUES
			('admin', 'owner@one.test', 'hash', 'Owner', 'admin', 1, 1);
		INSERT INTO users (id, email, password_hash, name, role, can_add_accounts, created_by_user_id, created_at) VALUES
			('adder', 'adder@one.test', 'hash', 'Adder', 'user', 1, 'admin', 2),
			('plain', 'plain@one.test', 'hash', 'Plain', 'user', 0, 'admin', 3);
		INSERT INTO domains (id, user_id, hostname, zone_id, status, created_at) VALUES
			('one', 'admin', 'one.test', 'manual', 'active', 1),
			('two', 'admin', 'two.test', 'manual', 'active', 1);
	`);
	const env = { DB: database, MAILFLARE_RUNTIME: "node" };
	globalThis.__mailflareNodeEnv = env;
	t.after(() => { delete globalThis.__mailflareNodeEnv; });
	t.mock.method(globalThis, "fetch", async (url) => assert.fail(`unexpected request to ${url}`));
	const sessions = Object.fromEntries(await Promise.all(["admin", "adder", "plain"].map(async (id) => [id, await createSession(env, id)])));
	const request = (as, path, init = {}) => new Request(`https://mailflare.test${path}`, {
		...init,
		headers: { Authorization: `Bearer ${sessions[as]}`, "Content-Type": "application/json" },
	});
	const create = (as, overrides = {}) => createAccount(request(as, "/api/accounts", {
		method: "POST",
		body: JSON.stringify({ username: "sam", domainId: "one", password: "test-password", ...overrides }),
	}));
	const user = (email) => database.db.prepare("SELECT * FROM users WHERE email = ?").get(email);
	return { database, request, create, user };
}

const params = (id) => ({ params: Promise.resolve({ id }) });

test("a user granted can_add_accounts adds a plain user on their own email domain", async (t) => {
	const f = await fixture(t);
	assert.equal((await f.create("adder")).status, 201);
	const added = f.user("sam@one.test");
	assert.equal(added.role, "user");
	assert.equal(added.created_by_user_id, "admin", "the domain-owning admin stays the creator");
	assert.equal(added.added_by_user_id, "adder");
});

test("account adders cannot leave their domain or hand out more than a plain account", async (t) => {
	const f = await fixture(t);
	assert.equal((await f.create("plain")).status, 403);
	assert.equal((await f.create("adder", { domainId: "two" })).status, 404);
	assert.equal((await f.create("adder", { role: "admin" })).status, 403);
	assert.equal((await f.create("adder", { useAllDomains: true })).status, 403);
	assert.equal((await f.create("adder", { aliases: [{ domainId: "one", localPart: "sammy" }] })).status, 403);
	assert.equal(f.user("sam@one.test"), undefined);
});

test("account adders see and edit only the accounts they added, without changing permissions", async (t) => {
	const f = await fixture(t);
	assert.equal((await f.create("adder")).status, 201);
	assert.equal((await f.create("admin", { username: "kim" })).status, 201);
	const sam = f.user("sam@one.test").id;
	const kim = f.user("kim@one.test").id;

	const list = await (await listAccounts(f.request("adder", "/api/accounts"))).json();
	assert.deepEqual(list.accounts.map((account) => account.email), ["sam@one.test"]);

	const detail = await getAccount(f.request("adder", `/api/accounts/${sam}`), params(sam));
	assert.equal(detail.status, 200);
	assert.equal((await detail.json()).account.editable, true);
	assert.equal((await getAccount(f.request("adder", `/api/accounts/${kim}`), params(kim))).status, 404);
	assert.equal((await getAccount(f.request("adder", "/api/accounts/admin"), params("admin"))).status, 404);

	const patch = (as, id, body) => updateAccount(f.request(as, `/api/accounts/${id}`, {
		method: "PATCH",
		body: JSON.stringify({ name: "Sam", role: "user", disabled: true, canManageMailboxes: true, canAddAccounts: true, ...body }),
	}), params(id));
	assert.equal((await patch("adder", sam)).status, 200);
	const updated = f.user("sam@one.test");
	assert.equal(updated.name, "Sam");
	assert.equal(updated.disabled, 1);
	assert.equal(updated.can_manage_mailboxes, 0);
	assert.equal(updated.can_add_accounts, 0);
	assert.equal((await patch("adder", kim)).status, 403);
	assert.equal((await patch("plain", sam)).status, 403);
});

test("admins grant and revoke can_add_accounts", async (t) => {
	const f = await fixture(t);
	const patch = (canAddAccounts) => updateAccount(f.request("admin", "/api/accounts/plain", {
		method: "PATCH",
		body: JSON.stringify({ name: "Plain", role: "user", disabled: false, canManageMailboxes: false, canAddAccounts }),
	}), params("plain"));
	assert.equal((await patch(true)).status, 200);
	assert.equal(f.user("plain@one.test").can_add_accounts, 1);
	assert.equal((await f.create("plain")).status, 201);
	assert.equal((await patch(false)).status, 200);
	assert.equal((await f.create("plain", { username: "lee" })).status, 403);
});
