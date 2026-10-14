"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { TournamentRow } from "@/lib/tournaments";
import TournamentCard from "./TournamentCard";
import { SuitRow } from "./CardSuits";

type TournamentListProps = {
  tournaments: TournamentRow[];
  teamCounts: Record<string, number>;
};

// تُعرض حين تكون هناك أكثر من بطولة معلنة: قائمة بطاقات، كل بطاقة تفتح صفحة بطولتها.
// ببطولة واحدة لا تُستخدم هذه الصفحة أصلاً — تُفتح صفحة البطولة مباشرة بلا خطوة زائدة
export default function TournamentList({ tournaments, teamCounts }: TournamentListProps) {
  return (
    <main className="mx-auto w-full max-w-md pb-16">
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-[#1C120B] px-6 pb-10 pt-10 text-center">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-accent/55 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[#B8793F]/60 blur-3xl"
        />
        <div className="relative">
          <Image
            src="/mazaaj-logo-white.png"
            alt="كافيه مزاج"
            width={96}
            height={78}
            priority
            className="mx-auto mb-7 opacity-90"
          />
          <SuitRow size={14} className="mb-4 justify-center text-accent/75" />
          <h1 className="text-[32px] font-black leading-[1.15] text-background">البطولات</h1>
          <p className="mx-auto mt-2.5 max-w-[26ch] text-[13px] leading-relaxed text-background/55">
            اختر البطولة التي تريد التسجيل فيها
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-5 px-6 pt-7">
        {tournaments.map((tournament, i) => (
          <motion.div
            key={tournament.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
          >
            <TournamentCard
              tournament={tournament}
              teamCount={teamCounts[tournament.id] ?? 0}
              href={`/tournament/${tournament.id}`}
            />
          </motion.div>
        ))}
      </section>

      <div className="mt-12 flex flex-col items-center gap-3">
        <SuitRow size={13} className="text-primary/15" />
        <p className="text-[11px] font-bold text-primary/25">كافيه مزاج</p>
      </div>
    </main>
  );
}
