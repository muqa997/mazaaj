// سعر الكيم الواحد بجميع طاولات البلياردو
export const GAME_PRICE = 1000; // ٨ بول
export const GAME_PRICE_9BALL = 500; // ٩ بول

export function computePoolAmount(games8: number, games9: number) {
  return games8 * GAME_PRICE + games9 * GAME_PRICE_9BALL;
}

// الكافيه يعمل أحياناً حتى الساعة ٣ فجراً، فلا يصح اعتماد منتصف الليل كحد فاصل بين
// يومين — "اليوم" هنا يعني "اليوم التجاري": يبدأ الساعة ٦ صباحاً بتوقيت بغداد (UTC+3
// دائماً، العراق لا يطبّق توقيتاً صيفياً) وينتهي عند الساعة ٦ صباحاً التالية. أي وقت
// بين منتصف الليل والسادسة صباحاً يُحسب ضمن اليوم التجاري السابق (يوم الأمس) وليس
// يوماً جديداً. هذه الدوال تعمل على الطابع الزمني UTC للـ Date مباشرة (بلا الاعتماد
// على المنطقة الزمنية المحلية للخادم أو المتصفح)، فتُعطي نفس النتيجة في كل الصفحات
// الثلاث (الموظف/الكاشير/المدير) بصرف النظر عن أين يعمل كل طرف فعلياً
const BAGHDAD_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;
const BUSINESS_DAY_START_HOUR = 6;

export function getBusinessDayStart(date: Date = new Date()): Date {
  const baghdad = new Date(date.getTime() + BAGHDAD_UTC_OFFSET_MS);
  let y = baghdad.getUTCFullYear();
  let m = baghdad.getUTCMonth();
  let d = baghdad.getUTCDate();
  if (baghdad.getUTCHours() < BUSINESS_DAY_START_HOUR) {
    const prev = new Date(Date.UTC(y, m, d - 1));
    y = prev.getUTCFullYear();
    m = prev.getUTCMonth();
    d = prev.getUTCDate();
  }
  // السادسة صباحاً بتوقيت بغداد (UTC+3) = الثالثة فجراً بتوقيت UTC
  return new Date(Date.UTC(y, m, d, BUSINESS_DAY_START_HOUR - 3, 0, 0, 0));
}

// أول يوم من الشهر التجاري الحالي (بنفس منطق اليوم التجاري أعلاه) — يُستخدم لإحصائيات "هذا الشهر"
export function getBusinessMonthStart(date: Date = new Date()): Date {
  const dayStart = getBusinessDayStart(date);
  const baghdad = new Date(dayStart.getTime() + BAGHDAD_UTC_OFFSET_MS);
  return new Date(
    Date.UTC(
      baghdad.getUTCFullYear(),
      baghdad.getUTCMonth(),
      1,
      BUSINESS_DAY_START_HOUR - 3,
      0,
      0,
      0
    )
  );
}

// هل يقع التاريخان بنفس اليوم التجاري؟ (لمقارنة "هل هذا حدث اليوم؟")
export function isSameBusinessDay(a: Date, b: Date): boolean {
  return getBusinessDayStart(a).getTime() === getBusinessDayStart(b).getTime();
}

// من قام بتحصيل الدفعة — الكاشير حصراً هو من يحصّل الآن (يدفع الفاتورة أو دفعاً مباشراً
// من العرض الحي)؛ القيمة 'billiards' باقية فقط لتوافق السجلات القديمة قبل حصر التحصيل
// بالكاشير، ولم تعد تُنشأ لمعاملات جديدة
export type BilliardsCollectedBy = "billiards" | "cashier";

export type BilliardsTableRow = {
  id: string;
  table_number: 1 | 2 | 3;
  games_count: number; // ٨ بول
  games_count_9ball: number; // ٩ بول
  // اسم/رقم طاولة جلوس الزبون — يُحفظ فور الكتابة (حي)، يظهر للكاشير حتى قبل إنهاء الجلسة
  customer_ref: string | null;
  updated_at: string;
};

// تذكرة معلّقة: موظف البلياردو "ينهي جلسة" زبون معيّن فتُفصل كيماته عن عداد الطاولة
// الحي فوراً (تتصفّر الطاولة لزبون جديد)، وتبقى التذكرة بانتظار الدفع عند الكاشير حصراً —
// الكاشير وحده من يدفعها أو يلغيها، وموظف البلياردو يراها للعلم فقط (بلا أي إجراء)
export type BilliardsTicketRow = {
  id: string;
  table_number: number;
  games_count: number; // ٨ بول
  games_count_9ball: number; // ٩ بول
  amount: number;
  customer_ref: string | null;
  created_at: string;
  // إلغاء الفاتورة يُسجَّل (لا يُحذف السطر) مع سبب إلزامي يكتبه الكاشير — يبقى هذا
  // كسجل تدقيق يراه المدير، لضبط عدم إلغاء فواتير حقيقية والاستيلاء على قيمتها
  cancelled_at: string | null;
  cancel_reason: string | null;
};

export type BilliardsTransactionRow = {
  id: string;
  table_number: number;
  games_count: number; // ٨ بول
  games_count_9ball: number; // ٩ بول
  amount: number;
  collected_by: BilliardsCollectedBy;
  customer_ref: string | null;
  // وقت إنهاء الجلسة من موظف البلياردو (يُنسخ من وقت إنشاء التذكرة)، منفصل عن
  // paid_at وهو وقت استلام المبلغ فعلياً — يبقى null إن حصّل الكاشير مباشرة من
  // العرض الحي بدون تذكرة (الزبون نزل مباشرة قبل أن ينهي الموظف الجلسة)
  session_ended_at: string | null;
  paid_at: string;
  // كانت تُستخدم لتأكيد استلام موظف البلياردو النقد من الكاشير في مرحلة سابقة من
  // النظام؛ لم تعد تُستخدم لمعاملات جديدة بعد حصر التحصيل بالكاشير حصراً — باقية فقط
  // لتوافق السجلات القديمة
  handed_over_at: string | null;
  // وقت تأكيد المدير استلامه دخل اليوم نقداً من الكاشير من لوحة التحكم الرئيسية —
  // تُسوَّى كل المعاملات غير المسوّاة دفعة واحدة، لا لكل معاملة على حدة. يبقى null
  // حتى تسوية المدير
  settled_at: string | null;
};

// ملاحظة حرة لموظف البلياردو (دين، تذكير، إلخ) — غير مرتبطة بطاولة معينة
export type BilliardsNoteRow = {
  id: string;
  text: string;
  created_at: string;
};
