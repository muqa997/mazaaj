"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";
import { fadeUp } from "@/lib/motion";

export default function GameLounge() {
  const t = useTranslations("gameLounge");

  return (
    <section
      id="game-lounge"
      className="relative flex min-h-[420px] items-center overflow-hidden bg-cover bg-center px-6 py-20 text-background sm:min-h-[520px]"
      style={{ backgroundImage: "url(/images/game-lounge/game-panel.webp)" }}
    >
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="relative z-10 mx-auto flex max-w-md flex-col items-center text-center"
      >
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15">
          <Gamepad2 size={26} className="text-accent" />
        </div>
        <h2 className="mb-5 text-3xl font-extrabold sm:text-4xl">{t("eyebrow")}</h2>
        <p className="max-w-md text-base leading-loose text-background/70">
          {t("description")}
        </p>
      </motion.div>
    </section>
  );
}
