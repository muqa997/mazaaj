"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Maximize2, Minimize2, RotateCcw, Trophy, X } from "lucide-react";
import {
  buildBracket,
  describeFormat,
  isPlayable,
  pickRandomIndex,
  setWinner,
  type Bracket,
  type MatchSlot,
} from "@/lib/draw";
import { playFanfare, playPicked, unlockAudio } from "@/lib/draw-sounds";
import BracketView from "./Bracket";
import ChampionOverlay from "./ChampionOverlay";
import Wheel from "./Wheel";

type ManualDrawBoardProps = { onExit: () => void };

type ManualState = {
  teamCount: number;
  bracket: Bracket | null;
  tournamentTitle: string;
};

const STORAGE_KEY = "mazaaj-manual-bracket-v1";
const MIN_TEAMS = 2;
const MAX_TEAMS = 32;
const COUNTS = Array.from({ length: MAX_TEAMS - MIN_TEAMS + 1 }, (_, i) => i + MIN_TEAMS);

const EMPTY: ManualState = { teamCount: 0, bracket: null, tournamentTitle: "" };

function loadSaved(): ManualState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ManualState;
    return parsed && parsed.bracket ? { ...EMPTY, ...parsed } : null;
  } catch {
    return null;
  }
}

/**
 * القرعة اليدوية: تُرسم الشجرة من عدد الفرق، ثم تُكتب الأسماء بالخانات مباشرة.
 *
 * تُحفظ بمفتاح مستقل عن قرعة العجلة، فبدء قرعة يدوية لا يمسّ قرعة عجلة جارية.
 * ويبقى الفوز يُحسم بطريقتين: ضغطة على الفريق، أو زر العجلة الذي يسحب فائز المباراة
 * أمام الحضور — فالمدير يختار بحسب الموقف بلا أن نفرض عليه واحدة
 */
