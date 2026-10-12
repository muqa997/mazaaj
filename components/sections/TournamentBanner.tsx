"use client";

import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Coins, Trophy } from "lucide-react";
import { fadeUp } from "@/lib/motion";
import { formatTournamentDate } from "@/lib/tournaments";

type TournamentBannerProps = {
  title: string;
  category: string;
  startsAt: string;
  entryFee: number;
  registrationOpen: boolean;
};

// قسم البطولة أعلى الصفحة الرئيسية (فوق "الأكثر طلباً") — بطاقة واحدة قابلة للضغط
// تفتح صفحة البطولة المستقلة. رابط عادي <a> وليس Link الخاص بـ next-intl، لأن
// /tournament خارج مسارات اللغة
export default function TournamentBanner({
  title,
  category,
  startsAt,
  entryFee,
  registrationOpen,
}: TournamentBannerProps) {
  return (
    <section id="tournament" className="px-6 pt-10">
      <motion.a
        href="/tournament"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        whileTap={{ scale: 0.98 }}
        className="mx-auto flex max-w-md flex-col gap-4 rounded-3xl bg-primary p-6 shadow-glass-lg"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-background/15 px-3 py-1 text-[11px] font-bold text-background">
            {category}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-bold ${
              registrationOpen
                ? "bg-green-400/20 text-green-200"
                : "bg-background/10 text-background/50"
            }`}
          >
            {registrationOpen ? "التسجيل مفتوح" : "انتهى التسجيل"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/20">
            <Trophy size={24} className="text-accent" />
          </span>
          <h2 className="text-xl font-extrabold text-background sm:text-2xl">{title}</h2>
        </div>

        <div className="flex flex-col gap-2 border-t border-background/15 pt-4">
          <p className="flex items-center gap-2 text-xs text-background/70">
            <CalendarDays size={14} className="shrink-0 text-accent" />
            {formatTournamentDate(startsAt)}
          </p>
          <p className="flex items-center gap-2 text-xs text-background/70">
            <Coins size={14} className="shrink-0 text-accent" />
            الاشتراك {entryFee.toLocaleString("en-US")} د.ع للفريق
          </p>
        </div>

        <span className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-primary">
          {registrationOpen ? "سجّل فريقك الآن" : "تفاصيل البطولة"}
          <ArrowLeft size={16} className="ltr:rotate-180" />
        </span>
      </motion.a>
    </section>
  );
}
