"use client";

import { useEffect, useRef, useState } from "react";
import {
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  Shuffle,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";
import {
  buildBracket,
  countDrawn,
  describeFormat,
  pickRandomIndex,
  placeTeam,
  setWinner,
  type Bracket,
} from "@/lib/draw";
import { playFanfare, playPicked, unlockAudio } from "@/lib/draw-sounds";
import { teamLabel, type TournamentRow, type TournamentTeamRow } from "@/lib/tournaments";
import BracketView from "./Bracket";
import ChampionOverlay from "./ChampionOverlay";
import Wheel from "./Wheel";

type DrawBoardProps = {
  tournaments: TournamentRow[];
  tournamentTeams: TournamentTeamRow[];
  onExit: () => void;
};

type Phase = "setup" | "drawing" | "playing";

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
  bracket: Bracket | null;
  phase: Phase;
  lastPicked: string | null;
  /** القرعة تمشي وحدها بعد الضغطة الأولى — نحفظها فتُستأنف لو انطفأت الشاشة */
  auto: boolean;
  tournamentTitle: string;
};

const EMPTY: DrawState = {
  entrants: [],
  remaining: [],
  bracket: null,
  phase: "setup",
  lastPicked: null,
  auto: false,
  tournamentTitle: "",
};

/** وقفة بعد كل اسم ليقرأه الحضور قبل أن تدور العجلة من جديد */
const PAUSE_MS = 2700;

const STORAGE_KEY = "mazaaj-draw-v2";
const MIN_TEAMS = 2;
const MAX_TEAMS = 32;

function loadSaved(): DrawState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DrawState;
    if (!Array.isArray(parsed.entrants)) return null;
    return { ...EMPTY, ...parsed };
  } catch {
    return null;
  }
}

/**
 * شاشة القرعة — تُعرض ملء الشاشة على تلفاز الكافيه عبر HDMI.
 *
 * أثناء القرعة: العجلة يساراً والشجرة يميناً، وكل دورة تضع فريقاً في **الخانة التالية
 * بالترتيب** فلا يتدخل أحد في وجهة أي اسم. وبعد اكتمالها تختفي العجلة وتملأ الشجرة
 * الشاشة، فتُدار البطولة منها: ضغطة على الفائز تُصعّده ويبهت الخاسر.
 *
 * الحالة تُحفظ بالمتصفح بعد كل تغيير، فلو انطفأت الشاشة تُستأنف من حيث وقفت.
 */
