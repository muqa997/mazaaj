"use client";

import { useTranslations } from "next-intl";
import { motion, type Variants } from "framer-motion";
import { Coffee, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="relative flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* خلفية الهيرو: مكان مخصص لصورة حقيقية لاحقاً (public/images/hero) —
          حالياً تدرّج وتوهجات زخرفية بديلة عن الصورة */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgb(var(--color-accent)/0.08),transparent_60%)]" />
      <div className="pointer-events-none absolute -top-20 -end-20 h-72 w-72 rounded-full bg-accent/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-28 -start-20 h-80 w-80 rounded-full bg-primary/10 blur-[110px]" />
      <div className="pointer-events-none absolute top-1/3 start-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-accent/10 blur-[90px]" />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex max-w-md flex-col items-center"
      >
        <motion.span
          variants={item}
          className="mb-4 text-sm font-semibold tracking-[0.35em] text-accent"
        >
          {t("eyebrow")}
        </motion.span>

        <motion.h1
          variants={item}
          className="mb-5 text-4xl font-extrabold leading-[1.35] text-primary sm:text-5xl"
        >
          {t("titleLine1")}
          <br />
          <span className="text-accent">{t("titleLine2")}</span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mb-10 max-w-sm text-base leading-loose text-primary/60"
        >
          {t("subtitle")}
        </motion.p>

        <motion.div
          variants={item}
          className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row"
        >
          <motion.div
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.15 }}
            className="w-full sm:w-auto"
          >
            <Link
              href="/menu"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 font-semibold text-background shadow-glass-lg sm:w-auto"
            >
              <Coffee size={18} />
              {t("browseMenu")}
            </Link>
          </motion.div>

          <motion.div
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.15 }}
            className="w-full sm:w-auto"
          >
            <Link
              href="/order"
              className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-accent px-8 py-4 font-semibold text-primary sm:w-auto"
            >
              {t("orderNow")}
              <ArrowLeft size={18} className="ltr:rotate-180" />
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
