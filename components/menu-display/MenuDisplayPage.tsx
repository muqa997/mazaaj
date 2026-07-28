"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { menuData, MENU_CATEGORIES } from "@/lib/menu-data";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MenuSection from "./MenuSection";
import BackToTopButton from "./BackToTopButton";

export default function MenuDisplayPage() {
  const t = useTranslations("interactiveMenu");
  const locale = useLocale() as "ar" | "en";

  return (
    <div className="min-h-screen bg-background">
      {/* left-4 حرفياً (وليس start-4) — زر اللغة يبقى بالزاوية اليسرى دائماً
          بغض النظر عن اتجاه اللغة الحالية */}
      <div className="fixed top-4 left-4 z-40">
        <LanguageSwitcher dropDirection="down" align="left" />
      </div>

      <div
        className="px-6 pb-4 text-center sm:px-6"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
      >
        <h1 className="mb-2 text-3xl font-extrabold text-primary">{t("title")}</h1>
        <p className="text-sm text-primary/50">{t("subtitle")}</p>
      </div>

      <main className="mx-auto max-w-3xl px-6 pb-10 sm:px-6">
        {MENU_CATEGORIES.map((category) => (
          <MenuSection
            key={category}
            category={category}
            items={menuData.filter((item) => item.category === category)}
            locale={locale}
          />
        ))}

        <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-primary/10 bg-primary/[0.03] px-6 py-8 text-center">
          <p className="text-sm text-primary/60">{t("orderCta")}</p>
          <Link
            href="/order"
            className="flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-background shadow-glass"
          >
            {t("orderCtaButton")}
            <ArrowLeft size={16} className="ltr:rotate-180" />
          </Link>
        </div>
      </main>

      <BackToTopButton />
    </div>
  );
}
