"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { fadeUp } from "@/lib/motion";
import type { MenuItem, ShishaBase } from "@/lib/menu-data";

const SHISHA_BASES: ShishaBase[] = ["wood", "bubble", "natural"];

type MenuItemRowProps = {
  item: MenuItem;
  locale: "ar" | "en";
};

// صف نصي بأسلوب المنيو المطبوع — اسم ووصف على جهة، خط منقّط فاصل، والسعر
// بالجهة الأخرى، بلا أي صندوق أو ظل أو أيقونة (الرسمة أصبحت على مستوى القسم)
export default function MenuItemRow({ item, locale }: MenuItemRowProps) {
  const t = useTranslations("interactiveMenu");
  const tBase = useTranslations("shishaBase");

  return (
    <motion.div variants={fadeUp} className="flex items-baseline gap-2 py-2.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold text-primary sm:text-base">
          {item.name[locale]}
        </span>
        {item.description && (
          <span className="text-xs text-primary/45">{item.description[locale]}</span>
        )}
      </div>

      <span className="mb-1 h-0 flex-1 border-b border-dotted border-primary/25" aria-hidden="true" />

      {item.category === "shisha" ? (
        <div className="flex shrink-0 flex-col items-end gap-0.5 text-end">
          {SHISHA_BASES.filter((base) => item.basePrices[base] !== undefined).map((base) => (
            <span key={base} className="text-xs text-primary/60">
              {tBase(base)}{" "}
              <span className="font-semibold text-accent">
                {item.basePrices[base]!.toLocaleString()} {t("currency")}
              </span>
            </span>
          ))}
        </div>
      ) : (
        <span className="shrink-0 text-sm font-semibold text-accent">
          {item.price.toLocaleString()} {t("currency")}
        </span>
      )}
    </motion.div>
  );
}
