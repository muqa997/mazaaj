"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Gamepad2, ArrowLeft } from "lucide-react";
import { fadeUp } from "@/lib/motion";

export default function GameLounge() {
  const t = useTranslations("gameLounge");

  return (
    <section
      id="game-lounge"
      className="relative overflow-hidden bg-primary px-6 py-20 text-background"
    >
      <div className="pointer-events-none absolute -top-16 -end-16 h-64 w-64 rounded-full bg-accent/20 blur-[100px]" />

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center"
      >
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
          <Gamepad2 size={26} className="text-accent" />
        </div>
        <span className="mb-3 text-sm font-semibold tracking-[0.3em] text-accent">
          {t("eyebrow")}
        </span>
        <h2 className="mb-5 text-3xl font-extrabold sm:text-4xl">{t("title")}</h2>
        <p className="mb-10 max-w-md text-base leading-loose text-background/70">
          {t("description")}
        </p>

        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.03 }} transition={{ duration: 0.15 }}>
          <a
            href="#contact"
            className="flex items-center gap-2 rounded-full border-2 border-accent px-8 py-4 font-semibold text-background"
          >
            {t("cta")}
            <ArrowLeft size={18} className="ltr:rotate-180" />
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
