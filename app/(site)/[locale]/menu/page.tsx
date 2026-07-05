"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, Cake, Wind, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { placeholderMenu, type MenuItem } from "@/lib/placeholder-menu";

const categoryIcons: Record<MenuItem["category"], typeof Coffee> = {
  coffee: Coffee,
  desserts: Cake,
  shisha: Wind,
};

const categories: MenuItem["category"][] = ["coffee", "desserts", "shisha"];

export default function MenuDisplayPage() {
  const t = useTranslations("interactiveMenu");
  const locale = useLocale() as "ar" | "en";
  const [activeCategory, setActiveCategory] = useState<MenuItem["category"]>(
    "coffee"
  );

  const visibleItems = placeholderMenu.filter(
    (item) => item.category === activeCategory
  );

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-3xl font-extrabold text-primary">{t("title")}</h1>
        <p className="mb-4 text-sm text-primary/50">{t("subtitle")}</p>

        <p className="mb-8 rounded-xl bg-accent/10 px-4 py-3 text-xs text-primary/60">
          {t("placeholderNote")}
        </p>

        <div className="mb-8 flex gap-2 overflow-x-auto">
          {categories.map((category) => {
            const Icon = categoryIcons[category];
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                  activeCategory === category
                    ? "bg-primary text-background"
                    : "bg-primary/5 text-primary/60"
                }`}
              >
                <Icon size={16} strokeWidth={1.8} />
                {t(`categories.${category}`)}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {visibleItems.map((menuItem) => (
              <div
                key={menuItem.id}
                className="flex items-center justify-between rounded-2xl border border-primary/10 bg-background p-5 shadow-glass"
              >
                <p className="font-semibold text-primary">
                  {menuItem.name[locale]}
                </p>
                <p className="text-sm font-semibold text-accent">
                  {menuItem.price.toLocaleString()} {t("currency")}
                </p>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex flex-col items-center gap-3 rounded-3xl border border-primary/10 bg-primary/[0.03] px-6 py-8 text-center">
          <p className="text-sm text-primary/60">{t("orderCta")}</p>
          <Link
            href="/order"
            className="flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-background shadow-glass"
          >
            {t("orderCtaButton")}
            <ArrowLeft size={16} className="ltr:rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
