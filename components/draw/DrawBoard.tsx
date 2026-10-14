"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  Shuffle,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  bracketSizeFor,
  buildMatches,
  pickRandomIndex,
  roundNames,
  slotOrder,
  type DrawMatch,
} from "@/lib/draw";
import { teamLabel, type TournamentRow, type TournamentTeamRow } from "@/lib/tournaments";
import Wheel from "./Wheel";

type DrawBoardProps = {
  tournaments: TournamentRow[];
  tournamentTeams: TournamentTeamRow[];
  onExit: () => void;
};

type Phase = "setup" | "drawing" | "done";

/**
 * كل حالة القرعة بكائن واحد عن قصد.
 *
 * كانت موزّعة على عدة useState، وكان تثبيت اسم مسحوب يستدعي setState داخل setState —
 * وهذا غير نقيّ، فتُنفَّذ الدالة أكثر من مرة (React يفعل ذلك عمداً أثناء التطوير)
 * فيُوضع الفريق الواحد في مباراتين. بكائن واحد يصير كل تغيير حسبةً نقيّة من الحالة
 * السابقة، فلا يضرّ تكرار تنفيذها.
 */
type DrawState = {
  entrants: string[];
  remaining: string[];
  matches: DrawMatch[];
  phase: Phase;
  lastPicked: string | null;
};

const EMPTY: DrawState = {
  entrants: [],
  remaining: [],
  matches: [],
  phase: "setup",
  lastPicked: null,
};

const STORAGE_KEY = "mazaaj-draw-v1";
const MIN_TEAMS = 2;
const MAX_TEAMS = 32;

const countFilled = (matches: DrawMatch[]) =>
  matches.reduce((n, m) => n + m.teams.filter(Boolean).length, 0);

function loadSaved(): DrawState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DrawState;
    if (!Array.isArray(parsed.entrants) || !Array.isArray(parsed.matches)) return null;
    return { ...EMPTY, ...parsed };
  } catch {
    return null;
  }
}

/**
 * شاشة القرعة — تُعرض ملء الشاشة على تلفاز الكافيه عبر HDMI.
 *
 * العجلة يساراً والمربعات يميناً. كل دورة تسحب فريقاً وتضعه في **الخانة التالية
 * بالترتيب** من المباراة الأولى إلى الأخيرة، فلا يتدخل أحد في وجهة أي اسم.
 *
 * الحالة تُحفظ بالمتصفح بعد كل تغيير: لو انطفأت الشاشة أو أُغلق المتصفح وسط القرعة،
 * تُستأنف من حيث وقفت بدل إعادتها من الصفر أمام الحضور.
 */
