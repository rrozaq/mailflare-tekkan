import type { TranslationKey } from "@/lib/i18n/types";
import type { ButtonProps } from "@/components/ui/button";
import type { MailboxSelectorUser } from "@/components/mailbox-selector-types";
import type { ReactNode } from "react";

export type HomeAuthProviderProps = {
	children: ReactNode;
};

export type HomeAuthResponse = {
	user?: MailboxSelectorUser;
};

export type HomeAccountMenuProps = {
	user: MailboxSelectorUser;
};

export type HomeAction = {
	href: string;
	labelKey: TranslationKey;
	variant: ButtonProps["variant"];
};

export type LandingNavItem = {
	href: string;
	label: string;
};

export type MailPreview = {
	sender: string;
	subjectKey: TranslationKey;
	previewKey: TranslationKey;
	time: string;
	unread?: boolean;
};

export type LandingStat = {
	value: string;
	label: string;
};
