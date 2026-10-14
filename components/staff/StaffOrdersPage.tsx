"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Trash2, MessageSquare, ChevronDown, RefreshCw, BellRing } from "lucide-react";
import { useSyncSignal } from "@/lib/use-sync-signal";
import { playNewOrderAlert, useUnlockChime } from "@/lib/use-new-order-alert";
import { STATUS_META, STATUS_ORDER, toWhatsAppNumber, buildConfirmMessage } from "@/lib/order-helpers";
import type { OrderRow, OrderStatus } from "@/lib/orders";
import type { BilliardsTableRow, BilliardsTicketRow } from "@/lib/billiards";
import BilliardsSummaryCard from "./BilliardsSummaryCard";

type StaffOrdersPageProps = {
  logoutAction: () => Promise<void>;
  refreshSessionAction: () => Promise<void>;
  getOrders: () => Promise<OrderRow[]>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<{ error: string | null }>;
  deleteOrder: (id: string) => Promise<{ error: string | null }>;
  getBilliardsTables: () => Promise<BilliardsTableRow[]>;
  getPendingTickets: () => Promise<BilliardsTicketRow[]>;
  payTicket: (ticketId: string) => Promise<{ error: string | null }>;
  cancelTicket: (ticketId: string, reason: string) => Promise<{ error: string | null }>;
  payTableDirect: (tableNumber: number) => Promise<{ error: string | null }>;
  getBilliardsTodayTotal: () => Promise<{ games: number; amount: number }>;
  getBilliardsOverdueTotal: () => Promise<{ amount: number; count: number }>;
  getBilliardsYesterdaySummary: () => Promise<{
    amount: number;
    count: number;
    unsettledCount: number;
  }>;
};

type StaffTab = "billiards" | "orders";

export default function StaffOrdersPage(props: StaffOrdersPageProps) {
  const router = useRouter();
  const [tab, setTab] = useState<StaffTab>("billiards");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newOrdersWaiting, setNewOrdersWaiting] = useState(0);
  // دالة تحديث بطاقة البلياردو، تُسجّلها البطاقة عند أول عرض
  const reloadBilliardsRef = useRef<(() => Promise<void>) | null>(null);

  // showSpinner=false عند التحديث اليدوي: بدونها تومض القائمة "جاري التحميل" في كل
  // ضغطة، فتبدو الصفحة مضطربة ويفقد الكاشير مكانه بالقائمة
  const loadOrders = useCallback(
    async (showSpinner = false) => {
      if (showSpinner) setLoading(true);
      try {
        const o = await props.getOrders();
        setOrders(o ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    loadOrders(true);
    props.refreshSessionAction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // لا استطلاع دوري ولا جلب تلقائي — الكاشير يحدّث بالزر الكبير أدناه. زر واحد
  // يحدّث التبويبين معاً، فلا يفوته شيء لمجرد أنه كان على التبويب الآخر
  const handleManualRefresh = async () => {
    setRefreshing(true);
    setNewOrdersWaiting(0);
    try {
      await Promise.all([loadOrders(), reloadBilliardsRef.current?.()]);
    } finally {
      setRefreshing(false);
    }
  };

  // تنبيه الطلب الجديد: **إشعار فقط، بلا جلب تلقائي**. تصل رسالة واحدة فارغة لكل طلب
  // حقيقي (لا عند تغيير حالة أو حذف)، فترنّ النغمة ويظهر شريط أحمر — والقائمة لا
  // تتحدّث إلا بضغطة الكاشير. يعني تنبيه موثوق بلا أي استهلاك للخطة
  useUnlockChime();
  useSyncSignal("new-order", () => {
    setNewOrdersWaiting((n) => n + 1);
    playNewOrderAlert();
  });

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

  // ترتيب الطلبات ثابت (الأحدث أولاً) ويأتي جاهزاً من الخادم، فلا تتبعثر البطاقات
  // ولا تقفز أماكنها عند كل تحديث لحظي

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-primary/10 bg-background px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-primary">صفحة الكاشير</span>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="تسجيل الخروج"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5"
          >
            <LogOut size={18} className="text-primary" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("billiards")}
            className={`flex-1 rounded-full py-2 text-sm font-bold ${
              tab === "billiards" ? "bg-primary text-background" : "bg-primary/5 text-primary/60"
            }`}
          >
            البلياردو
          </button>
          <button
            type="button"
            onClick={() => setTab("orders")}
            className={`flex-1 rounded-full py-2 text-sm font-bold ${
              tab === "orders" ? "bg-primary text-background" : "bg-primary/5 text-primary/60"
            }`}
          >
            الطلبات
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {newOrdersWaiting > 0 && (
          <button
            type="button"
            onClick={handleManualRefresh}
            className="mb-3 flex w-full animate-pulse items-center justify-center gap-3 rounded-2xl bg-red-600 px-4 py-4 text-base font-extrabold text-white shadow-glass active:scale-[0.98]"
          >
            <BellRing size={22} />
            {newOrdersWaiting === 1
              ? "وصل طلب جديد — اضغط لعرضه"
              : `وصلت ${newOrdersWaiting.toLocaleString("en-US")} طلبات جديدة — اضغط لعرضها`}
          </button>
        )}

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="mb-5 flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-lg font-extrabold text-background shadow-glass active:scale-[0.98] disabled:opacity-60"
        >
          <RefreshCw size={22} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "جاري التحديث..." : "تحديث الصفحة"}
        </button>

        {tab === "billiards" && (
          <BilliardsSummaryCard
            registerReload={(reload) => {
              reloadBilliardsRef.current = reload;
            }}
            getBilliardsTables={props.getBilliardsTables}
            getPendingTickets={props.getPendingTickets}
            payTicket={props.payTicket}
            cancelTicket={props.cancelTicket}
            payTableDirect={props.payTableDirect}
            getBilliardsTodayTotal={props.getBilliardsTodayTotal}
            getBilliardsOverdueTotal={props.getBilliardsOverdueTotal}
            getBilliardsYesterdaySummary={props.getBilliardsYesterdaySummary}
          />
        )}

        {tab === "orders" && (loading ? (
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
        ))}
      </main>
    </div>
  );
}
