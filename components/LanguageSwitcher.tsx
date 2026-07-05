"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Globe, Check } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";

const LOCALES = [
  { code: "ar", label: "عربي" },
  { code: "en", label: "English" },
];

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLabel = LOCALES.find((l) => l.code === locale)?.label;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 text-xs font-semibold text-primary/70 transition-colors active:scale-95"
        aria-label="Switch language"
      >
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        <span>{currentLabel}</span>
        <Globe size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full start-0 z-20 mb-2 min-w-[130px] overflow-hidden rounded-2xl border border-primary/10 bg-background shadow-glass-lg"
          >
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (l.code !== locale) {
                    router.replace(pathname, { locale: l.code });
                  }
                }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-primary/5 ${
                  l.code === locale ? "font-semibold text-primary" : "text-primary/60"
                }`}
              >
                {l.label}
                {l.code === locale && <Check size={14} className="text-accent" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
