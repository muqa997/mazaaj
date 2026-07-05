"use client";

import { useLocale } from "next-intl";
import { ChevronDown, Globe } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";

const LOCALE_LABEL: Record<string, string> = {
  ar: "عربي",
  en: "English",
};

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const nextLocale = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      className={`flex h-9 items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 text-xs font-semibold text-primary/70 transition-colors active:scale-95 ${className}`}
      aria-label="Switch language"
    >
      <ChevronDown size={14} />
      <span>{LOCALE_LABEL[locale]}</span>
      <Globe size={14} />
    </button>
  );
}
