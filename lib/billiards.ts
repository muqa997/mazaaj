// سعر اللعبة الواحدة (الكيمة) بجميع طاولات البلياردو
export const GAME_PRICE = 1000;

export type BilliardsTableRow = {
  id: string;
  table_number: 1 | 2 | 3;
  games_count: number;
  updated_at: string;
};

export type BilliardsTransactionRow = {
  id: string;
  table_number: number;
  games_count: number;
  amount: number;
  paid_at: string;
};
