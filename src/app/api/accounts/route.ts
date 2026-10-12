import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { createUserAccountSchema } from "@/lib/validators";
import { canManageUsers, isAdmin, isPrimaryAdmin } from "@/lib/auth/admin";
import { createAccountResponse } from "./create";
import { accountListItemFromUser, getDomainForAdmin, listAccountsForAdmin, requireAccountManager } from "./utils";

export async function GET(request: Request) {
	const access = await requireAccountManager(request);
	if (access.error) return access.error;
	const actor = access.user!;
	const rows = await listAccountsForAdmin(getDb(access.env), isAdmin(actor) ? undefined : actor.id);
	return NextResponse.json({
		accounts: rows.map((row) => accountListItemFromUser(row)),
	});
}

export async function POST(request: Request) {
	const access = await requireAccountManager(request);
	if (access.error) return access.error;
	const parsed = createUserAccountSchema.safeParse(await request.json().catch(() => null));
	if (!parsed.success) {
		return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
	}
	const actor = access.user!;
	if (!isAdmin(actor)) {
		// A user granted can_add_accounts adds plain users on their own email domain,
		// which belongs to the admin who created them.
		if (parsed.data.role !== "user" || parsed.data.useAllDomains || parsed.data.aliases.length > 0) {
			return NextResponse.json({ error: "You can only add user accounts without aliases" }, { status: 403 });
		}
		const ownerId = actor.createdByUserId;
		const domain = ownerId ? await getDomainForAdmin(getDb(access.env), ownerId, parsed.data.domainId) : null;
		if (!ownerId || !domain || domain.hostname.toLowerCase() !== actor.email.split("@").at(-1)?.toLowerCase()) {
			return NextResponse.json({ error: "Domain not found" }, { status: 404 });
		}
		return createAccountResponse(access.env, ownerId, parsed.data, actor.id);
	}
	if (!canManageUsers(actor)) {
		return NextResponse.json({ error: "You do not have permission to manage users" }, { status: 403 });
	}
	if (parsed.data.role === "admin" && !isPrimaryAdmin(actor)) {
		return NextResponse.json({ error: "Only the primary admin can create admin accounts" }, { status: 403 });
	}
	return createAccountResponse(access.env, actor.id, parsed.data);
}