export default function DrawBoard({ tournaments, tournamentTeams, onExit }: DrawBoardProps) {
  const [state, setState] = useState<DrawState>(EMPTY);
  const [spinningTo, setSpinningTo] = useState<number | null>(null);
  const [manualName, setManualName] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hydrated = useRef(false);
  const spinTargetRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const { entrants, remaining, matches, phase, lastPicked } = state;

  // استعادة قرعة غير مكتملة
  useEffect(() => {
    const saved = loadSaved();
    if (saved) setState(saved);
    hydrated.current = true;
  }, []);

  // الحفظ بعد كل تغيير — لا دورياً، فلا تضيع أي خطوة
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // الوضع الخاص بالمتصفح يمنع الحفظ — القرعة تبقى شغّالة بالذاكرة
    }
  }, [state]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await rootRef.current?.requestFullscreen();
    } catch {
      // بعض المتصفحات ترفض ملء الشاشة بلا لمسة مباشرة — الزر نفسه هو اللمسة
    }
  };

  const addName = (raw: string) => {
    const name = raw.trim().replace(/\s+/g, " ");
    if (!name) return;
    setState((prev) =>
      prev.entrants.length >= MAX_TEAMS || prev.entrants.includes(name)
        ? prev
        : { ...prev, entrants: [...prev.entrants, name] }
    );
  };

  const removeName = (name: string) =>
    setState((prev) => ({ ...prev, entrants: prev.entrants.filter((n) => n !== name) }));

  const startDraw = () =>
    setState((prev) =>
      prev.entrants.length < MIN_TEAMS
        ? prev
        : {
            ...prev,
            matches: buildMatches(prev.entrants.length),
            remaining: prev.entrants,
            lastPicked: null,
            phase: "drawing",
          }
    );

  const resetAll = () => {
    if (!confirm("إعادة القرعة من البداية؟ ستُمسح كل الأسماء المسحوبة.")) return;
    setSpinningTo(null);
    spinTargetRef.current = null;
    setState((prev) => ({ ...EMPTY, entrants: prev.entrants }));
  };

  const order = useMemo(() => slotOrder(matches), [matches]);
  const filledCount = countFilled(matches);
  const nextSlot = order[filledCount] ?? null;

  const spin = () => {
    if (spinningTo !== null || remaining.length === 0 || !nextSlot) return;
    const target = pickRandomIndex(remaining.length);
    spinTargetRef.current = target;
    setSpinningTo(target);
  };

  // تُستدعى بعد توقف العجلة. حسبة نقيّة واحدة من الحالة السابقة: تُثبّت الاسم بخانته
  // وتحذفه من العجلة، فلا يمكن أن يُوضع الفريق مرتين مهما تكرر تنفيذها
  const handleSpinEnd = () => {
    const picked = spinTargetRef.current;
    spinTargetRef.current = null;
    setSpinningTo(null);
    if (picked === null) return;

    setState((prev) => {
      const name = prev.remaining[picked];
      if (name === undefined) return prev;

      const slots = slotOrder(prev.matches);
      const slot = slots[countFilled(prev.matches)];
      if (!slot) return prev;

      const nextMatches = prev.matches.map((m) =>
        m.number === slot.match
          ? {
              ...m,
              teams: m.teams.map((t, i) => (i === slot.side ? name : t)) as [
                string | null,
                string | null,
              ],
            }
          : m
      );

      return {
        ...prev,
        matches: nextMatches,
        remaining: prev.remaining.filter((_, i) => i !== picked),
        lastPicked: name,
        phase: countFilled(nextMatches) >= slots.length ? "done" : prev.phase,
      };
    });
  };

  const bracketSize = entrants.length >= MIN_TEAMS ? bracketSizeFor(entrants.length) : 0;
  const byeCount = bracketSize > 0 ? bracketSize - entrants.length : 0;
  const rounds = entrants.length >= MIN_TEAMS ? roundNames(entrants.length) : [];

  // مع كثرة المباريات نوزّعها على أعمدة أكثر فتبقى داخل الشاشة بلا تمرير
  const matchColumns = matches.length > 12 ? 3 : matches.length > 5 ? 2 : 1;

  return (
    <div
      ref={rootRef}
      dir="rtl"
      className="fixed inset-0 z-[100] overflow-hidden bg-[#140E0A] text-[#F3EBE1]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-accent/25 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-40 h-[32rem] w-[32rem] rounded-full bg-[#B8793F]/25 blur-3xl"
      />

      {/* ═══ شريط التحكم ═══ */}
      <div className="relative z-30 flex h-16 items-center justify-between gap-3 px-6">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-black tracking-tight">قرعة البطولة</h1>
          {phase !== "setup" && (
            <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-bold tabular-nums text-[#F3EBE1]/70">
              {filledCount.toLocaleString("en-US")} / {order.length.toLocaleString("en-US")}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "خروج من ملء الشاشة" : "ملء الشاشة"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#F3EBE1]/80"
          >
            {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
          {phase !== "setup" && (
            <button
              type="button"
              onClick={resetAll}
              aria-label="إعادة القرعة"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#F3EBE1]/80"
            >
              <RotateCcw size={17} />
            </button>
          )}
          {!isFullscreen && (
            <button
              type="button"
              onClick={onExit}
              aria-label="إغلاق القرعة"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#F3EBE1]/80"
            >
              <X size={17} />
            </button>
          )}
        </div>
      </div>

      {/* ═══ الإعداد: بناء قائمة الفرق قبل العرض ═══ */}
      {phase === "setup" ? (
        <div className="relative z-10 mx-auto flex h-[calc(100%-4rem)] w-full max-w-3xl flex-col gap-4 overflow-y-auto px-6 pb-6">
          <div className="flex gap-2">
            <input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addName(manualName);
                  setManualName("");
                }
              }}
              maxLength={40}
              placeholder="اسم الفريق أو اللاعبين"
              className="min-h-[52px] flex-1 rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-base font-bold text-[#F3EBE1] outline-none placeholder:font-normal placeholder:text-[#F3EBE1]/30 focus:border-accent"
            />
            <button
              type="button"
              onClick={() => {
                addName(manualName);
                setManualName("");
              }}
              className="flex min-h-[52px] items-center gap-2 rounded-2xl bg-accent px-5 text-sm font-black text-[#1C120B]"
            >
              <Plus size={18} />
              إضافة
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] text-sm font-black text-[#F3EBE1]/85"
          >
            <Users size={18} />
            اختيار من المشتركين
          </button>

          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-black">
              الفرق: {entrants.length.toLocaleString("en-US")}
            </span>
            {entrants.length >= MIN_TEAMS && (
              <span className="text-xs font-bold text-[#F3EBE1]/50">
                شجرة {bracketSize.toLocaleString("en-US")}
                {byeCount === 1 && " — فريق واحد يتأهل مباشرة لدور واحد"}
                {byeCount === 2 && " — فريقان يتأهلان مباشرة لدور واحد"}
                {byeCount > 2 &&
                  ` — ${byeCount.toLocaleString("en-US")} فرق تتأهل مباشرة لدور واحد`}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {entrants.map((name) => (
              <span
                key={name}
                className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] py-2 pe-2 ps-4 text-sm font-bold"
              >
                {name}
                <button
                  type="button"
                  onClick={() => removeName(name)}
                  aria-label={`حذف ${name}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[#F3EBE1]/60"
                >
                  <X size={13} />
                </button>
              </span>
            ))}
            {entrants.length === 0 && (
              <p className="py-6 text-sm text-[#F3EBE1]/35">
                أضف الفرق يدوياً أو اسحبها من قائمة المشتركين
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={startDraw}
            disabled={entrants.length < MIN_TEAMS}
            className="mt-auto flex min-h-[60px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-accent text-lg font-black text-[#1C120B] disabled:opacity-35"
          >
            <Shuffle size={20} />
            ابدأ القرعة
          </button>
        </div>
      ) : (
        /* ═══ القرعة: العجلة يساراً والمربعات يميناً ═══ */
        <div className="relative z-10 flex h-[calc(100%-4rem)] gap-6 px-6 pb-6 max-lg:flex-col-reverse max-lg:overflow-y-auto">
          {/* المربعات */}
          <div className="order-1 flex min-w-0 flex-1 flex-col lg:overflow-hidden">
            <div className="mb-3 flex shrink-0 items-center gap-2.5">
              <h2 className="text-sm font-black text-accent">{rounds[0] ?? "الدور الأول"}</h2>
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] font-bold text-[#F3EBE1]/40">
                {rounds.slice(1).join(" ← ")}
              </span>
            </div>

            <div
              className="grid flex-1 content-start gap-2.5 lg:overflow-y-auto"
              style={{ gridTemplateColumns: `repeat(${matchColumns}, minmax(0, 1fr))` }}
            >
              {matches.map((match) => {
                const isNext = nextSlot?.match === match.number;
                return (
                  <div
                    key={match.number}
                    className={`rounded-2xl border p-2.5 transition-colors ${
                      isNext
                        ? "border-accent/70 bg-accent/[0.08]"
                        : "border-white/10 bg-white/[0.04]"
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black text-[#F3EBE1]/35">
                        مباراة {match.number.toLocaleString("en-US")}
                      </span>
                      {match.isBye && (
                        <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[9px] font-black text-emerald-300">
                          يتأهل مباشرة
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {([0, 1] as const).map((side) => {
                        if (match.isBye && side === 1) return null;
                        const name = match.teams[side];
                        const isTarget =
                          nextSlot?.match === match.number && nextSlot.side === side;
                        return (
                          <div
                            key={side}
                            className={`flex min-h-[40px] items-center truncate rounded-xl px-3 text-[15px] font-black ${
                              name
                                ? "bg-white/[0.09] text-[#F3EBE1]"
                                : isTarget
                                  ? "border border-dashed border-accent/60 bg-accent/[0.06] text-accent/70"
                                  : "border border-dashed border-white/10 text-[#F3EBE1]/20"
                            }`}
                          >
                            {name ?? (isTarget ? "التالي..." : "—")}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* العجلة */}
          <div className="order-2 flex w-full shrink-0 flex-col items-center justify-center gap-4 lg:w-[40%] lg:max-w-[520px]">
            {/* بانتهاء القرعة تُخفى العجلة الفارغة: لا معنى لعرض دائرة بلا أسماء، ولا
                لرسالة «أضف الفرق أولاً» وقد اكتملت الشجرة أمام الحضور */}
            {phase === "done" ? (
              <div className="flex w-full max-w-[420px] flex-col items-center gap-4 rounded-3xl border border-emerald-400/30 bg-emerald-400/[0.07] px-6 py-12 text-center">
                <span className="text-3xl font-black text-emerald-300">اكتملت القرعة</span>
                <span className="text-sm font-bold text-[#F3EBE1]/55">
                  {order.length.toLocaleString("en-US")} فريق موزّعة على{" "}
                  {matches.length.toLocaleString("en-US")} مباراة
                </span>
              </div>
            ) : (
              <div className="w-full max-w-[420px] px-2">
                <Wheel names={remaining} spinningTo={spinningTo} onSpinEnd={handleSpinEnd} />
              </div>
            )}

            {lastPicked && spinningTo === null && phase !== "done" && (
              <p className="max-w-full truncate rounded-2xl border border-accent/40 bg-accent/10 px-6 py-2.5 text-center text-xl font-black text-accent">
                {lastPicked}
              </p>
            )}

            {phase === "done" ? null : (
              <button
                type="button"
                onClick={spin}
                disabled={spinningTo !== null || remaining.length === 0}
                className="flex min-h-[64px] w-full max-w-[340px] items-center justify-center gap-2.5 rounded-2xl bg-accent text-xl font-black text-[#1C120B] transition-transform active:scale-[0.98] disabled:opacity-40"
              >
                <Shuffle size={22} />
                {spinningTo !== null ? "..." : "دوّر العجلة"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ═══ اختيار المشتركين ═══ */}
      {pickerOpen && (
        <SubscriberPicker
          tournaments={tournaments}
          tournamentTeams={tournamentTeams}
          chosen={entrants}
          onAdd={addName}
          onRemove={removeName}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function SubscriberPicker({
  tournaments,
  tournamentTeams,
  chosen,
  onAdd,
  onRemove,
  onClose,
}: {
  tournaments: TournamentRow[];
  tournamentTeams: TournamentTeamRow[];
  chosen: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  onClose: () => void;
}) {
  const [tournamentId, setTournamentId] = useState(tournaments[0]?.id ?? "");
  const teams = tournamentTeams.filter((t) => t.tournament_id === tournamentId);

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[#140E0A]/95 backdrop-blur-xl">
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-6">
        <h2 className="text-base font-black">المشتركون</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06]"
          aria-label="إغلاق"
        >
          <X size={17} />
        </button>
      </div>

      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-6 py-4">
        <select
          value={tournamentId}
          onChange={(e) => setTournamentId(e.target.value)}
          className="mb-4 min-h-[52px] w-full rounded-2xl border border-white/15 bg-[#1C120B] px-4 text-base font-bold text-[#F3EBE1] outline-none"
        >
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>

        {teams.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#F3EBE1]/35">
            لا يوجد مشتركون بهذه البطولة
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {teams.map((team) => {
              const label = teamLabel(team);
              const added = chosen.includes(label);
              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => (added ? onRemove(label) : onAdd(label))}
                  className={`flex min-h-[52px] items-center justify-between gap-3 rounded-2xl border px-4 text-start text-[15px] font-bold ${
                    added
                      ? "border-accent/60 bg-accent/10 text-accent"
                      : "border-white/12 bg-white/[0.05] text-[#F3EBE1]/85"
                  }`}
                >
                  {label}
                  {added ? <Trash2 size={16} /> : <Plus size={18} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/10 px-6 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-accent text-base font-black text-[#1C120B]"
        >
          تم — {chosen.length.toLocaleString("en-US")} فريق
        </button>
      </div>
    </div>
  );
}
