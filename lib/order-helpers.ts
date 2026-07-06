import type { OrderRow, OrderStatus } from "@/lib/orders";

export const STATUS_META: Record<OrderStatus, { label: string; classes: string }> = {
  new: { label: "جديد", classes: "bg-amber-100 text-amber-800" },
  confirmed: { label: "مؤكد", classes: "bg-blue-100 text-blue-700" },
  delivered: { label: "مسلم", classes: "bg-green-100 text-green-700" },
  cancelled: { label: "ملغي", classes: "bg-red-100 text-red-700" },
};

export const STATUS_ORDER: OrderStatus[] = ["new", "confirmed", "delivered", "cancelled"];

export function toWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `964${digits.slice(1)}`;
  if (digits.startsWith("964")) return digits;
  return digits;
}

// رسالة تأكيد الطلب المرسلة للزبون عبر واتساب — منسّقة بنفس صيغة رسالة الطلب
// الأصلية (تشمل خصم الكوبون وأجور التوصيل قبل الإجمالي)
export function buildConfirmMessage(order: OrderRow) {
  const lines = [
    `مرحباً ${order.customer_name}،`,
    `يسعدنا طلبكم، ونود تأكيد طلبكم رقم #${order.id.slice(0, 8).toUpperCase()}`,
    ``,
    `تفاصيل الطلب:`,
    ...(order.items ?? []).map(
      (i) => `- ${i.name} × ${i.qty} = ${(i.price * i.qty).toLocaleString()} د.ع`
    ),
    ``,
    order.coupon_code
      ? `خصم الكوبون (${order.coupon_code}): -${(Number(order.discount_amount) || 0).toLocaleString()} د.ع`
      : "",
    `أجور التوصيل: ${(Number(order.delivery_fee) || 0).toLocaleString()} د.ع`,
    `الإجمالي: ${Number(order.total).toLocaleString()} د.ع`,
    ``,
    `يرجى التأكيد`,
  ].filter(Boolean);
  return encodeURIComponent(lines.join("\n"));
}
