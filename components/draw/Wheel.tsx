"use client";

import { useEffect, useRef, useState } from "react";
import { wheelColor } from "@/lib/draw";
import { playSpin } from "@/lib/draw-sounds";

type WheelProps = {
  names: string[];
  /** فهرس الفائز المختار مسبقاً — العجلة تدور لتقف عليه */
  spinningTo: number | null;
  onSpinEnd: () => void;
};

export const SPIN_MS = 4600;
const FULL_TURNS = 6;

/**
 * عجلة الأسماء.
 *
 * الفائز يُختار **قبل** الدوران (بمولّد معمّى في lib/draw)، ثم تُحسب زاوية التوقف
 * لتقع عليه. العكس — ترك الزاوية تقرر — يجعل العدالة رهينة دقة الحساب بالفاصلة
 * العائمة وتقريب المتصفح، وقد يقف المؤشر على الحدّ بين قطاعين فلا يُعرف الفائز.
 */
export default function Wheel({ names, spinningTo, onSpinEnd }: WheelProps) {
  const [rotation, setRotation] = useState(0);
  const turnsRef = useRef(0);

  const count = names.length;
  const segment = count > 0 ? 360 / count : 360;

  useEffect(() => {
    if (spinningTo === null || count === 0) return;

    // المؤشر بأعلى العجلة (زاوية 0). لإيقاف منتصف القطاع تحته ندوّر بمقدار
    // -(مركز القطاع)، ونزيد دورات كاملة ليبدو الدوران طبيعياً
    const center = spinningTo * segment + segment / 2;
    turnsRef.current += FULL_TURNS;
    setRotation(turnsRef.current * 360 - center);
    playSpin(SPIN_MS, count);

    const id = setTimeout(onSpinEnd, SPIN_MS + 120);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinningTo]);

  if (count === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-full border-2 border-dashed border-white/15">
        <p className="text-sm font-bold text-white/35">أضف الفرق أولاً</p>
      </div>
    );
  }

  const r = 50;
  // النص يقع داخل القطاع دائماً: نضعه بمنتصف نصف القطر ونوسّطه حوله، فلا يتأثر
  // موضعه باتجاه الكتابة. (الإرساء على الحافة مع direction:rtl كان يدفعه للخارج)
  const textRadius = r * 0.56;
  const nameSize = count > 24 ? 3.1 : count > 16 ? 3.7 : count > 10 ? 4.4 : 5.2;
  const maxChars = count > 24 ? 11 : count > 16 ? 14 : count > 10 ? 17 : 20;

  return (
    <div className="relative w-full">
      {/* المؤشر: مثلث ثابت أعلى العجلة يشير للداخل */}
      <svg
        viewBox="0 0 20 20"
        className="absolute -top-1 left-1/2 z-20 w-[7%] -translate-x-1/2 drop-shadow-lg"
        aria-hidden="true"
      >
        <path d="M10 18 L1 1 L19 1 Z" fill="#F3EBE1" stroke="#1C120B" strokeWidth="1.2" />
      </svg>

      <svg
        viewBox="-52 -52 104 104"
        className="w-full"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition:
            spinningTo === null ? "none" : `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.8, 0.12, 1)`,
        }}
        role="img"
        aria-label={`عجلة فيها ${count.toLocaleString("en-US")} فريق`}
      >
        {names.map((name, i) => {
          // القطاع i يبدأ عند i*segment، ونبدأ من أعلى العجلة (-90°)
          const a0 = ((i * segment - 90) * Math.PI) / 180;
          const a1 = (((i + 1) * segment - 90) * Math.PI) / 180;
          const x0 = r * Math.cos(a0);
          const y0 = r * Math.sin(a0);
          const x1 = r * Math.cos(a1);
          const y1 = r * Math.sin(a1);
          const largeArc = segment > 180 ? 1 : 0;
          const mid = i * segment + segment / 2 - 90;
          const label = name.length > maxChars ? `${name.slice(0, maxChars - 1)}…` : name;
          // بالنصف الأيسر من العجلة يصير النص مقلوباً رأساً على عقب، فنُدوّره 180°
          const flipped = mid > 90 && mid < 270;

          return (
            <g key={`${name}-${i}`}>
              <path
                d={
                  count === 1
                    ? `M -${r} 0 A ${r} ${r} 0 1 1 ${r} 0 A ${r} ${r} 0 1 1 -${r} 0 Z`
                    : `M 0 0 L ${x0.toFixed(3)} ${y0.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${x1.toFixed(3)} ${y1.toFixed(3)} Z`
                }
                fill={wheelColor(i, count)}
                stroke="rgba(0,0,0,0.32)"
                strokeWidth="0.35"
              />
              <text
                x={flipped ? -textRadius : textRadius}
                y="0"
                transform={`rotate(${flipped ? mid + 180 : mid})`}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={nameSize}
                fontWeight="800"
                fill="#FFFFFF"
                stroke="rgba(0,0,0,0.4)"
                strokeWidth="0.55"
                style={{ paintOrder: "stroke" }}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* قرص المركز */}
        <circle r="8" fill="#1C120B" stroke="#C3A277" strokeWidth="1.2" />
        <circle r="2.4" fill="#C3A277" />
      </svg>
    </div>
  );
}
