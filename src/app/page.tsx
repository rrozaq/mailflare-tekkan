import type { Metadata } from "next";
import Link from "next/link";
import { heroMessages } from "./utils";
import { getServerTranslator } from "@/lib/i18n/server";
import { LanguageSelector } from "@/components/language-selector";
import { getHomeBranding } from "./home-server-utils";
import { HomeAuthProvider } from "./home-auth";
import { HomeHeaderActions } from "./home-header-actions";
import { HomeHeroActions } from "./home-hero-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getHomeBranding();
  return {
    title: branding.appName,
    icons: { icon: branding.hasCustomIcon ? "/api/branding/icon" : "/icon-96.png" },
  };
}

export default async function HomePage() {
  const branding = await getHomeBranding();
  const t = await getServerTranslator();

  return (
    <HomeAuthProvider>
    <div className="flex min-h-dvh flex-col bg-[#f6f8fc] text-neutral-900">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label={t("home.homeLabel", { app: branding.appName })}
        >
          <img src={branding.hasCustomIcon ? "/api/branding/icon" : "/icon-96.png"} height={32} width={32} alt="" />
          <span className="text-base font-semibold tracking-tight">
            {branding.appName}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LanguageSelector variant="text" />
          </div>
          <HomeHeaderActions />
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-16 text-center sm:px-6 md:pt-24">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-neutral-950 sm:text-5xl">
            {t("home.headline")}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-neutral-600">
            {t("home.subheadline")}
          </p>
          <HomeHeroActions />
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-20 pt-14 sm:px-6">
          <div className="overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-40px_rgba(30,64,175,0.45)]">
            <ul className="divide-y divide-neutral-100">
              {heroMessages.map((message) => (
                <li key={message.sender} className="flex items-center gap-4 px-5 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800">
                    {message.sender.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className={`truncate text-sm ${message.unread ? "font-semibold text-neutral-950" : "font-medium text-neutral-700"}`}>
                        {message.sender}
                      </span>
                      <span className={`shrink-0 text-xs ${message.unread ? "font-semibold text-blue-700" : "text-neutral-500"}`}>
                        {message.time}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-neutral-500">
                      <span className={message.unread ? "font-medium text-neutral-900" : "text-neutral-700"}>
                        {t(message.subjectKey)}
                      </span>
                      {" — "}
                      {t(message.previewKey)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} {branding.appName}
      </footer>
    </div>
    </HomeAuthProvider>
  );
}
