"use client";

import { useEffect, useMemo, useState } from "react";
import { Trophy, X } from "lucide-react";
import { pickRandomIndex } from "@/lib/draw";

type ChampionOverlayProps = {
  champion: string;
  tournamentTitle: string;
  onClose: () => void;
};

const CONFETTI_COLORS = ["#C3A277", "#E8C98A", "#F3EBE1", "#B8793F", "#8FD3A6", "#E07A5F"];

/**
 * شاشة التتويج: تتوسّط الشاشة تماماً وتُبقي الشجرة خلفها ظاهرة لكن باهتة، فيبقى
 * سياق البطولة مرئياً بينما تتصدّر النتيجة المشهد.
 */
export default function ChampionOverlay({
  champion,
  tournamentTitle,
  onClose,
}: ChampionOverlayProps) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // قصاصات ملوّنة تتساقط — مواضعها تُحسب مرة واحدة فلا تقفز مع كل إعادة رسم
  const confetti = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        left: (pickRandomIndex(1000) / 10).toFixed(2),
        delay: (pickRandomIndex(3000) / 1000).toFixed(2),
        duration: (2.6 + pickRandomIndex(2600) / 1000).toFixed(2),
        drift: (pickRandomIndex(120) - 60).toFixed(0),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 5 + pickRandomIndex(7),
        round: i % 3 === 0,
      })),
    []
  );

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* الشجرة تبقى ظاهرة خلف طبقة شبه شفافة */}
      <button
        type="button"
        aria-label="إغلاق شاشة التتويج"
        onClick={onClose}
        className={`absolute inset-0 bg-[#140E0A]/80 backdrop-blur-[3px] transition-opacity duration-700 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {confetti.map((c) => (
          <span
            key={c.id}
            className="confetti absolute top-[-8%]"
            style={{
              left: `${c.left}%`,
              width: `${c.size}px`,
              height: `${c.size * (c.round ? 1 : 1.8)}px`,
              background: c.color,
              borderRadius: c.round ? "50%" : "1px",
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              ["--drift" as string]: `${c.drift}px`,
            }}
          />
        ))}
      </div>

      <div
        className={`relative mx-6 w-full max-w-2xl rounded-[2rem] border border-accent/45 bg-[#1C120B] px-8 py-10 text-center shadow-[0_40px_90px_-20px_rgba(0,0,0,0.9)] transition-all duration-700 ${
          shown ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-[#F3EBE1]/60"
        >
          <X size={16} />
        </button>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-accent/30 blur-3xl"
        />

        <div className="relative">
          <span className="trophy mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-amber-300/40 bg-amber-300/10">
            <Trophy size={38} className="text-amber-300" />
          </span>

          <p className="text-2xl font-black text-amber-200 sm:text-3xl">ألف مبروك للفائز</p>

          {tournamentTitle && (
            <p className="mt-2 text-sm font-bold text-[#F3EBE1]/50 sm:text-base">
              {tournamentTitle}
            </p>
          )}

          <p className="mx-auto mt-6 max-w-[18ch] text-[clamp(2rem,6vw,3.75rem)] font-black leading-[1.15] text-accent">
            {champion}
          </p>

          <span className="mx-auto mt-7 block h-px w-28 bg-accent/35" />

          <p className="mt-5 text-sm font-bold text-[#F3EBE1]/60 sm:text-base">
            انتظرونا في بطولة جديدة أخرى
          </p>
        </div>
      </div>

      <style jsx>{`
        .confetti {
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .trophy {
          animation: pop 2.4s ease-in-out infinite;
        }
        @keyframes fall {
          from {
            transform: translate3d(0, 0, 0) rotate(0deg);
            opacity: 1;
          }
          to {
            transform: translate3d(var(--drift), 115vh, 0) rotate(680deg);
            opacity: 0.85;
          }
        }
        @keyframes pop {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .confetti,
          .trophy {
            animation: none;
          }
          .confetti {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