export default function DrawBoard({ tournaments, tournamentTeams, onExit }: DrawBoardProps) {
  const [state, setState] = useState<DrawState>(EMPTY);
  const [spinningTo, setSpinningTo] = useState<number | null>(null);
  const [announce, setAnnounce] = useState<string | null>(null);
  const [celebrated, setCelebrated] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // علم حالة لا مرجع: المرجع يتغيّر فوراً، فكان مؤثّر الحفظ يعمل بنفس اللحظة التي
  // يعمل فيها مؤثّر الاستعادة — فيكتب الحالة الفارغة فوق قرعة محفوظة ويمحوها
  const [loaded, setLoaded] = useState(false);
  const spinTargetRef = useRef<number | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const { entrants, remaining, bracket, phase, lastPicked, auto, tournamentTitle } = state;

  useEffect(() => {
    const saved = loadSaved();
    if (saved) setState(saved);
    else setState((prev) => ({ ...prev, tournamentTitle: tournaments[0]?.title ?? "" }));
    setLoaded(true);
    // المتصفحات تكتم الصوت قبل أول لمسة على الصفحة
    const unlock = () => unlockAudio();
    document.addEventListener("pointerdown", unlock, { once: true });
    return () => document.removeEventListener("pointerdown", unlock);
  }, []);

  // الحفظ بعد كل تغيير — لا دورياً، فلا تضيع أي خطوة
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // الوضع الخاص بالمتصفح يمنع الحفظ — القرعة تبقى شغّالة بالذاكرة
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
            bracket: buildBracket(prev.entrants.length),
            remaining: prev.entrants,
            lastPicked: null,
            phase: "drawing",
            auto: false,
          }
    );

  const resetAll = () => {
    if (!confirm("إعادة القرعة من البداية؟ ستُمسح كل النتائج.")) return;
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    setSpinningTo(null);
    setAnnounce(null);
    spinTargetRef.current = null;
    setCelebrated(false);
    setCelebrationOpen(false);
    setState((prev) => ({
      ...EMPTY,
      entrants: prev.entrants,
      tournamentTitle: prev.tournamentTitle,
    }));
  };

  const drawnCount = bracket ? countDrawn(bracket) : 0;
  const totalSlots = bracket?.drawSlots.length ?? 0;
  const nextSlot = bracket?.drawSlots[drawnCount] ?? null;

  const spin = () => {
    if (spinningTo !== null || remaining.length === 0 || !nextSlot) return;
    unlockAudio();
    setAnnounce(null);
    const target = pickRandomIndex(remaining.length);
    spinTargetRef.current = target;
    setSpinningTo(target);
  };

  /** ضغطة واحدة فقط: تبدأ القرعة وتكملها وحدها حتى آخر فريق */
  const startAuto = () => {
    if (auto) return;
    unlockAudio();
    setState((prev) => ({ ...prev, auto: true }));
    spin();
  };

  // بعد كل وقفة تدور العجلة من جديد وحدها. الوقفة تُعطي الحضور وقتاً لقراءة الاسم
  // ورؤيته وهو يستقر بمكانه على الشجرة
  useEffect(() => {
    if (!auto || phase !== "drawing" || spinningTo !== null || remaining.length === 0) return;
    autoTimerRef.current = setTimeout(spin, PAUSE_MS);
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, phase, spinningTo, remaining.length]);

  // تُستدعى بعد توقف العجلة. حسبة نقيّة واحدة من الحالة السابقة: تُثبّت الاسم بخانته
  // وتحذفه من العجلة، فلا يمكن أن يُوضع الفريق مرتين مهما تكرر تنفيذها
  const handleSpinEnd = () => {
    const picked = spinTargetRef.current;
    spinTargetRef.current = null;
    setSpinningTo(null);
    if (picked === null) return;

    setState((prev) => {
      const name = prev.remaining[picked];
      if (name === undefined || !prev.bracket) return prev;

      const nextBracket = placeTeam(prev.bracket, name);
      const nextRemaining = prev.remaining.filter((_, i) => i !== picked);

      return {
        ...prev,
        bracket: nextBracket,
        remaining: nextRemaining,
        lastPicked: name,
        phase: nextRemaining.length === 0 ? "playing" : prev.phase,
      };
    });
  };

  // إعلان الاسم المسحوب فوق العجلة + نغمة الاختيار
  useEffect(() => {
    if (!lastPicked) return;
    setAnnounce(lastPicked);
    playPicked();
    const id = setTimeout(() => setAnnounce(null), 2600);
    return () => clearTimeout(id);
  }, [lastPicked]);

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

  const champion =
    phase === "playing" && bracket
      ? (bracket.matches[bracket.matches.length - 1]?.winner ?? null)
      : null;

  useEffect(() => {
    if (!champion || celebrated) return;
    setCelebrated(true);
    setCelebrationOpen(true);
    playFanfare();
  }, [champion, celebrated]);

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

      {/* ═══ شريط التحكم ═══ */}
      <div className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-3 px-6">
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-black tracking-tight">
            {phase === "playing" ? "بطولة مزاج" : "قرعة البطولة"}
          </h1>
          {phase === "drawing" && (
            <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-xs font-bold tabular-nums text-[#F3EBE1]/70">
              {drawnCount.toLocaleString("en-US")} / {totalSlots.toLocaleString("en-US")}
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
          {phase !== "setup" && (
            <button
              type="button"
              onClick={resetAll}
              aria-label="إعادة القرعة"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#F3EBE1]/80"
            >
              <RotateCcw size={16} />
            </button>
          )}
          {!isFullscreen && (
            <button
              type="button"
              onClick={onExit}
              aria-label="إغلاق القرعة"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#F3EBE1]/80"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ═══ الإعداد ═══ */}
      {phase === "setup" && (
        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
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

          <div className="flex gap-2 max-sm:flex-col">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] text-sm font-black text-[#F3EBE1]/85"
            >
              <Users size={18} />
              اختيار من المشتركين
            </button>
            <input
              value={tournamentTitle}
              onChange={(e) =>
                setState((prev) => ({ ...prev, tournamentTitle: e.target.value }))
              }
              maxLength={60}
              placeholder="اسم البطولة (يظهر عند التتويج)"
              className="min-h-[52px] flex-1 rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-base font-bold text-[#F3EBE1] outline-none placeholder:font-normal placeholder:text-[#F3EBE1]/30 focus:border-accent"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <span className="text-sm font-black">
              الفرق: {entrants.length.toLocaleString("en-US")}
            </span>
            {entrants.length >= MIN_TEAMS && (
              <span className="text-xs font-bold text-accent/90">
                {describeFormat(entrants.length)}
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
      )}

      {/* ═══ القرعة: العجلة يساراً والشجرة يميناً ═══ */}
      {phase === "drawing" && bracket && (
        <div className="relative z-10 flex flex-1 gap-5 overflow-hidden px-5 pb-5 max-lg:flex-col-reverse max-lg:overflow-y-auto">
          <div className="order-1 min-w-0 flex-1 overflow-hidden">
            <BracketView bracket={bracket} nextSlot={nextSlot} compact />
          </div>

          <div
            className={`relative order-2 flex w-full shrink-0 flex-col items-center justify-center gap-4 transition-[width,max-width] duration-500 ${
              auto ? "lg:w-[46%] lg:max-w-[600px]" : "lg:w-[38%] lg:max-w-[460px]"
            }`}
          >
            {/* إعلان الاسم المسحوب — فوق العجلة مباشرةً ليراه الجميع */}
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center">
              {announce && (
                <div className="animate-[fadeIn_0.25s_ease-out] rounded-2xl border border-accent bg-[#1C120B] px-7 py-4 text-center shadow-[0_18px_40px_-10px_rgba(0,0,0,0.8)]">
                  <p className="mb-1 text-[11px] font-black tracking-wide text-accent/70">
                    سُحب الفريق
                  </p>
                  <p className="max-w-[20ch] truncate text-2xl font-black text-accent">
                    {announce}
                  </p>
                </div>
              )}
            </div>

            <div
              className={`w-full px-2 transition-[max-width] duration-500 ${
                auto ? "max-w-[520px]" : "max-w-[380px]"
              }`}
            >
              <Wheel names={remaining} spinningTo={spinningTo} onSpinEnd={handleSpinEnd} />
            </div>

            {/* ضغطة واحدة فقط: بعدها يختفي الزر وتكمل القرعة وحدها حتى آخر فريق */}
            {!auto ? (
              <button
                type="button"
                onClick={startAuto}
                disabled={remaining.length === 0}
                className="flex min-h-[60px] w-full max-w-[330px] items-center justify-center gap-2.5 rounded-2xl bg-accent text-xl font-black text-[#1C120B] transition-transform active:scale-[0.98] disabled:opacity-40"
              >
                <Shuffle size={22} />
                دوّر العجلة
              </button>
            ) : (
              <p className="text-sm font-bold text-[#F3EBE1]/40">
                بقي {remaining.length.toLocaleString("en-US")} من{" "}
                {entrants.length.toLocaleString("en-US")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═══ البطولة: الشجرة تملأ الشاشة، وضغطة على الفائز تُصعّده ═══ */}
      {phase === "playing" && bracket && (
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
              اضغط على الفريق الفائز ليصعد للدور التالي
            </p>
          )}

          <div className="min-h-0 flex-1">
            <BracketView bracket={bracket} nextSlot={null} onPickWinner={pickWinner} />
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

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
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
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-6">
        <h2 className="text-base font-black">المشتركون</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06]"
          aria-label="إغلاق"
        >
          <X size={16} />
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
