"use client";

import { useEffect, useRef, useState } from "react";
import { wheelColor } from "@/lib/draw";
import { SPIN_EASING, playSpin } from "@/lib/draw-sounds";

type WheelProps = {
  names: string[];
  /** فهرس الفائز المختار مسبقاً — العجلة تدور لتقف عليه */
  spinningTo: number | null;
  onSpinEnd: () => void;
};

export const SPIN_MS = 4600;
const FULL_TURNS = 6;

const R = 50;
/** المسافة المتاحة للنص على نصف القطر (من قرص المركز حتى قبل الحافة) */
const TEXT_START = 11;
const TEXT_END = R - 3.5;
const TEXT_SPAN = TEXT_END - TEXT_START;

/**
 * مقاس خط يضمن ظهور الاسم **كاملاً** بلا قصّ.
 *
 * الحرف العربي يشغل قرابة نصف مقاس الخط عرضاً، فنقسم المساحة المتاحة على طول الاسم.
 * وللقطاعات الضيقة سقفٌ آخر من عرض القوس، وإلا تجاوز النصُّ حدود قطاعه إلى جاره.
 */
function fitFontSize(name: string, segmentDegrees: number): number {
  const byLength = TEXT_SPAN / (Math.max(name.length, 1) * 0.52);
  // عرض القوس عند منتصف النص تقريباً — سطر واحد يجب أن يبقى داخله
  const arcWidth = ((segmentDegrees * Math.PI) / 180) * (TEXT_START + TEXT_SPAN / 2);
  return Math.max(1.7, Math.min(6.2, byLength, arcWidth * 0.78));
}

/**
 * عجلة الأسماء.
 *
 * الفائز يُختار **قبل** الدوران (بمولّد معمّى في lib/draw)، ثم تُحسب زاوية التوقف
 * لتقع عليه. العكس — ترك الزاوية تقرر — يجعل العدالة رهينة دقة الحساب بالفاصلة
 * العائمة وتقريب المتصفح، وقد يقف المؤشر على الحدّ بين قطاعين فلا يُعرف الفائز.
 */
export default function Wheel({ names, spinningTo, onSpinEnd }: WheelProps) {
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);
  const turnsRef = useRef(0);

  const count = names.length;
  const segment = count > 0 ? 360 / count : 360;

  useEffect(() => {
    if (spinningTo === null || count === 0) return;

    // المؤشر بأعلى العجلة (زاوية 0). لإيقاف منتصف القطاع تحته ندوّر بمقدار
    // -(مركز القطاع)، ونزيد دورات كاملة ليبدو الدوران طبيعياً
    const center = spinningTo * segment + segment / 2;
    turnsRef.current += FULL_TURNS;
    const next = turnsRef.current * 360 - center;
    const travelled = next - rotationRef.current;
    rotationRef.current = next;
    setRotation(next);

    // الصوت يتبع المسافة المقطوعة فعلاً وعدد القطاعات الحالي، فتقع كل طقّة لحظة
    // مرور المؤشر على حدّ قطاع تماماً
    playSpin(SPIN_MS, travelled, segment);

    const id = setTimeout(onSpinEnd, SPIN_MS + 90);
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

  const [x1, y1, x2, y2] = SPIN_EASING;

  return (
    <div className="relative w-full">
      {/* المؤشر: مثلث ثابت أعلى العجلة يشير للداخل */}
      <svg
        viewBox="0 0 20 20"
        className="absolute -top-1 left-1/2 z-20 w-[6.5%] -translate-x-1/2 drop-shadow-lg"
        aria-hidden="true"
      >
        <path d="M10 18 L1 1 L19 1 Z" fill="#F3EBE1" stroke="#1C120B" strokeWidth="1.2" />
      </svg>

      <svg
        viewBox="-52 -52 104 104"
        className="w-full drop-shadow-[0_18px_40px_rgba(0,0,0,0.55)]"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition:
            spinningTo === null
              ? "none"
              : `transform ${SPIN_MS}ms cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`,
        }}
        role="img"
        aria-label={`عجلة فيها ${count.toLocaleString("en-US")} فريق`}
      >
        {names.map((name, i) => {
          // القطاع i يبدأ عند i*segment، ونبدأ من أعلى العجلة (-90°)
          const a0 = ((i * segment - 90) * Math.PI) / 180;
          const a1 = (((i + 1) * segment - 90) * Math.PI) / 180;
          const x0 = R * Math.cos(a0);
          const y0 = R * Math.sin(a0);
          const xe = R * Math.cos(a1);
          const ye = R * Math.sin(a1);
          const largeArc = segment > 180 ? 1 : 0;
          const mid = i * segment + segment / 2 - 90;
          const size = fitFontSize(name, segment);
          // بالنصف الأيسر من العجلة يصير النص مقلوباً رأساً على عقب، فنُدوّره 180°
          const flipped = mid > 90 && mid < 270;
          const radius = TEXT_START + TEXT_SPAN / 2;

          return (
            <g key={`${name}-${i}`}>
              <path
                d={
                  count === 1
                    ? `M -${R} 0 A ${R} ${R} 0 1 1 ${R} 0 A ${R} ${R} 0 1 1 -${R} 0 Z`
                    : `M 0 0 L ${x0.toFixed(3)} ${y0.toFixed(3)} A ${R} ${R} 0 ${largeArc} 1 ${xe.toFixed(3)} ${ye.toFixed(3)} Z`
                }
                fill={wheelColor(i, count)}
                stroke="rgba(0,0,0,0.32)"
                strokeWidth="0.35"
              />
              <text
                x={flipped ? -radius : radius}
                y="0"
                transform={`rotate(${flipped ? mid + 180 : mid})`}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={size}
                fontWeight="800"
                fill="#FFFFFF"
                stroke="rgba(0,0,0,0.45)"
                strokeWidth={size * 0.11}
                style={{ paintOrder: "stroke" }}
              >
                {name}
              </text>
            </g>
          );
        })}

        {/* قرص المركز */}
        <circle r="8.5" fill="#1C120B" stroke="#C3A277" strokeWidth="1.2" />
        <circle r="2.6" fill="#C3A277" />
      </svg>
    </div>
  );
}
