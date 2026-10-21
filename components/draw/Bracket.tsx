"use client";

import { Check, Shuffle } from "lucide-react";
import { isPlayable, type Bracket, type BracketMatch } from "@/lib/draw";

type BracketViewProps = {
  bracket: Bracket;
  /** الخانة التي ستملؤها الدورة القادمة — تُبرز أثناء القرعة فقط */
  nextSlot: { matchId: number; side: 0 | 1 } | null;
  /** بعد اكتمال القرعة: الضغط على فريق يُصعّده للدور التالي */
  onPickWinner?: (matchId: number, team: string) => void;
  /** القرعة اليدوية: الأسماء تُكتب داخل خانات الشجرة مباشرة */
  onEditTeam?: (matchId: number, side: 0 | 1, value: string) => void;
  /** زر العجلة على مباراة جاهزة: يسحب فائزها تلقائياً أمام الحضور */
  onSpinMatch?: (matchId: number) => void;
  compact?: boolean;
};

function SlotRow({
  match,
  side,
  isNext,
  canPick,
  onPick,
  onEdit,
  compact,
}: {
  match: BracketMatch;
  side: 0 | 1;
  isNext: boolean;
  canPick: boolean;
  onPick?: (team: string) => void;
  onEdit?: (value: string) => void;
  compact: boolean;
}) {
  const slot = match.slots[side];
  const name = slot.team;
  const decided = match.winner !== null;
  const isWinner = decided && name !== null && match.winner === name;
  const isLoser = decided && name !== null && match.winner !== name;

  const height = compact ? "min-h-[30px]" : "min-h-[38px]";
  const text = compact ? "text-[12px]" : "text-[14px]";

  // القرعة اليدوية: خانة البداية حقل كتابة. تبقى قابلة للتعديل بعد الكتابة (خطأ
  // إملائي بالاسم يُصحَّح بلا إعادة القرعة)، وتُقفل فور أن تُحسم المباراة
  if (onEdit && slot.fromMatch === null) {
    return (
      <div className={`flex ${height} items-center gap-1.5`}>
        {/* الاسم يبقى قابلاً للتصحيح، وبجانبه زر الفوز فور أن يكتمل طرفا المباراة —
            فالحسم اليدوي متاح هنا تماماً كما هو متاح بالعجلة */}
        {canPick && (
          <button
            type="button"
            onClick={() => name && onPick?.(name)}
            aria-label={name ? `${name} فاز` : "اختر الفائز"}
            className={`flex ${height} w-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-black transition-colors ${
              isWinner
                ? "bg-emerald-400/25 text-emerald-200"
                : "bg-white/[0.07] text-[#F3EBE1]/40 hover:bg-accent/25 hover:text-accent"
            }`}
          >
            ✓
          </button>
        )}
        <input
          value={name ?? ""}
          onChange={(e) => onEdit(e.target.value)}
          disabled={decided}
          maxLength={40}
          placeholder="اسم الفريق"
          aria-label={`اسم الفريق في مباراة ${match.id + 1}`}
          className={`w-full ${height} truncate rounded-lg px-2.5 ${text} font-black outline-none transition-colors ${
            isWinner
              ? "bg-emerald-400/20 text-emerald-200"
              : isLoser
                ? "bg-white/[0.03] text-[#F3EBE1]/30 line-through"
                : "border border-dashed border-white/15 bg-white/[0.06] text-[#F3EBE1] placeholder:font-bold placeholder:text-[#F3EBE1]/25 focus:border-accent focus:bg-white/[0.12]"
          }`}
        />
      </div>
    );
  }

  // خانة فارغة: إمّا تنتظر السحب، أو تنتظر فائز مباراة سابقة — ونقول أيّهما صراحةً
  if (!name) {
    const waitingFor = slot.fromMatch !== null;
    return (
      <div
        className={`flex ${height} items-center rounded-lg border border-dashed px-2.5 ${text} font-bold ${
          isNext
            ? "border-accent/70 bg-accent/10 text-accent"
            : "border-white/10 text-[#F3EBE1]/25"
        }`}
      >
        {isNext
          ? "التالي..."
          : waitingFor
            ? `فائز مباراة ${(slot.fromMatch! + 1).toLocaleString("en-US")}`
            : "—"}
      </div>
    );
  }

  const content = (
    <>
      <span className="truncate">{name}</span>
      {isWinner && <Check size={compact ? 13 : 15} className="shrink-0" />}
    </>
  );

  const base = `flex ${height} w-full items-center justify-between gap-2 rounded-lg px-2.5 ${text} font-black transition-all`;

  if (!canPick) {
    return (
      <div
        className={`${base} ${
          isWinner
            ? "bg-emerald-400/20 text-emerald-200"
            : isLoser
              ? "bg-white/[0.03] text-[#F3EBE1]/30 line-through"
              : "bg-white/[0.09] text-[#F3EBE1]"
        }`}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onPick?.(name)}
      aria-label={`${name} فاز`}
      className={`${base} ${
        isWinner
          ? "bg-emerald-400/20 text-emerald-200"
          : isLoser
            ? "bg-white/[0.03] text-[#F3EBE1]/30 line-through"
            : "bg-white/[0.09] text-[#F3EBE1] hover:bg-accent/20 active:scale-[0.98]"
      }`}
    >
      {content}
    </button>
  );
}

