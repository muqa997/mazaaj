// سعر الكيم الواحد بجميع طاولات البلياردو
export const GAME_PRICE = 1000;

// من قام بتحصيل الدفعة — الكاشير حصراً الآن (لأغراض التقارير، وتحسّباً لأي تغيير مستقبلي)
export type BilliardsCollectedBy = "billiards" | "cashier";

export type BilliardsTableRow = {
  id: string;
  table_number: 1 | 2 | 3;
  games_count: number;
  updated_at: string;
};

// تذكرة معلّقة: موظف البلياردو "ينهي جلسة" زبون معيّن فتُفصل كيماته عن عداد الطاولة
// الحي فوراً (تتصفّر الطاولة لزبون جديد)، وتبقى التذكرة بانتظار الدفع عند الكاشير
export type BilliardsTicketRow = {
  id: string;
  table_number: number;
  games_count: number;
  amount: number;
  customer_ref: string | null;
  created_at: string;
};

export type BilliardsTransactionRow = {
  id: string;
  table_number: number;
  games_count: number;
  amount: number;
  collected_by: BilliardsCollectedBy;
  customer_ref: string | null;
  // وقت إنهاء الجلسة من موظف البلياردو (يُنسخ من وقت إنشاء التذكرة)، منفصل عن paid_at
  // وهو وقت استلام الكاشير للمبلغ فعلياً
  session_ended_at: string | null;
  paid_at: string;
};
