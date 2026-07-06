"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Trash2, MessageSquare, ChevronDown } from "lucide-react";
import { STATUS_META, STATUS_ORDER, toWhatsAppNumber, buildConfirmMessage } from "@/lib/order-helpers";
import type { OrderRow, OrderStatus } from "@/lib/orders";

type StaffOrdersPageProps = {
  logoutAction: () => Promise<void>;
  refreshSessionAction: () => Promise<void>;
  getOrders: () => Promise<OrderRow[]>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<{ error: string | null }>;
  deleteOrder: (id: string) => Promise<{ error: string | null }>;
};

export default function StaffOrdersPage(props: StaffOrdersPageProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const o = await props.getOrders();
      setOrders(o ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    props.refreshSessionAction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await props.logoutAction();
    router.refresh();
  };

  const changeOrderStatus = async (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    await props.updateOrderStatus(id, status);
  };

  const removeOrder = async (id: string) => {
    await props.deleteOrder(id);
    loadOrders();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-primary/10 bg-background px-4 py-3 sm:px-6">
        <span className="font-extrabold text-primary">الطلبات</span>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="تسجيل الخروج"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5"
        >
          <LogOut size={18} className="text-primary" />
        </button>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {loading ? (
          <p className="py-10 text-center text-primary/50">جاري التحميل...</p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.length === 0 && (
              <p className="py-10 text-center text-primary/50">لا توجد طلبات بعد</p>
            )}
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const statusMeta = STATUS_META[order.status as OrderStatus] ?? STATUS_META.new;

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-primary/10 bg-background p-4"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    className="flex w-full items-center justify-between gap-3 text-start"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-primary">{order.customer_name}</p>
                      <p className="truncate text-sm text-primary/60">{order.address}</p>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-primary/40 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-3 border-t border-primary/10 pt-3">
                      <p className="mb-1 text-sm text-primary/60">{order.phone}</p>
                      <p className="mb-3 text-xs text-primary/40">
                        {new Date(order.created_at).toLocaleString("ar")}
                      </p>
                      <ul className="mb-3 flex flex-col gap-1">
                        {order.items?.map((item, i) => (
                          <li key={i} className="flex justify-between text-sm text-primary/70">
                            <span>
                              {item.name} × {item.qty}
                            </span>
                            <span>{(item.price * item.qty).toLocaleString()} د.ع</span>
                          </li>
                        ))}
                      </ul>
                      {order.notes && (
                        <p className="mb-3 text-sm text-primary/50">ملاحظات: {order.notes}</p>
                      )}
                      <p className="mb-3 font-bold text-primary">
                        الإجمالي: {Number(order.total).toLocaleString()} د.ع
                      </p>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-primary/10 pt-3">
                    <select
                      value={order.status}
                      onChange={(e) => changeOrderStatus(order.id, e.target.value as OrderStatus)}
                      className={`rounded-full border-0 px-3 py-1.5 text-xs font-bold ${statusMeta.classes}`}
                    >
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_META[s].label}
                        </option>
                      ))}
                    </select>

                    <a
                      href={`https://wa.me/${toWhatsAppNumber(order.phone)}?text=${buildConfirmMessage(order)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="تأكيد عبر واتساب"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700"
                    >
                      <MessageSquare size={16} />
                    </a>

                    <button
                      type="button"
                      onClick={() => removeOrder(order.id)}
                      aria-label="حذف الطلب"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/5"
                    >
                      <Trash2 size={14} className="text-red-500/70" />
                    </button>

                    <span className="ms-auto font-bold text-primary">
                      {Number(order.total).toLocaleString()} د.ع
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