/**
 * شجرة البطولة: عمود لكل دور، الدور الأول يميناً والنهائي يساراً (اتجاه القراءة).
 *
 * كل مباراة تُظهر صراحةً من يلاعب من، والخانة التي تنتظر فائزاً تقول «فائز مباراة 3»
 * بدل شرطة صامتة — فيعرف الحضور إلى أي دور صعد المتأهل مباشرةً ومن سيواجه.
 */
export default function BracketView({
  bracket,
  nextSlot,
  onPickWinner,
  onEditTeam,
  onSpinMatch,
  compact = false,
}: BracketViewProps) {
  return (
    <div className="flex h-full gap-3 overflow-x-auto overflow-y-hidden pb-1">
      {bracket.rounds.map((round, roundIndex) => (
        <div
          key={round.name + roundIndex}
          className="flex min-w-[180px] flex-1 shrink-0 flex-col lg:min-w-[200px]"
        >
          <div className="mb-2 flex shrink-0 items-center gap-2">
            <h3
              className={`whitespace-nowrap text-[11px] font-black ${
                roundIndex === bracket.rounds.length - 1 ? "text-amber-300" : "text-accent"
              }`}
            >
              {round.name}
            </h3>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <div className="flex flex-1 flex-col justify-around gap-2 overflow-y-auto">
            {round.matchIds.map((matchId) => {
              const match = bracket.matches[matchId];
              const canPick = Boolean(onPickWinner) && isPlayable(match);
              return (
                <div
                  key={matchId}
                  className={`shrink-0 rounded-xl border p-1.5 transition-colors ${
                    nextSlot?.matchId === matchId
                      ? "border-accent/70 bg-accent/[0.08]"
                      : canPick && match.winner === null
                        ? "border-white/20 bg-white/[0.05]"
                        : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-2 px-1">
                    <span className="text-[9px] font-black text-[#F3EBE1]/30">
                      مباراة {(matchId + 1).toLocaleString("en-US")}
                    </span>
                    {canPick && match.winner === null && (
                      onSpinMatch ? (
                        <button
                          type="button"
                          onClick={() => onSpinMatch(matchId)}
                          className="flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-black text-accent"
                        >
                          <Shuffle size={10} />
                          بالعجلة
                        </button>
                      ) : (
                        <span className="text-[9px] font-black text-accent/80">اختر الفائز</span>
                      )
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    {([0, 1] as const).map((side) => (
                      <SlotRow
                        key={side}
                        match={match}
                        side={side}
                        isNext={nextSlot?.matchId === matchId && nextSlot.side === side}
                        canPick={canPick}
                        onPick={(team) => onPickWinner?.(matchId, team)}
                        onEdit={
                          onEditTeam ? (value) => onEditTeam(matchId, side, value) : undefined
                        }
                        compact={compact}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
