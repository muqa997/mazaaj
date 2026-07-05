"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { MapPin, Clock, Navigation, Instagram, Facebook } from "lucide-react";
import { fadeUp } from "@/lib/motion";
import { SOCIAL_LINKS, MAP_EMBED_URL, MAP_DIRECTIONS_URL } from "@/lib/config";
import TikTokIcon from "@/components/icons/TikTokIcon";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";

export default function ContactSocial() {
  const t = useTranslations("contact");

  return (
    <section id="contact" className="bg-primary/[0.03] px-6 py-20">
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
        <h2 className="mb-10 text-3xl font-extrabold text-primary sm:text-4xl">
          {t("title")}
        </h2>

        <div className="mb-10 grid w-full gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-background px-5 py-4 text-start">
            <MapPin size={20} className="shrink-0 text-accent" />
            <div>
              <p className="text-xs text-primary/50">{t("addressLabel")}</p>
              <p className="text-sm font-semibold text-primary">{t("address")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-background px-5 py-4 text-start">
            <Clock size={20} className="shrink-0 text-accent" />
            <div>
              <p className="text-xs text-primary/50">{t("hoursLabel")}</p>
              <p className="text-sm font-semibold text-primary">{t("hours")}</p>
            </div>
          </div>
        </div>

        <div className="relative mb-10 w-full overflow-hidden rounded-3xl border border-primary/10 shadow-glass-lg">
          <iframe
            src={MAP_EMBED_URL}
            title="mazaaj location"
            width="100%"
            height="280"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block grayscale-[15%]"
          />
          <a
            href={MAP_DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 start-4 flex items-center gap-2 rounded-full bg-background px-5 py-3 text-sm font-semibold text-primary shadow-glass-lg transition-transform active:scale-95"
          >
            <Navigation size={16} className="text-accent" />
            {t("getDirections")}
          </a>
        </div>

        <p className="mb-4 text-sm font-semibold text-primary/60">
          {t("socialLabel")}
        </p>
        <div className="flex items-center gap-3">
          <a
            href={SOCIAL_LINKS.instagram}
            aria-label="Instagram"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-primary/60 shadow-glass transition-colors hover:bg-accent hover:text-primary"
          >
            <Instagram size={18} strokeWidth={1.5} />
          </a>
          <a
            href={SOCIAL_LINKS.facebook}
            aria-label="Facebook"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-primary/60 shadow-glass transition-colors hover:bg-accent hover:text-primary"
          >
            <Facebook size={18} strokeWidth={1.5} />
          </a>
          <a
            href={SOCIAL_LINKS.tiktok}
            aria-label="TikTok"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-primary/60 shadow-glass transition-colors hover:bg-accent hover:text-primary"
          >
            <TikTokIcon size={16} />
          </a>
          <a
            href={SOCIAL_LINKS.whatsapp}
            aria-label="WhatsApp"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-primary/60 shadow-glass transition-colors hover:bg-accent hover:text-primary"
          >
            <WhatsAppIcon size={18} strokeWidth={1.5} />
          </a>
        </div>
      </motion.div>
    </section>
  );
}
