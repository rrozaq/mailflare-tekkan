import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { getDb } from "@/db";
import { domains, mailboxes, users } from "@/db/schema";
import { canAddAccounts, isAdmin } from "@/lib/auth/admin";
import { requireUser } from "@/lib/auth/cookies";
import { getLicenseEntitlements } from "@/lib/licenses/service";
import { getEnv } from "@/lib/cloudflare";
import type { SessionUser } from "@/lib/auth/types";

type Db = ReturnType<typeof getDb>;

export function listAccountsForAdmin(db: Db, addedByUserId?: string) {
	return db
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
			resetEmail: users.resetEmail,
			role: users.role,
			isPrimaryAdmin: users.isPrimaryAdmin,
			disabled: users.disabled,
			avatarKey: users.avatarKey,
			canManageMailboxes: users.canManageMailboxes,
			canManageDomains: users.canManageDomains,
			canManageUsers: users.canManageUsers,
			createdAt: users.createdAt,
		})
		.from(users)
		.where(addedByUserId ? eq(users.addedByUserId, addedByUserId) : undefined)
		.orderBy(desc(users.createdAt));
}

export async function getDomainForAdmin(db: Db, adminUserId: string, domainId: string) {
	const [domain] = await db
		.select()
		.from(domains)
		.where(and(eq(domains.id, domainId), eq(domains.userId, adminUserId)))
		.limit(1);
	return domain ?? null;
}

export async function getExistingMailbox(db: Db, domainId: string, localPart: string) {
	const [mailbox] = await db
		.select()
		.from(mailboxes)
		.where(and(eq(mailboxes.domainId, domainId), eq(mailboxes.localPart, localPart)))
		.limit(1);
	return mailbox ?? null;
}

export function accountListItemFromUser(user: {
	id: string;
	email: string;
	name: string;
	resetEmail: string | null;
	role: "admin" | "user";
	isPrimaryAdmin?: boolean;
	disabled: boolean;
	avatarKey?: string | null;
	canManageMailboxes?: boolean;
	canManageDomains?: boolean;
	canManageUsers?: boolean;
	createdAt: Date;
}) {
	return {
		id: user.id,
		email: user.email,
		name: user.name,
		resetEmail: user.resetEmail,
		role: user.role,
		isPrimaryAdmin: !!user.isPrimaryAdmin,
		disabled: user.disabled,
		hasAvatar: !!user.avatarKey,
		canManageMailboxes: !!user.canManageMailboxes,
		canManageDomains: !!user.canManageDomains,
		canManageUsers: !!user.canManageUsers,
		createdAt: user.createdAt,
	};
}

export function requireTeamAdmin(request: Request) {
	return requireAccountAccess(request, isAdmin);
}

/** Admins, or users granted can_add_accounts; callers limit the latter with managesAddedAccount. */
export function requireAccountManager(request: Request) {
	return requireAccountAccess(request, (user) => isAdmin(user) || canAddAccounts(user));
}

/** A user granted can_add_accounts manages only the plain user accounts they added. */
export function managesAddedAccount(
	actor: Pick<SessionUser, "id" | "role" | "canAddAccounts">,
	account: { role: "admin" | "user"; isPrimaryAdmin: boolean; addedByUserId: string | null },
) {
	return canAddAccounts(actor) && account.addedByUserId === actor.id && account.role === "user" && !account.isPrimaryAdmin;
}

async function requireAccountAccess(request: Request, allowed: (user: SessionUser) => boolean) {
	const env = getEnv();
	try {
		const user = await requireUser(env, request);
		if (!allowed(user)) throw new Error("Forbidden");
		if (!(await getLicenseEntitlements(env)).canManageAccounts) {
			return {
				env,
				user,
				error: NextResponse.json({ error: "A Team license is required to manage accounts" }, { status: 403 }),
			};
		}
		return { env, user, error: null };
	} catch {
		return { env, user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
	}
}
