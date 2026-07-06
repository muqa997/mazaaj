"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart-context";
import { WHATSAPP_NUMBER } from "@/lib/config";
import { supabase } from "@/lib/supabase";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const tMenu = useTranslations("menuPage");
  const { items, total } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const buildWhatsAppMessage = () => {
    const lines = [
      `*طلب جديد من موقع كافيه مزاج*`,
      ``,
      `الاسم: ${name}`,
      `الهاتف: ${phone}`,
      `العنوان: ${address}`,
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
      `الإجمالي: ${total.toLocaleString()} ${tMenu("currency")}`,
      `طريقة الدفع: نقدي عند الاستلام`,
    ].filter(Boolean);

    return encodeURIComponent(lines.join("\n"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // نحفظ الطلب بقاعدة البيانات لأغراض السجل والإحصائيات، دون إيقاف أو تأخير فتح واتساب
    if (supabase) {
      supabase
        .from("orders")
        .insert({
          customer_name: name,
          phone,
          address,
          notes: notes || null,
          items: items.map((item) => ({
            name: item.name,
            price: item.price,
            qty: item.qty,
          })),
          total,
          status: "new",
        })
        .then(({ error }) => {
          if (error) console.error("Failed to save order to Supabase:", error);
        });
    }

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
          <div className="mt-3 flex items-center justify-between border-t border-primary/10 pt-3 text-sm font-bold text-primary">
            <span>{tCart("total")}</span>
            <span>
              {total.toLocaleString()} {tMenu("currency")}
            </span>
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
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("phonePlaceholder")}
              className="w-full rounded-xl border border-primary/15 bg-background px-4 py-3 text-sm text-primary outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-primary">
              {t("address")}
            </label>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("addressPlaceholder")}
              className="w-full rounded-xl border border-primary/15 bg-background px-4 py-3 text-sm text-primary outline-none focus:border-accent"
            />
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
