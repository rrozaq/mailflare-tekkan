import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { mailboxes } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import type { MailboxRouteParams } from "../types";

/**
 * Keeps an existing address, its routing, and all of its messages intact while
 * allowing the owner to share the inbox with other accounts.
 */
export async function POST(request: Request, { params }: MailboxRouteParams) {
	const { id } = await params;
	const env = getEnv();
	const user = await requireUser(env, request);
	if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

	const db = getDb(env);
	const access = await getMailboxAccessLevel(db, user, id);
	if (!access?.isOwner || !access.canManage) {
		return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
	}

	const [mailbox] = await db
		.select({ id: mailboxes.id, type: mailboxes.type })
		.from(mailboxes)
		.where(eq(mailboxes.id, id))
		.limit(1);
	if (!mailbox) return NextResponse.json({ error: "Mailbox not found" }, { status: 404 });
	if (mailbox.type === "shared") return NextResponse.json({ ok: true });

	await db.update(mailboxes).set({ type: "shared" }).where(eq(mailboxes.id, id));
	return NextResponse.json({ ok: true });
}
