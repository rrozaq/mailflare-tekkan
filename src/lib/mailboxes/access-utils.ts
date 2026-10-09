import type { AppDatabase } from "@/db";

export async function isTeamMailboxSharingEnabled(db: AppDatabase): Promise<boolean> {
	// Mailbox sharing is available to every installation. Retain this helper so
	// callers have one feature boundary if the product policy changes again.
	void db;
	return true;
}
