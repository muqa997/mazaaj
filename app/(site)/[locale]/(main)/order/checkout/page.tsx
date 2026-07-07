"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart-context";
import { WHATSAPP_NUMBER, DELIVERY_FEE } from "@/lib/config";
import { supabase } from "@/lib/supabase";
import { notifyNewOrder } from "./actions";

const PHONE_PATTERN = /^(07\d{9}|7\d{9})$/;

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const tMenu = useTranslations("menuPage");
  const { items, coupon, discountAmount, discountedTotal } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const grandTotal = discountedTotal + DELIVERY_FEE;
  const addressPrefix = t("addressFixedPrefix");
  const fullAddress = `${addressPrefix} - ${address}`;

  const buildWhatsAppMessage = () => {
    const lines = [
      `*طلب جديد من موقع كافيه مزاج*`,
      ``,
      `الاسم: ${name}`,
      `الهاتف: ${phone}`,
      `العنوان: ${fullAddress}`,
      notes ? `ملاحظات: ${notes}` : "",
      ``,
      `تفاصيل الطلب:`,
      ...items.map(
        (item) =>
          `- ${item.name} × ${item.qty} = ${(item.price * item.qty).toLocaleString()} ${tMenu(
            "currency"
          )}`
      ),
      ``,
      coupon ? `خصم الكوبون (${coupon.code}): -${discountAmount.toLocaleString()} ${tMenu("currency")}` : "",
      `أجور التوصيل: ${DELIVERY_FEE.toLocaleString()} ${tMenu("currency")}`,
      `الإجمالي: ${grandTotal.toLocaleString()} ${tMenu("currency")}`,
      `طريقة الدفع: نقدي عند الاستلام`,
    ].filter(Boolean);

    return encodeURIComponent(lines.join("\n"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!PHONE_PATTERN.test(phone)) return;

    // نحفظ الطلب بقاعدة البيانات لأغراض السجل والإحصائيات، دون إيقاف أو تأخير فتح واتساب
    if (supabase) {
      supabase
        .from("orders")
        .insert({
          customer_name: name,
          phone,
          address: fullAddress,
          notes: notes || null,
          items: items.map((item) => ({
            name: item.name,
            price: item.price,
            qty: item.qty,
          })),
          total: grandTotal,
          status: "new",
          coupon_code: coupon?.code ?? null,
          discount_amount: discountAmount,
          delivery_fee: DELIVERY_FEE,
        })
        .then(({ error }) => {
          if (error) console.error("Failed to save order to Supabase:", error);
        });
    }

    // إشعار بريدي لصاحب المقهى بالطلب الجديد — بدون انتظار، حتى لا يتأخر فتح واتساب
    notifyNewOrder({
      customerName: name,
      phone,
      address: fullAddress,
      notes: notes || null,
      items: items.map((item) => ({ name: item.name, price: item.price, qty: item.qty })),
      couponCode: coupon?.code ?? null,
      discountAmount,
      total: grandTotal,
    });

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage()}`;
    window.open(url, "_blank");
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <p className="mb-6 text-primary/50">{tCart("empty")}</p>
        <Link
          href="/order"
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-background"
        >
          {tMenu("title")}
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-2 text-3xl font-extrabold text-primary">{t("title")}</h1>
        <p className="mb-8 text-sm text-primary/50">{t("subtitle")}</p>

        <div className="mb-8 rounded-2xl border border-primary/10 p-4">
          <h2 className="mb-3 text-sm font-bold text-primary">
            {t("orderSummary")}
          </h2>
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between text-sm text-primary/70"
              >
                <span>
                  {item.name} × {item.qty}
                </span>
                <span>
                  {(item.price * item.qty).toLocaleString()} {tMenu("currency")}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-col gap-1.5 border-t border-primary/10 pt-3">
            {coupon && (
              <div className="flex items-center justify-between text-sm text-green-600">
                <span>
                  {tCart("couponDiscountLabel")} ({coupon.code})
                </span>
                <span>
                  -{discountAmount.toLocaleString()} {tMenu("currency")}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-primary/70">
              <span>{t("deliveryFeeLabel")}</span>
              <span>
                {DELIVERY_FEE.toLocaleString()} {tMenu("currency")}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1.5 text-sm font-bold text-primary">
              <span>{tCart("total")}</span>
              <span>
                {grandTotal.toLocaleString()} {tMenu("currency")}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary">
              {t("name")}
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="w-full rounded-xl border border-primary/15 bg-background px-4 py-3 text-sm text-primary outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary">
              {t("phone")}
            </label>
            <input
              required
              type="tel"
              inputMode="numeric"
              maxLength={11}
              pattern="^(07\d{9}|7\d{9})$"
              title={t("phoneInvalidTitle")}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder={t("phonePlaceholder")}
              className="w-full rounded-xl border border-primary/15 bg-background px-4 py-3 text-sm text-primary outline-none focus:border-accent"
            />
            <p className="mt-1.5 text-xs text-primary/50">{t("phoneHint")}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary">
              {t("address")}
            </label>
            <div className="flex items-center rounded-xl border border-primary/15 bg-background focus-within:border-accent">
              <span className="shrink-0 whitespace-nowrap border-e border-primary/15 px-3 py-3 text-sm font-semibold text-primary/50">
                {addressPrefix}
              </span>
              <input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("addressPlaceholder")}
                className="w-full min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary">
              {t("notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={3}
              className="w-full resize-none rounded-xl border border-primary/15 bg-background px-4 py-3 text-sm text-primary outline-none focus:border-accent"
            />
          </div>

          <p className="text-center text-xs font-semibold text-primary/50">
            {t("paymentMethodNote")}
          </p>

          <button
            type="submit"
            className="mt-2 flex items-center justify-center rounded-full bg-primary px-6 py-4 text-sm font-semibold text-background shadow-glass active:scale-95"
          >
            {t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
