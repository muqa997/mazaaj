// سعر الكيم الواحد بجميع طاولات البلياردو
export const GAME_PRICE = 1000; // ٨ بول
export const GAME_PRICE_9BALL = 500; // ٩ بول

export function computePoolAmount(games8: number, games9: number) {
  return games8 * GAME_PRICE + games9 * GAME_PRICE_9BALL;
}

// من قام بتحصيل الدفعة — الكاشير حصراً الآن (لأغراض التقارير، وتحسّباً لأي تغيير مستقبلي)
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
// الحي فوراً (تتصفّر الطاولة لزبون جديد)، وتبقى التذكرة بانتظار الدفع عند الكاشير
export type BilliardsTicketRow = {
  id: string;
  table_number: number;
  games_count: number; // ٨ بول
  games_count_9ball: number; // ٩ بول
  amount: number;
  customer_ref: string | null;
  created_at: string;
};

export type BilliardsTransactionRow = {
  id: string;
  table_number: number;
  games_count: number; // ٨ بول
  games_count_9ball: number; // ٩ بول
  amount: number;
  collected_by: BilliardsCollectedBy;
  customer_ref: string | null;
  // وقت إنهاء الجلسة من موظف البلياردو (يُنسخ من وقت إنشاء التذكرة)، منفصل عن paid_at
  // وهو وقت استلام الكاشير للمبلغ فعلياً — يبقى null إن حصّل الكاشير مباشرة من العرض
  // الحي بدون تذكرة (دفع مباشر)
  session_ended_at: string | null;
  paid_at: string;
};

// ملاحظة حرة لموظف البلياردو (دين، تذكير، إلخ) — غير مرتبطة بطاولة معينة
export type BilliardsNoteRow = {
  id: string;
  text: string;
  created_at: string;
};
