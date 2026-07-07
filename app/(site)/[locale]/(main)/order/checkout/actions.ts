"use server";

import { resend } from "@/lib/resend";
import { DELIVERY_FEE } from "@/lib/config";

const NOTIFY_EMAIL = process.env.ORDER_NOTIFY_EMAIL || "info@mazaajcafe.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

type OrderNotificationInput = {
  customerName: string;
  phone: string;
  address: string;
  notes: string | null;
  items: { name: string; price: number; qty: number }[];
  couponCode: string | null;
  discountAmount: number;
  total: number;
};

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// يُستدعى من صفحة الدفع فور إرسال الطلب (دون انتظار النتيجة) لإخطار صاحب المقهى
// عبر البريد الإلكتروني — فشل الإرسال هنا لا يجب أن يوقف أو يؤخر إتمام الطلب
export async function notifyNewOrder(order: OrderNotificationInput) {
  if (!resend) return;

  const itemsHtml = order.items
    .map(
      (i) =>
        `<li>${escapeHtml(i.name)} × ${i.qty} = ${(i.price * i.qty).toLocaleString()} د.ع</li>`
    )
    .join("");

  try {
    await resend.emails.send({
      from: `كافيه مزاج <${FROM_EMAIL}>`,
      to: NOTIFY_EMAIL,
      subject: `طلب جديد من ${order.customerName}`,
      html: `
        <div dir="rtl" style="font-family: sans-serif; line-height: 1.7;">
          <h2>طلب جديد من موقع كافيه مزاج</h2>
          <p><strong>الاسم:</strong> ${escapeHtml(order.customerName)}</p>
          <p><strong>الهاتف:</strong> ${escapeHtml(order.phone)}</p>
          <p><strong>العنوان:</strong> ${escapeHtml(order.address)}</p>
          ${order.notes ? `<p><strong>ملاحظات:</strong> ${escapeHtml(order.notes)}</p>` : ""}
          <h3>تفاصيل الطلب:</h3>
          <ul>${itemsHtml}</ul>
          ${
            order.couponCode
              ? `<p><strong>خصم الكوبون (${escapeHtml(order.couponCode)}):</strong> -${order.discountAmount.toLocaleString()} د.ع</p>`
              : ""
          }
          <p><strong>أجور التوصيل:</strong> ${DELIVERY_FEE.toLocaleString()} د.ع</p>
          <p><strong>الإجمالي:</strong> ${order.total.toLocaleString()} د.ع</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send order notification email:", err);
  }
}
