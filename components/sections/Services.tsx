"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import {
  WifiServiceIllustration,
  PaymentServiceIllustration,
  IraqiVibeServiceIllustration,
  MeetingServiceIllustration,
} from "@/components/icons/ServiceIllustrations";

const SERVICES = [
  { key: "internet", Illustration: WifiServiceIllustration },
  { key: "payment", Illustration: PaymentServiceIllustration },
  { key: "atmosphere", Illustration: IraqiVibeServiceIllustration },
  { key: "meetings", Illustration: MeetingServiceIllustration },
] as const;

export default function Services() {
  const t = useTranslations("services");

  return (
    <section id="services" className="px-6 py-20">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto max-w-5xl"
      >
        <div className="mx-auto mb-10 flex max-w-lg flex-col items-center text-center">
          <h2 className="mb-3 text-3xl font-extrabold text-primary sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-base text-primary/60">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(({ key, Illustration }) => (
            <div
              key={key}
              className="flex flex-col rounded-3xl border border-primary/10 bg-background p-5 text-center shadow-glass"
            >
              <h3 className="mb-2 font-bold text-primary">{t(`${key}.title`)}</h3>
              <p className="mb-5 text-sm leading-relaxed text-primary/60">
                {t(`${key}.description`)}
              </p>
              <div className="mt-auto flex items-center justify-center rounded-2xl bg-primary py-8 text-background">
                <Illustration className="h-24 w-auto" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
