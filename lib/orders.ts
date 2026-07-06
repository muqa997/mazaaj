export type OrderStatus = "new" | "confirmed" | "delivered" | "cancelled";

export type OrderItem = { name: string; price: number; qty: number };

export type OrderRow = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  notes: string | null;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  coupon_code: string | null;
  discount_amount: number;
  delivery_fee: number;
  created_at: string;
};
