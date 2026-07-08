"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { menuData, MENU_CATEGORIES, type MenuCategory, type ShishaBase } from "@/lib/menu-data";

const SHISHA_BASES: ShishaBase[] = ["wood", "bubble", "natural"];

export default function MenuDisplayPage() {
  const t = useTranslations("interactiveMenu");
  const tBase = useTranslations("shishaBase");
  const locale = useLocale() as "ar" | "en";
  const [activeCategory, setActiveCategory] = useState<MenuCategory>(
    MENU_CATEGORIES[0]
  );

  const visibleItems = menuData.filter((item) => item.category === activeCategory);

  return (
    <div
      className="min-h-screen bg-background px-6 pb-10"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)" }}
    >
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-3xl font-extrabold text-primary">{t("title")}</h1>
        <p className="mb-8 text-sm text-primary/50">{t("subtitle")}</p>

        <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
          {MENU_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                activeCategory === category
                  ? "bg-primary text-background"
                  : "bg-primary/5 text-primary/60"
              }`}
            >
              {t(`categories.${category}`)}
            </button>
          ))}
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
                className="flex flex-col gap-2 rounded-2xl border border-primary/10 bg-background p-5 shadow-glass"
              >
                <p className="font-semibold text-primary">
                  {menuItem.name[locale]}
                </p>

                {menuItem.category === "shisha" ? (
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {SHISHA_BASES.filter((base) => menuItem.basePrices[base] !== undefined).map(
                      (base) => (
                        <p key={base} className="text-xs text-primary/50">
                          {tBase(base)}:{" "}
                          <span className="font-semibold text-accent">
                            {menuItem.basePrices[base]!.toLocaleString()} {t("currency")}
                          </span>
                        </p>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-accent">
                    {menuItem.price.toLocaleString()} {t("currency")}
                  </p>
                )}
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
