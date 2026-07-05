"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { placeholderMenu, type MenuItem } from "@/lib/placeholder-menu";
import { useCart } from "@/lib/cart-context";

const categories: MenuItem["category"][] = ["coffee", "desserts", "shisha"];

export default function OrderMenuPage() {
  const t = useTranslations("menuPage");
  const locale = useLocale() as "ar" | "en";
  const { items, addItem, updateQty } = useCart();
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
          {categories.map((category) => (
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visibleItems.map((menuItem) => {
            const cartItem = items.find((i) => i.id === menuItem.id);

            return (
              <motion.div
                key={menuItem.id}
                layout
                className="flex items-center justify-between rounded-2xl border border-primary/10 bg-background p-4 shadow-glass"
              >
                <div>
                  <p className="font-semibold text-primary">
                    {menuItem.name[locale]}
                  </p>
                  <p className="text-sm text-primary/50">
                    {menuItem.price.toLocaleString()} {t("currency")}
                  </p>
                </div>

                {cartItem ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQty(menuItem.id, cartItem.qty - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 active:scale-90"
                    >
                      <Minus size={14} className="text-primary/70" />
                    </button>
                    <span className="w-4 text-center text-sm font-semibold text-primary">
                      {cartItem.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(menuItem.id, cartItem.qty + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 active:scale-90"
                    >
                      <Plus size={14} className="text-primary/70" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      addItem({
                        id: menuItem.id,
                        name: menuItem.name[locale],
                        price: menuItem.price,
                      })
                    }
                    className="rounded-full bg-accent/15 px-4 py-2 text-xs font-semibold text-primary active:scale-95"
                  >
                    {t("addToCart")}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
