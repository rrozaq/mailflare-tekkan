export type UserRole = "admin" | "user";

export type SessionUser = {
	id: string;
	email: string;
	resetEmail: string | null;
	forwardingEmail: string | null;
	passwordHash: string;
	name: string;
	timeZone: string | null;
	role: UserRole;
	isPrimaryAdmin: boolean;
	disabled: boolean;
	canManageMailboxes: boolean;
	canManageDomains: boolean;
	canManageUsers: boolean;
	canAddAccounts: boolean;
	keyboardShortcutsEnabled: boolean;
	spamProtectionEnabled: boolean;
	trashRetentionDays: number | null;
	showFullRecipientAddresses: boolean;
	createdByUserId: string | null;
	addedByUserId: string | null;
	createdAt: Date;
};
