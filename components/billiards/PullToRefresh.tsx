"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 70; // مسافة السحب التي تُفعّل التحديث
const MAX_PULL = 110;
const DAMPING = 0.55; // يجعل السحب يبدو "ثقيلاً" كتطبيقات الجوال بدل أن يتبع الإصبع حرفياً
const MIN_SPINNER_MS = 500; // أقل مدة ظهور للمؤشر، وإلا يختفي فوراً فيبدو كأن شيئاً لم يحدث

// سحب الشاشة للأسفل لتحديث البيانات. الموقع يعطّل سحب المتصفح الأصلي
// (overscroll-behavior-y: none بـ globals.css) لإحساس التطبيق، فنتكفّل بالإيماءة هنا —
// وتحديث البيانات بدل إعادة تحميل الصفحة يحفظ الجلسة ويتجنّب وميض الشاشة الأبيض.
//
// لا نغلّف المحتوى بعنصر يتحرك (transform) عمداً: أي transform يجعل العناصر
// position:fixed داخله (شريط الإحصائيات السفلي) تتحرك معه، فنعرض المؤشر وحده
export default function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const busyRef = useRef(false);
  // نحفظ أحدث دالة تحديث بمرجع حتى نسجّل مستمعي اللمس مرة واحدة فقط (بلا إعادة
  // تسجيل مع كل إطار أثناء السحب)
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const apply = (value: number) => {
      pullRef.current = value;
      setPull(value);
    };

    const handleStart = (e: TouchEvent) => {
      // السحب يبدأ فقط من أعلى الصفحة فعلاً، وبإصبع واحد، وبلا تحديث جارٍ
      if (busyRef.current || e.touches.length !== 1 || window.scrollY > 0) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
    };

    const handleMove = (e: TouchEvent) => {
      if (startY.current === null || busyRef.current) return;

      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        if (pullRef.current !== 0) apply(0);
        return;
      }

      apply(Math.min(MAX_PULL, delta * DAMPING));
      // نمنع تمرير الصفحة أثناء سحب واضح فقط، حتى لا نعطّل التمرير العادي
      if (pullRef.current > 6 && e.cancelable) e.preventDefault();
    };

    const handleEnd = async () => {
      if (startY.current === null) return;
      startY.current = null;

      if (pullRef.current < THRESHOLD || busyRef.current) {
        apply(0);
        return;
      }

      busyRef.current = true;
      setRefreshing(true);
      apply(THRESHOLD);

      try {
        await Promise.all([
          onRefreshRef.current(),
          new Promise((resolve) => setTimeout(resolve, MIN_SPINNER_MS)),
        ]);
      } finally {
        busyRef.current = false;
        setRefreshing(false);
        apply(0);
      }
    };

    // passive: false ضروري لأن React يسجّل touchmove كمستمع سلبي فلا ينفع معه preventDefault
    window.addEventListener("touchstart", handleStart, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("touchcancel", handleEnd);

    return () => {
      window.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);
    };
  }, []);

  const active = pull > 0 || refreshing;

  return (
    <>
      <div
        aria-hidden={!active}
        className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center"
        style={{
          // يبدأ مخفياً فوق حدود الشاشة ثم ينزل مع الإصبع
          transform: `translateY(${pull - 48}px)`,
          opacity: active ? Math.min(1, pull / THRESHOLD || 1) : 0,
          transition: startY.current === null ? "transform 0.25s ease, opacity 0.2s ease" : "none",
        }}
      >
        <span className="mt-3 flex h-10 w-10 items-center justify-center rounded-full border border-primary/10 bg-background shadow-glass-lg">
          <RefreshCw
            size={18}
            className={refreshing ? "animate-spin text-accent" : "text-primary/50"}
            // قبل بلوغ الحد تدور الأيقونة مع السحب لتدل أن الإيماءة فعّالة
            style={refreshing ? undefined : { transform: `rotate(${Math.round(pull * 3)}deg)` }}
          />
        </span>
      </div>

      {children}
    </>
  );
}
