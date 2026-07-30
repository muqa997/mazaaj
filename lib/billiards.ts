// سعر الكيم الواحد بجميع طاولات البلياردو
export const GAME_PRICE = 1000; // ٨ بول
export const GAME_PRICE_9BALL = 500; // ٩ بول

export function computePoolAmount(games8: number, games9: number) {
  return games8 * GAME_PRICE + games9 * GAME_PRICE_9BALL;
}

// من قام بتحصيل الدفعة أول مرة من الزبون — موظف البلياردو مباشرة بالطابق الأول
// (المسار الأساسي الآن)، أو الكاشير بالطابق الأرضي (تذكرة مدفوعة، أو زبون نزل مباشرة
// بدون علم الموظف)
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
  // وقت إنهاء الجلسة من موظف البلياردو (يُنسخ من وقت إنشاء التذكرة، أو نفس وقت
  // paid_at إن استلم الموظف الدفع مباشرة)، منفصل عن paid_at وهو وقت استلام المبلغ
  // فعلياً من الزبون — يبقى null إن حصّل الكاشير مباشرة من العرض الحي بدون تذكرة
  session_ended_at: string | null;
  paid_at: string;
  // وقت تأكيد الكاشير استلامه النقد يدوياً من موظف البلياردو — يبقى null طالما
  // المبلغ لا يزال بحوزة الموظف (فقط للمعاملات التي جمعها الموظف مباشرة)
  handed_over_at: string | null;
};

// ملاحظة حرة لموظف البلياردو (دين، تذكير، إلخ) — غير مرتبطة بطاولة معينة
export type BilliardsNoteRow = {
  id: string;
  text: string;
  created_at: string;
};
