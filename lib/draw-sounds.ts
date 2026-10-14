"use client";

// أصوات القرعة مولّدة بالمتصفح بدل ملفات صوتية: لا تحتاج تحميلاً ولا تتأخر عند أول
// دورة، وتعمل بلا إنترنت — وهذا مهم لشاشة تعمل أمام الحضور

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  ctx = new Ctx();
  return ctx;
}

/** المتصفحات تمنع الصوت قبل أول لمسة — نُهيّئ المحرّك عند أول ضغطة على الصفحة */
export function unlockAudio() {
  getCtx()?.resume().catch(() => {});
}

/** طقّة قصيرة: صوت مرور المؤشر على حدّ قطاع */
function tick(at: number, gainValue = 0.16) {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(1500, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(gainValue, at + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  osc.connect(gain).connect(audio.destination);
  osc.start(at);
  osc.stop(at + 0.06);
}

/**
 * طقطقة الدوران: تتباعد تدريجياً فتُحاكي تباطؤ العجلة حتى التوقف.
 *
 * تُجدوَل كل الطقّات دفعةً واحدة على ساعة المحرّك الصوتي، لا بمؤقّتات JavaScript —
 * فتبقى مضبوطة حتى لو انشغل المتصفح برسم العجلة
 */
export function playSpin(durationMs: number, segments: number) {
  const audio = getCtx();
  if (!audio) return;
  audio.resume().catch(() => {});

  const start = audio.currentTime;
  const duration = durationMs / 1000;
  // المنحنى نفسه الذي تتباطأ به العجلة: البداية سريعة والنهاية زاحفة
  const totalTicks = Math.min(90, Math.max(24, segments * 5));

  for (let i = 0; i < totalTicks; i += 1) {
    const progress = i / totalTicks;
    // ease-out قوي: الزمن يتمدّد كلما اقتربنا من النهاية
    const t = duration * (1 - Math.pow(1 - progress, 3));
    tick(start + t, 0.1 + 0.08 * (1 - progress));
  }
}

/** نغمة الفوز: ثلاث درجات صاعدة قصيرة + اهتزاز */
export function playPicked() {
  const audio = getCtx();
  if (!audio) return;
  audio.resume().catch(() => {});

  const now = audio.currentTime;
  [660, 880, 1320].forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const at = now + i * 0.11;
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.3, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
    osc.connect(gain).connect(audio.destination);
    osc.start(at);
    osc.stop(at + 0.34);
  });

  try {
    navigator.vibrate?.([90, 50, 90]);
  } catch {
    // غير مدعوم على كل الأجهزة
  }
}
