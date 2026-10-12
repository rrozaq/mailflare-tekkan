"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { useHomeAuth } from "./home-auth";

export function HomeHeroActions() {
	const { t } = useLanguage();
	const hasUser = !!useHomeAuth();

	return (
		<div className="mt-8">
			<Button size="lg" asChild className="rounded-full px-6">
				<Link href={hasUser ? "/inbox" : "/login"}>
					{hasUser ? t("home.openDashboard") : t("home.logIn")}
					<ArrowRight className="h-4 w-4" />
				</Link>
			</Button>
		</div>
	);
}
