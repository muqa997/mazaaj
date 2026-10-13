"use client";

import { useEffect, useRef } from "react";

// نغمة تنبيه مولّدة بالمتصفح بدل ملف صوتي: لا تحتاج تحميلاً ولا تتأخر عند أول طلب،
// وتعمل حتى بلا إنترنت. نغمتان صاعدتان قصيرتان تلفتان الانتباه بلا إزعاج
function playChime() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    const ctx = new Ctx();
    const now = ctx.currentTime;

    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + i * 0.18;

      osc.type = "sine";
      osc.frequency.value = freq;
      // تلاشٍ تدريجي بدل قطع مفاجئ يسبب طقطقة
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);

      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });

    setTimeout(() => ctx.close().catch(() => {}), 1200);
  } catch {
    // الصوت تحسين فقط — لا يصح أن يعطّل ظهور الطلب لو منعه المتصفح
  }
}

/**
 * ينبّه الكاشير عند وصول طلب جديد: نغمة + اهتزاز بالجوال.
 *
 * يقارن المعرّفات لا العدد، فلا ينطلق التنبيه عند حذف طلب ثم وصول آخر، ولا عند
 * أول تحميل للصفحة (وإلا رنّ لكل الطلبات القديمة عند كل فتح).
 */
export function useNewOrderAlert(orderIds: string[]) {
  const knownIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    // أول تحميل: نسجّل الموجود بصمت ليكون خط الأساس
    if (knownIds.current === null) {
      knownIds.current = new Set(orderIds);
      return;
    }

    const fresh = orderIds.filter((id) => !knownIds.current!.has(id));
    knownIds.current = new Set(orderIds);

    if (fresh.length === 0) return;

    playChime();
    navigator.vibrate?.([120, 60, 120]);
  }, [orderIds]);
}
