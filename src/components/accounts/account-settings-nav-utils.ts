import type { AccountSettingsNavItem } from "./account-settings-nav-types";

export const accountSettingsNavItems: AccountSettingsNavItem[] = [
	{ segment: "", labelKey: "accountSettings.details" },
	{ segment: "password", labelKey: "accountSettings.password" },
	{ segment: "permissions", labelKey: "accountSettings.permissions" },
	{ segment: "mailboxes", labelKey: "accountSettings.mailboxes" },
];

/** Users who added the account manage its details and password; the rest stays with admins. */
export function getAccountSettingsNavItems(role: "admin" | "user" | undefined): AccountSettingsNavItem[] {
	return role !== "user" ? accountSettingsNavItems : accountSettingsNavItems.filter((item) => item.segment === "" || item.segment === "password");
}

export function getAccountSettingsHref(accountId: string, segment: AccountSettingsNavItem["segment"]): string {
	return `/accounts/${accountId}${segment ? `/${segment}` : ""}`;
}

export function isActiveAccountSettingsPath(pathname: string, href: string): boolean {
	return pathname === href;
}
