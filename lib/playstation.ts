// حساب وقت وسعر البلي ستيشن — ملف خالٍ من أي استيراد خادمي، تستورده الواجهة مباشرة

/** ١٠٠٠ دينار لكل ربع ساعة = ٤٠٠٠ للساعة */
export const PS_QUARTER_PRICE = 1000;
export const PS_MINUTES_PER_QUARTER = 15;

/** بعد هذه المدة نشكّ أن الموظف نسي إيقاف العدّاد والزبون مشى */
export const PS_STALE_HOURS = 3;

/**
 * المدد الجاهزة للاختيار. كلها مضاعفات ربع ساعة لأن التسعير بالربع أصلاً: اختيار
 * «ساعة» أوضح للموظف والزبون من كتابة ٦٣ دقيقة ثم تقريبها بالحساب
 */
export const PS_DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

/** سقف الفاتورة الواحدة — ما فوقه غالباً خطأ لا جلسة */
export const PS_MAX_SESSION_MINUTES = 8 * 60;

/** تقريب للأعلى لأقرب ربع: هو المبلغ الذي سيُحاسَب عليه فعلاً */
export function roundUpToQuarter(minutes: number): number {
  const safe = Math.max(0, Math.floor(minutes));
  return Math.ceil(safe / PS_MINUTES_PER_QUARTER) * PS_MINUTES_PER_QUARTER;
}

/**
 * المدة التي يُحاسَب عليها عدّاد شغّال: مقرَّبة للربع ومسقوفة بأطول مدة جاهزة.
 *
 * العدّاد مساعد لا حكم: جلسة يُنسى إيقافها ليلة كاملة كانت ستعطي فاتورة بعشرات
 * الآلاف. السقف يجعلها اقتراحاً معقولاً، ومن لعب أكثر من ساعتين فعلاً تُثبَّت مدته
 * باليد من صفحة الألعاب
 */
export function billableFromTimer(minutes: number): number {
  const longest = PS_DURATION_PRESETS[PS_DURATION_PRESETS.length - 1];
  return Math.min(longest, Math.max(PS_MINUTES_PER_QUARTER, roundUpToQuarter(minutes)));
}

const HOURS_AR = ["", "ساعة", "ساعتان"];

/** «ساعة ونصف» — المدة كما ينطقها الموظف، لا «٩٠ دقيقة» */
export function formatDuration(minutes: number): string {
  const safe = Math.max(0, Math.floor(minutes));
  if (safe === 0) return "٠";
  const h = Math.floor(safe / 60);
  const rem = safe % 60;
  // ٣–١٠ جمع تكسير («٣ ساعات»)، و١١ فصاعداً تمييز مفرد («١٢ ساعة»)
  const hoursText =
    h === 0
      ? ""
      : HOURS_AR[h] ?? `${h.toLocaleString("en-US")} ${h <= 10 ? "ساعات" : "ساعة"}`;
  // الكسر يُنطق «ربع» و«نصف» حين يكون جزءاً من ساعة، و«ربع ساعة» حين يقف وحده
  const remJoined = rem === 15 ? "ربع" : rem === 30 ? "نصف" : rem === 45 ? "٤٥ دقيقة" : "";
  if (h > 0 && rem === 0) return hoursText;
  if (h > 0) return `${hoursText} و${remJoined || `${rem.toLocaleString("en-US")} دقيقة`}`;
  if (rem === 15) return "ربع ساعة";
  if (rem === 30) return "نصف ساعة";
  return `${rem.toLocaleString("en-US")} دقيقة`;
}

export type PlaystationDeviceRow = {
  id: string;
  device_number: number;
  /** null = الجهاز متوقف */
  started_at: string | null;
  customer_ref: string | null;
  updated_at: string;
};

/**
 * دقائق اللعب من لحظة البداية حتى الآن (أو حتى لحظة محددة).
 *
 * تُحسب دائماً من `started_at` المحفوظ بقاعدة البيانات لا من عدّاد بالمتصفح، فتبقى
 * صحيحة بعد تحديث الصفحة، ومتطابقة على شاشة الموظف والكاشير والمدير معاً
 */
export function elapsedMinutes(startedAt: string | Date, until: Date = new Date()): number {
  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  const ms = until.getTime() - start.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.floor(ms / 60000);
}

/**
 * سعر مدة لعب: كل ربع ساعة مبدوء يُحسب ربعاً كاملاً.
 *
 * ١٥ دقيقة = ١٠٠٠، و١٦ = ٢٠٠٠، و٣٠ = ٢٠٠٠، و٣١ = ٣٠٠٠. التقريب للأعلى هو المتبع
 * بالكافيهات وأسهل شرحاً للزبون من كسور الدقيقة
 */
export function computePlaystationAmount(minutes: number): number {
  const safe = Math.max(0, Math.floor(minutes));
  if (safe === 0) return 0;
  return Math.ceil(safe / PS_MINUTES_PER_QUARTER) * PS_QUARTER_PRICE;
}

/** «١:٠٥:٣٠» أو «٠٥:٣٠» — عدّاد يُقرأ بطرف العين */
export function formatElapsed(startedAt: string | Date, until: Date = new Date()): string {
  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  const totalSec = Math.max(0, Math.floor((until.getTime() - start.getTime()) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** كم دقيقة بقيت حتى يرتفع السعر ربعاً آخر — يساعد الموظف يقرر متى يوقف */
export function minutesToNextQuarter(minutes: number): number {
  const safe = Math.max(0, Math.floor(minutes));
  const rem = safe % PS_MINUTES_PER_QUARTER;
  return rem === 0 ? PS_MINUTES_PER_QUARTER : PS_MINUTES_PER_QUARTER - rem;
}

/** جلسة طال أمدها بلا إيقاف — الغالب أن الموظف نسيها */
export function isStaleSession(startedAt: string | Date, until: Date = new Date()): boolean {
  return elapsedMinutes(startedAt, until) >= PS_STALE_HOURS * 60;
}

/**
 * يحوّل وقتاً محلياً من حقل `datetime-local` إلى Date، ويرفض المستقبل.
 * يُستخدم حين يصحّح الموظف وقت البداية لأنه نسي الضغط على «بدء»
 */
export function parseStartOverride(value: string): { at: Date | null; error: string | null } {
  if (!value) return { at: null, error: "الرجاء تحديد وقت البداية" };
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return { at: null, error: "وقت غير صحيح" };
  if (at.getTime() > Date.now() + 60_000) {
    return { at: null, error: "وقت البداية لا يكون بالمستقبل" };
  }
  return { at, error: null };
}
