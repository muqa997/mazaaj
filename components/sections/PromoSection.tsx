"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { fadeUp } from "@/lib/motion";
import type { MenuCategory } from "@/lib/menu-data";

export default function PromoSection({
  sectionId,
  eyebrow,
  title,
  description,
  ctaLabel,
  imageUrl,
  targetCategory,
}: {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  imageUrl: string | null;
  targetCategory: MenuCategory | null;
}) {
  if (!imageUrl) return null;

  const orderHref = targetCategory ? `/order?category=${targetCategory}` : "/order";

  return (
    <section id={sectionId} className="bg-primary/[0.03] px-6 py-20">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mx-auto flex max-w-md flex-col items-center text-center"
      >
        <span className="mb-3 text-sm font-semibold tracking-[0.3em] text-accent">
          {eyebrow}
        </span>
        <h2 className="mb-5 text-3xl font-extrabold text-primary sm:text-4xl">{title}</h2>
        <p className="mb-8 max-w-md text-base leading-loose text-primary/60">
          {description}
        </p>

        <div className="mb-8 aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-glass">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
        </div>

        <motion.div whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.03 }} transition={{ duration: 0.15 }}>
          <Link
            href={orderHref}
            className="flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-semibold text-background shadow-glass"
          >
            {ctaLabel}
            <ArrowLeft size={18} className="ltr:rotate-180" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
