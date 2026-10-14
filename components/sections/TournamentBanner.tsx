"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import type { TournamentRow } from "@/lib/tournaments";
import TournamentCard from "@/components/tournament/TournamentCard";
import { SuitRow } from "@/components/tournament/CardSuits";

type TournamentBannerProps = {
  tournaments: TournamentRow[];
  teamCounts: Record<string, number>;
};

// قسم البطولات أعلى الصفحة الرئيسية (فوق "الأكثر طلباً") — بطاقة زجاجية لكل بطولة
// معلنة. الروابط عادية <a> وليست Link الخاص بـ next-intl، لأن /tournament خارج
// مسارات اللغة.
//
// ببطولة واحدة تُفتح صفحتها مباشرة؛ بأكثر من واحدة تفتح كل بطاقة صفحة بطولتها
export default function TournamentBanner({ tournaments, teamCounts }: TournamentBannerProps) {
  if (tournaments.length === 0) return null;

  const single = tournaments.length === 1;

  return (
    <section id="tournament" className="px-6 pt-12">
      {!single && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          className="mx-auto mb-5 flex max-w-md flex-col items-center gap-2.5 text-center"
        >
          <SuitRow size={13} className="text-accent" />
          <h2 className="text-2xl font-extrabold text-primary">بطولات مزاج</h2>
          {/* العربية تثنّي ثم تجمع: «بطولتان» للاثنتين و«بطولات» لثلاث فأكثر */}
          <p className="text-[13px] text-primary/50">
            {tournaments.length === 2
              ? "بطولتان مفتوحتان للتسجيل"
              : `${tournaments.length.toLocaleString("en-US")} بطولات مفتوحة للتسجيل`}
          </p>
        </motion.div>
      )}

      <div className="mx-auto flex max-w-md flex-col gap-5">
        {tournaments.map((tournament, i) => (
          <motion.div
            key={tournament.id}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            transition={{ delay: i * 0.07 }}
          >
            <TournamentCard
              tournament={tournament}
              teamCount={teamCounts[tournament.id] ?? 0}
              href={single ? "/tournament" : `/tournament/${tournament.id}`}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
