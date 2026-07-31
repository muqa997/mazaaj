// سعر الكيم الواحد بجميع طاولات البلياردو
export const GAME_PRICE = 1000; // ٨ بول
export const GAME_PRICE_9BALL = 500; // ٩ بول

export function computePoolAmount(games8: number, games9: number) {
  return games8 * GAME_PRICE + games9 * GAME_PRICE_9BALL;
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
