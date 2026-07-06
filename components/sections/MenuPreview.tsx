"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Coffee, GlassWater, Wind, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { fadeUp } from "@/lib/motion";

export default function MenuPreview() {
  const t = useTranslations("menuPreview");
  const tCategories = useTranslations("menuPage.categories");

  const categories = [
    { icon: Coffee, label: tCategories("coffeeHot") },
    { icon: GlassWater, label: tCategories("juice") },
    { icon: Wind, label: tCategories("shisha") },
  ];

  return (
    <section id="menu-preview" className="bg-primary/[0.03] px-6 py-20">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto flex max-w-2xl flex-col items-center text-center"
      >
        <span className="mb-3 text-sm font-semibold tracking-[0.3em] text-accent">
          {t("eyebrow")}
        </span>
        <h2 className="mb-5 text-3xl font-extrabold text-primary sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mb-10 max-w-md text-base leading-loose text-primary/60">
          {t("description")}
        </p>

        <div className="mb-10 grid w-full grid-cols-3 gap-4">
          {categories.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-primary/10 bg-background py-6"
            >
              <Icon size={22} className="text-accent" strokeWidth={1.8} />
              <span className="text-sm font-semibold text-primary">{label}</span>
            </div>
          ))}
        </div>

        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.03 }} transition={{ duration: 0.15 }}>
          <Link
            href="/menu"
            className="flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-semibold text-background shadow-glass"
          >
            {t("cta")}
            <ArrowLeft size={18} className="ltr:rotate-180" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