export default function ManualDrawBoard({ onExit }: ManualDrawBoardProps) {
  const [state, setState] = useState<ManualState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState(8);
  const [spinMatch, setSpinMatch] = useState<number | null>(null);
  const [spinningTo, setSpinningTo] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const spinTargetRef = useRef<number | null>(null);

  const { bracket, teamCount, tournamentTitle } = state;

  useEffect(() => {
    const saved = loadSaved();
    if (saved) setState(saved);
    setLoaded(true);
    const unlock = () => unlockAudio();
    document.addEventListener("pointerdown", unlock, { once: true });
    return () => document.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // الوضع الخاص يمنع الحفظ — الشجرة تبقى شغّالة بالذاكرة
    }
  }, [state, loaded]);

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
      // بعض المتصفحات ترفض ملء الشاشة بلا لمسة مباشرة
    }
  };

  const build = () =>
    setState((prev) => ({ ...prev, teamCount: draft, bracket: buildBracket(draft) }));

  const resetAll = () => {
    if (!confirm("مسح الشجرة والأسماء والبدء من جديد؟")) return;
    setCelebrated(false);
    setCelebrationOpen(false);
    setState((prev) => ({ ...EMPTY, tournamentTitle: prev.tournamentTitle }));
  };

  const editTeam = (matchId: number, side: 0 | 1, value: string) =>
    setState((prev) => {
      if (!prev.bracket) return prev;
      const matches = prev.bracket.matches.map((m) =>
        m.id === matchId
          ? {
              ...m,
              slots: m.slots.map((s, i) => (i === side ? { ...s, team: value } : s)) as [
                MatchSlot,
                MatchSlot,
              ],
            }
          : m
      );
      // اسم فارغ يُلغي أي فوز بُني عليه؛ setWinner تتكفّل بتنظيف ما بعده
      return { ...prev, bracket: { ...prev.bracket, matches } };
    });

  const pickWinner = (matchId: number, team: string) =>
    setState((prev) =>
      prev.bracket
        ? {
            ...prev,
            bracket: setWinner(
              prev.bracket,
              matchId,
              prev.bracket.matches[matchId].winner === team ? null : team
            ),
          }
        : prev
    );

  // سحب فائز مباراة بالعجلة: الفائز يُختار بمولّد معمّى قبل الدوران، ثم تقف عليه
  const openSpin = (matchId: number) => {
    if (!bracket) return;
    unlockAudio();
    const target = pickRandomIndex(2);
    spinTargetRef.current = target;
    setSpinMatch(matchId);
    setSpinningTo(null);
    // تأخير قصير لتُرسم العجلة واقفة أولاً ثم تنطلق، وإلا ظهرت وهي على النتيجة.
    // بمؤقّت لا بـrequestAnimationFrame: الإطارات تتوقف تماماً إن كانت الشاشة مخفية
    // أو التبويب بالخلفية، فتعلق العجلة بلا دوران ولا نتيجة
    window.setTimeout(() => setSpinningTo(target), 60);
  };

  const finishSpin = () => {
    const matchId = spinMatch;
    const target = spinTargetRef.current;
    spinTargetRef.current = null;
    setSpinningTo(null);
    setSpinMatch(null);
    if (matchId === null || target === null || !bracket) return;
    const team = bracket.matches[matchId].slots[target as 0 | 1].team;
    if (team) {
      playPicked();
      pickWinner(matchId, team);
    }
  };

  const champion = bracket
    ? (bracket.matches[bracket.matches.length - 1]?.winner ?? null)
    : null;

  useEffect(() => {
    if (!champion || celebrated) return;
    setCelebrated(true);
    setCelebrationOpen(true);
    playFanfare();
  }, [champion, celebrated]);

  const spinNames =
    spinMatch !== null && bracket
      ? ([0, 1] as const).map((i) => bracket.matches[spinMatch].slots[i].team ?? "")
      : [];

  return (
    <div
      ref={rootRef}
      dir="rtl"
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#140E0A] text-[#F3EBE1]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-accent/25 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-40 h-[32rem] w-[32rem] rounded-full bg-[#B8793F]/25 blur-3xl"
      />

      <div className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-3 px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <h1 className="shrink-0 text-base font-black tracking-tight">قرعة يدوية</h1>
          {bracket && (
            <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-bold tabular-nums text-[#F3EBE1]/70">
              {teamCount.toLocaleString("en-US")} فريق
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "خروج من ملء الشاشة" : "ملء الشاشة"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#F3EBE1]/80"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          {bracket && (
            <button
              type="button"
              onClick={resetAll}
              aria-label="شجرة جديدة"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#F3EBE1]/80"
            >
              <RotateCcw size={16} />
            </button>
          )}
          {!isFullscreen && (
            <button
              type="button"
              onClick={onExit}
              aria-label="رجوع"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#F3EBE1]/80"
            >
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ═══ اختيار عدد الفرق ═══ */}
      {!bracket ? (
        <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 overflow-y-auto px-6 pb-6">
          <div>
            <p className="mb-1 text-sm font-black">كم فريقاً بالبطولة؟</p>
            <p className="text-xs text-[#F3EBE1]/45">تُرسم الشجرة فوراً، ثم تكتب الأسماء</p>
          </div>

          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDraft(n)}
                className={`flex h-12 items-center justify-center rounded-xl text-sm font-black tabular-nums transition-colors ${
                  draft === n
                    ? "bg-accent text-[#1C120B]"
                    : "border border-white/12 bg-white/[0.05] text-[#F3EBE1]/75"
                }`}
              >
                {n.toLocaleString("en-US")}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-accent/30 bg-accent/[0.07] p-4">
            <p className="text-sm font-black text-accent">{describeFormat(draft)}</p>
            <p className="mt-1.5 text-xs text-[#F3EBE1]/55">
              {buildBracket(draft).rounds.map((r) => r.name).join("  ←  ")}
            </p>
          </div>

          <button
            type="button"
            onClick={build}
            className="mt-auto flex min-h-[60px] shrink-0 items-center justify-center rounded-2xl bg-accent text-lg font-black text-[#1C120B]"
          >
            ارسم الشجرة
          </button>
        </div>
      ) : (
        /* ═══ الشجرة: الأسماء تُكتب، والفوز بضغطة أو بالعجلة ═══ */
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden px-5 pb-5">
          {champion ? (
            <button
              type="button"
              onClick={() => setCelebrationOpen(true)}
              className="mb-3 flex w-full shrink-0 items-center justify-center gap-3 rounded-2xl border border-amber-300/40 bg-amber-300/10 py-3"
            >
              <Trophy size={22} className="text-amber-300" />
              <span className="text-xl font-black text-amber-200">البطل: {champion}</span>
            </button>
          ) : (
            <p className="mb-2 shrink-0 text-center text-[11px] font-bold text-[#F3EBE1]/40">
              اكتب الأسماء بالخانات — ثم اضغط على الفائز، أو «بالعجلة» ليُسحب تلقائياً
            </p>
          )}

          <div className="min-h-0 flex-1">
            <BracketView
              bracket={bracket}
              nextSlot={null}
              onPickWinner={pickWinner}
              onEditTeam={editTeam}
              onSpinMatch={openSpin}
            />
          </div>

          {champion && celebrationOpen && (
            <ChampionOverlay
              champion={champion}
              tournamentTitle={tournamentTitle}
              onClose={() => setCelebrationOpen(false)}
            />
          )}
        </div>
      )}

      {/* ═══ عجلة مباراة واحدة ═══ */}
      {spinMatch !== null && spinNames.every(Boolean) && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#140E0A]/92 px-6 backdrop-blur-sm">
          <p className="text-center text-sm font-black text-accent">
            مباراة {(spinMatch + 1).toLocaleString("en-US")}
          </p>
          <div className="w-full max-w-[420px]">
            <Wheel names={spinNames} spinningTo={spinningTo} onSpinEnd={finishSpin} />
          </div>
          <button
            type="button"
            onClick={() => {
              spinTargetRef.current = null;
              setSpinningTo(null);
              setSpinMatch(null);
            }}
            className="flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 text-sm font-bold text-[#F3EBE1]/70"
          >
            <X size={16} />
            إلغاء
          </button>
        </div>
      )}
    </div>
  );
}
