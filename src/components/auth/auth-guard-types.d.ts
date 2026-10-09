import type { ReactNode } from "react";

export type AuthGuardMode = "protected" | "public";

export type AuthGuardProps = {
	children: ReactNode;
	mode?: AuthGuardMode;
	requireMailbox?: boolean;
	requireRole?: "admin";
	/** Allow users delegated mailbox management into an otherwise admin-only route. */
	allowMailboxManagers?: boolean;
	requirePrimary?: boolean;
	/** Public page that stays usable while signed in (adding another account). */
	allowAuthenticated?: boolean;
};
