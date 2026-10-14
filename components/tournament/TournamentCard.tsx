"use client";

import { ArrowLeft, CalendarDays, Coins, Users } from "lucide-react";
import { formatTournamentDate, registrationOpen, type TournamentRow } from "@/lib/tournaments";
import { Club, Diamond, Heart, Spade, SuitRow } from "./CardSuits";

type TournamentCardProps = {
  tournament: TournamentRow;
  teamCount: number;
  href: string;
};

/**
 * بطاقة بطولة واحدة بمظهر زجاجي (liquid glass).
 *
 * التأثير الزجاجي يحتاج شيئاً **خلفه** ليُضبّبه: لو وُضع على خلفية مسطّحة لا يظهر منه
 * شيء. لذلك تحته طبقتان: لوح بني غامق، وفوقه هالتان ذهبيتان مموّهتان — فيصير للزجاج
 * لونٌ يكسره، وحدّ علويّ لامع يوحي بسماكته
 */
export default function TournamentCard({ tournament, teamCount, href }: TournamentCardProps) {
  const isOpen = registrationOpen(tournament);
  const seatsLeft =
    tournament.max_teams !== null ? Math.max(0, tournament.max_teams - teamCount) : null;

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-[#1C120B] p-3 shadow-glass-lg">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/70 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-[#B8793F]/70 blur-3xl"
      />
      <Spade size={120} className="pointer-events-none absolute -left-4 top-6 text-white/[0.04]" />
      <Diamond
        size={92}
        className="pointer-events-none absolute -right-3 bottom-8 text-white/[0.05]"
      />

      <a
        href={href}
        className="relative flex flex-col gap-5 rounded-[1.5rem] border border-white/15 bg-white/[0.07] p-6 backdrop-blur-2xl transition-transform active:scale-[0.985] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(0,0,0,0.25)]"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-[1.5rem] bg-gradient-to-b from-white/[0.12] to-transparent"
        />

        <div className="relative flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-background/85">
            {tournament.category}
          </span>
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
              isOpen ? "bg-emerald-400/15 text-emerald-200" : "bg-white/5 text-background/45"
            }`}
          >
            {isOpen && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-1.5 w-1.5 animate-ping rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
              </span>
            )}
            {isOpen ? "التسجيل مفتوح" : "انتهى التسجيل"}
          </span>
        </div>

        <div className="relative">
          <SuitRow size={13} className="mb-3 text-accent/70" />
          <h2 className="text-[26px] font-black leading-[1.2] text-background sm:text-[28px]">
            {tournament.title}
          </h2>
        </div>

        <div className="relative flex flex-col gap-2.5 border-t border-white/10 pt-4">
          <p className="flex items-center gap-2.5 text-[13px] font-medium text-background/70">
            <CalendarDays size={15} className="shrink-0 text-accent" />
            {formatTournamentDate(tournament.starts_at)}
          </p>
          <p className="flex items-center gap-2.5 text-[13px] font-medium text-background/70">
            <Coins size={15} className="shrink-0 text-accent" />
            الاشتراك {tournament.entry_fee.toLocaleString("en-US")} د.ع للفريق
          </p>
          <p className="flex items-center gap-2.5 text-[13px] font-medium text-background/70">
            <Users size={15} className="shrink-0 text-accent" />
            {seatsLeft === null
              ? `${teamCount.toLocaleString("en-US")} فريق مسجَّل`
              : `${teamCount.toLocaleString("en-US")} من ${tournament.max_teams!.toLocaleString("en-US")} — متبقٍ ${seatsLeft.toLocaleString("en-US")}`}
          </p>
        </div>

        <span className="relative flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-accent px-6 text-sm font-black text-[#1C120B] [box-shadow:inset_0_1px_0_rgba(255,255,255,0.45)]">
          {isOpen ? "سجّل فريقك الآن" : "تفاصيل البطولة"}
          <ArrowLeft size={16} className="ltr:rotate-180" />
        </span>

        <Heart size={76} className="pointer-events-none absolute -bottom-2 left-2 text-white/[0.03]" />
        <Club size={64} className="pointer-events-none absolute right-3 top-20 text-white/[0.03]" />
      </a>
    </div>
  );
}
