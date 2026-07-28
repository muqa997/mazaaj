"use client";

import { motion, type Variants } from "framer-motion";
import { useTranslations } from "next-intl";
import { getGroupKeyForCategory, type MenuCategory, type MenuItem } from "@/lib/menu-data";
import CategoryArt from "./category-art/CategoryArt";
import MenuItemRow from "./MenuItemRow";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

type MenuSectionProps = {
  category: MenuCategory;
  items: MenuItem[];
  locale: "ar" | "en";
};

// قسم بأسلوب المنيو المطبوع: رسمة فنية واحدة كبيرة للقسم (تحمل طبقة الحركة
// بخار/ثلج/دخان بدل تكرارها بكل صنف)، ثم قائمة الأصناف بعمودين، وفاصل
// زخرفي بسيط قبل القسم التالي — كل هذا ضمن تدفق الصفحة العادي (بلا sticky)
export default function MenuSection({ category, items, locale }: MenuSectionProps) {
  const t = useTranslations("interactiveMenu");
  const groupKey = getGroupKeyForCategory(category);

  return (
    <section className="py-8">
      <div className="mb-5 flex flex-col items-center gap-3 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
          <CategoryArt groupKey={groupKey} size={44} />
        </div>
        <h2 className="text-xl font-bold text-primary">{t(`categories.${category}`)}</h2>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="grid grid-cols-1 gap-x-8 sm:grid-cols-2"
      >
        {items.map((item) => (
          <MenuItemRow key={item.id} item={item} locale={locale} />
        ))}
      </motion.div>

      <div className="mt-8 flex items-center justify-center gap-3" aria-hidden="true">
        <span className="h-px w-16 bg-accent/30" />
        <span className="h-1.5 w-1.5 rounded-full bg-accent/50" />
        <span className="h-px w-16 bg-accent/30" />
      </div>
    </section>
  );
}
