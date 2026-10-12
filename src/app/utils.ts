import type { HomeAction, LandingNavItem, LandingStat, MailPreview } from "./types";

export const landingNavItems: LandingNavItem[] = [
	{ href: "#workflow", label: "Workflow" },
	{ href: "#domains", label: "Domains" },
	{ href: "#api", label: "API" },
];

export const heroMessages: MailPreview[] = [
	{ sender: "Rina Pratama", subjectKey: "home.msg1.subject", previewKey: "home.msg1.preview", time: "09.41", unread: true },
	{ sender: "Dewi Lestari", subjectKey: "home.msg2.subject", previewKey: "home.msg2.preview", time: "08.15", unread: true },
	{ sender: "Budi Santoso", subjectKey: "home.msg3.subject", previewKey: "home.msg3.preview", time: "07.52" },
	{ sender: "Andi Wijaya", subjectKey: "home.msg4.subject", previewKey: "home.msg4.preview", time: "07.10" },
];

export const inboxStats: LandingStat[] = [
	{ value: "24ms", label: "routing rule lookup" },
	{ value: "7", label: "active domains" },
	{ value: "1.8k", label: "messages tracked this week" },
];

export const deliverySignals = [
	"DNS setup status before mail starts moving",
	"Mailbox-first routing for support and product teams",
	"API keys and webhooks managed beside the inbox",
];

export function getHomeActions(isLoggedIn: boolean): HomeAction[] {
	if (isLoggedIn) {
		return [{ href: "/inbox", labelKey: "home.dashboard", variant: "default" }];
	}

	// Visitors only sign in; /login sends a fresh install on to /setup.
	return [{ href: "/login", labelKey: "home.logIn", variant: "default" }];
}
