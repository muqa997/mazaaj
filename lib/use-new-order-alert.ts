"use client";

import { useEffect } from "react";

// نغمة تنبيه مولّدة بالمتصفح بدل ملف صوتي: لا تحتاج تحميلاً ولا تتأخر عند أول طلب،
// وتعمل حتى بلا إنترنت
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  ctx = new Ctx();
  return ctx;
}

/**
 * متصفحات الجوال (وسفاري خاصةً) تمنع تشغيل أي صوت قبل أول لمسة من المستخدم. نُهيّئ
 * المحرّك الصوتي عند أول لمسة على الصفحة، فتصل النغمة الأولى فعلاً بدل أن تُكتَم
 * بصمت — وهذا بالضبط ما يجعل التنبيه موثوقاً على شاشة الكاشير.
 */
export function useUnlockChime() {
  useEffect(() => {
    const unlock = () => {
      getCtx()?.resume().catch(() => {});
    };
    document.addEventListener("pointerdown", unlock, { once: true });
    return () => document.removeEventListener("pointerdown", unlock);
  }, []);
}

/** نغمتان صاعدتان قصيرتان + اهتزاز: تلفتان الانتباه بلا إزعاج */
export function playNewOrderAlert() {
  try {
    const audio = getCtx();
    if (!audio) return;
    audio.resume().catch(() => {});
    const now = audio.currentTime;

    [880, 1320].forEach((freq, i) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const start = now + i * 0.18;

      osc.type = "sine";
      osc.frequency.value = freq;
      // تلاشٍ تدريجي بدل قطع مفاجئ يسبب طقطقة
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);

      osc.connect(gain).connect(audio.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });
  } catch {
    // الصوت تحسين فقط — لا يصح أن يعطّل ظهور التنبيه لو منعه المتصفح
  }

  try {
    navigator.vibrate?.([120, 60, 120]);
  } catch {
    // الاهتزاز غير مدعوم على كل الأجهزة
  }
}
