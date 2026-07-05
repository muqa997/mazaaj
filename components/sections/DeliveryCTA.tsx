"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Bike, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { fadeUp } from "@/lib/motion";

export default function DeliveryCTA() {
  const t = useTranslations("delivery");

  return (
    <section id="delivery" className="px-6 py-20">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="mx-auto flex max-w-2xl flex-col items-center rounded-4xl border border-primary/10 bg-primary/[0.03] px-8 py-14 text-center"
      >
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
          <Bike size={26} className="text-accent" />
        </div>
        <span className="mb-3 text-sm font-semibold tracking-[0.3em] text-accent">
          {t("eyebrow")}
        </span>
        <h2 className="mb-5 text-3xl font-extrabold text-primary sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mb-10 max-w-md text-base leading-loose text-primary/60">
          {t("description")}
        </p>

        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.03 }}>
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
