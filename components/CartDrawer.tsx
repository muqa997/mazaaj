"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, Ticket } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart-context";
import { validateCoupon } from "@/app/(site)/actions";

export default function CartDrawer() {
  const t = useTranslations("cart");
  const tMenu = useTranslations("menuPage");
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    updateQty,
    removeItem,
    total,
    coupon,
    setCoupon,
    discountAmount,
    discountedTotal,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [applying, setApplying] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplying(true);
    setCouponMessage(null);

    const result = await validateCoupon(couponInput);

    if (!result.valid) {
      setCouponMessage({ type: "error", text: t("couponInvalid") });
      setApplying(false);
      return;
    }

    const amount = Math.min(
      result.discountType === "percentage"
        ? (total * result.discountValue) / 100
        : result.discountValue,
      total
    );

    setCoupon({
      code: result.code,
      discountType: result.discountType,
      discountValue: result.discountValue,
    });
    setCouponMessage({
      type: "success",
      text: t("couponSuccess", { amount: amount.toLocaleString(), currency: tMenu("currency") }),
    });
    setApplying(false);
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    setCouponMessage(null);
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-[60] bg-primary/30 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 end-0 z-[70] flex w-full max-w-sm flex-col bg-background pt-safe shadow-glass-lg"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-primary/10 px-5 py-4">
              <h2 className="text-lg font-bold text-primary">{t("title")}</h2>
              <button
                type="button"
                aria-label="close"
                onClick={closeDrawer}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/5 active:scale-90"
              >
                <X size={18} className="text-primary/70" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <p className="mt-10 text-center text-sm text-primary/50">
                  {t("empty")}
                </p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-primary/10 p-3"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-primary">
                          {item.name}
                        </span>
                        <span className="text-xs text-primary/50">
                          {item.price.toLocaleString()} {tMenu("currency")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/5 active:scale-90"
                        >
                          <Minus size={14} className="text-primary/70" />
                        </button>
                        <span className="w-4 text-center text-sm font-semibold text-primary">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/5 active:scale-90"
                        >
                          <Plus size={14} className="text-primary/70" />
                        </button>
                        <button
                          type="button"
                          aria-label={t("remove")}
                          onClick={() => removeItem(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/5 text-red-500/70 active:scale-90"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="shrink-0 border-t border-primary/10 px-5 py-4 pb-safe">
                {coupon ? (
                  <div className="mb-3 flex items-center justify-between rounded-xl bg-accent/10 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Ticket size={16} className="text-accent" />
                      <span className="text-xs font-semibold text-primary">
                        {coupon.code}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      aria-label="remove coupon"
                      className="text-primary/50"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="mb-3 flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder={t("couponPlaceholder")}
                      className="flex-1 rounded-xl border border-primary/15 bg-background px-3 py-2.5 text-sm text-primary outline-none focus:border-accent"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={applying || !couponInput.trim()}
                      className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-background disabled:opacity-50"
                    >
                      {applying ? t("couponApplying") : t("couponApply")}
                    </button>
                  </div>
                )}

                {couponMessage && (
                  <p
                    className={`mb-3 text-xs font-semibold ${
                      couponMessage.type === "success" ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {couponMessage.text}
                  </p>
                )}

                {coupon && (
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-green-600">
                    <span>{t("couponDiscountLabel")}</span>
                    <span>
                      -{discountAmount.toLocaleString()} {tMenu("currency")}
                    </span>
                  </div>
                )}

                <div className="mb-3 flex items-center justify-between text-sm font-semibold text-primary">
                  <span>{t("total")}</span>
                  <span>
                    {discountedTotal.toLocaleString()} {tMenu("currency")}
                  </span>
                </div>
                <Link
                  href="/order/checkout"
                  onClick={closeDrawer}
                  className="flex w-full items-center justify-center rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-background shadow-glass"
                >
                  {t("checkout")}
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
