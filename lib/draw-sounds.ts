"use client";

// أصوات القرعة مولّدة بالمتصفح بدل ملفات صوتية: لا تحتاج تحميلاً ولا تتأخر عند أول
// دورة، وتعمل بلا إنترنت — وهذا مهم لشاشة تعمل أمام الحضور

/** منحنى تباطؤ العجلة. الصوت يقرأ **نفس** هذه الأرقام، فلا يفترق عنها */
export const SPIN_EASING = [0.12, 0.8, 0.12, 1] as const;

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

const bez = (a: number, b: number, t: number) => {
  const mt = 1 - t;
  return 3 * mt * mt * t * a + 3 * mt * t * t * b + t * t * t;
};

/**
 * تحوّل «كم دارت العجلة» إلى «متى دارت ذلك القدر».
 *
 * منحنى CSS وسيطيّ: يعطي الإزاحة والزمن بدلالة وسيط ثالث، لا الإزاحة بدلالة الزمن.
 * فنأخذ عيّنات منه ونبحث فيها عكسياً. بدون هذا كانت الطقطقة تتبع منحنىً مختلفاً عن
 * حركة العجلة فتسبقها ثم تتأخر عنها — وهو سبب أن الصوت «غير متناسق مع العجلة».
 */
function timeAtProgress(samples: { x: number; y: number }[], value: number): number {
  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].y < value) lo = mid + 1;
    else hi = mid;
  }
  const b = samples[lo];
  const a = samples[Math.max(0, lo - 1)];
  if (b.y === a.y) return b.x;
  const k = (value - a.y) / (b.y - a.y);
  return a.x + (b.x - a.x) * k;
}

function easingSamples(steps = 400) {
  const [x1, y1, x2, y2] = SPIN_EASING;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return { x: bez(x1, x2, t), y: bez(y1, y2, t) };
  });
}

/** طقّة قصيرة: صوت مرور المؤشر على حدّ قطاع */
function tick(audio: AudioContext, at: number, gainValue: number) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(1700, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(gainValue, at + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.045);
  osc.connect(gain).connect(audio.destination);
  osc.start(at);
  osc.stop(at + 0.055);
}

/**
 * طقطقة الدوران: طقّة لكل مرور للمؤشر على حدّ قطاع، محسوبة من دوران العجلة الحقيقي.
 *
 * تُجدوَل كل الطقّات دفعةً واحدة على ساعة المحرّك الصوتي، لا بمؤقّتات JavaScript —
 * فتبقى مضبوطة حتى لو انشغل المتصفح برسم العجلة.
 */
export function playSpin(durationMs: number, totalDegrees: number, segmentDegrees: number) {
  const audio = getCtx();
  if (!audio || segmentDegrees <= 0) return;
  audio.resume().catch(() => {});

  const samples = easingSamples();
  const duration = durationMs / 1000;
  const start = audio.currentTime + 0.02;
  const crossings = Math.floor(totalDegrees / segmentDegrees);
  if (crossings < 1) return;

  let lastAt = -1;
  let scheduled = 0;
  for (let k = 1; k <= crossings; k += 1) {
    const at = start + duration * timeAtProgress(samples, k / crossings);
    // دون 35ms تندمج الطقّات في طنين، فنتخطّاها بأسرع جزء من الدوران — وهناك
    // لا تُميّز الأذن الطقّات أصلاً. وهذا يحدّ أيضاً عدد المذبذبات المجدولة
    if (at - lastAt < 0.035) continue;
    lastAt = at;
    scheduled += 1;
    if (scheduled > 150) break;
    // تخفت كلما تباطأت، فتشبه عجلة حقيقية
    tick(audio, at, 0.07 + 0.09 * (1 - k / crossings));
  }
}

/** نغمة الوقوف على اسم: ثلاث درجات صاعدة قصيرة + اهتزاز */
export function playPicked() {
  const audio = getCtx();
  if (!audio) return;
  audio.resume().catch(() => {});

  const now = audio.currentTime;
  [660, 880, 1320].forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const at = now + i * 0.1;
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.28, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.28);
    osc.connect(gain).connect(audio.destination);
    osc.start(at);
    osc.stop(at + 0.32);
  });

  try {
    navigator.vibrate?.([80, 45, 80]);
  } catch {
    // غير مدعوم على كل الأجهزة
  }
}

/** فانفارة التتويج: سلّم صاعد أطول وأدفأ، تُشغَّل مرة عند ظهور البطل */
export function playFanfare() {
  const audio = getCtx();
  if (!audio) return;
  audio.resume().catch(() => {});

  const now = audio.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    [0, 1].forEach((layer) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      const at = now + i * 0.16;
      osc.type = layer === 0 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq * (layer === 0 ? 1 : 2), at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(layer === 0 ? 0.26 : 0.1, at + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + (i === 3 ? 1.1 : 0.4));
      osc.connect(gain).connect(audio.destination);
      osc.start(at);
      osc.stop(at + (i === 3 ? 1.2 : 0.45));
    });
  });

  try {
    navigator.vibrate?.([120, 60, 120, 60, 220]);
  } catch {
    // غير مدعوم على كل الأجهزة
  }
}
