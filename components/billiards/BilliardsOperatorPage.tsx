"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Minus, Send } from "lucide-react";
import { GAME_PRICE, type BilliardsTableRow, type BilliardsTicketRow } from "@/lib/billiards";

const POLL_INTERVAL_MS = 3000;

type PaidBucket = { games: number; amount: number };

type BilliardsOperatorPageProps = {
  logoutAction: () => Promise<void>;
  refreshSessionAction: () => Promise<void>;
  getTables: () => Promise<BilliardsTableRow[]>;
  addGame: (tableNumber: number) => Promise<{ error: string | null }>;
  removeGame: (tableNumber: number) => Promise<{ error: string | null }>;
  endSession: (tableNumber: number, customerRef: string) => Promise<{ error: string | null }>;
  getPendingTickets: () => Promise<BilliardsTicketRow[]>;
  getTodayPaidSummary: () => Promise<{ billiards: PaidBucket; cashier: PaidBucket }>;
};

// نقاط الجيوب الستّة بطاولة البلياردو الحقيقية — 4 بالزوايا واثنتان بمنتصف الضلعين الطويلين
const POCKET_POSITIONS = [
  "start-2 top-2",
  "end-2 top-2",
  "start-2 bottom-2",
  "end-2 bottom-2",
  "start-1/2 top-2 -translate-x-1/2",
  "start-1/2 bottom-2 -translate-x-1/2",
];

function BilliardsTablePockets() {
  return (
    <>
      {POCKET_POSITIONS.map((pos, i) => (
        <span
          key={i}
          className={`absolute ${pos} h-3.5 w-3.5 rounded-full bg-black/80 ring-2 ring-black/30`}
        />
      ))}
    </>
  );
}

export default function BilliardsOperatorPage(props: BilliardsOperatorPageProps) {
  const router = useRouter();
  const [tables, setTables] = useState<BilliardsTableRow[]>([]);
  const [pendingTickets, setPendingTickets] = useState<BilliardsTicketRow[]>([]);
  const [paidSummary, setPaidSummary] = useState<{ billiards: PaidBucket; cashier: PaidBucket }>({
    billiards: { games: 0, amount: 0 },
    cashier: { games: 0, amount: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [busyTable, setBusyTable] = useState<number | null>(null);
  const [customerRefs, setCustomerRefs] = useState<Record<number, string>>({});

  const load = async () => {
    const [t, tickets, s] = await Promise.all([
      props.getTables(),
      props.getPendingTickets(),
      props.getTodayPaidSummary(),
    ]);
    setTables(t);
    setPendingTickets(tickets);
    setPaidSummary(s);
    setLoading(false);
  };

  useEffect(() => {
    load();
    props.refreshSessionAction();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await props.logoutAction();
    router.refresh();
  };

  const runCountAction = async (
    tableNumber: number,
    action: (n: number) => Promise<{ error: string | null }>
  ) => {
    setBusyTable(tableNumber);
    await action(tableNumber);
    await load();
    setBusyTable(null);
  };

  const handleEndSession = async (tableNumber: number) => {
    setBusyTable(tableNumber);
    await props.endSession(tableNumber, customerRefs[tableNumber] ?? "");
    setCustomerRefs((prev) => ({ ...prev, [tableNumber]: "" }));
    await load();
    setBusyTable(null);
  };

  const pendingGames = tables.reduce((sum, t) => sum + t.games_count, 0);
  const pendingTicketsGames = pendingTickets.reduce((sum, t) => sum + t.games_count, 0);
  const totalGamesToday = pendingGames + pendingTicketsGames + paidSummary.cashier.games;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-primary/10 bg-background px-4 py-3 sm:px-6">
        <span className="font-extrabold text-primary">صالة البلياردو</span>
        <button
          type="button"
          onClick={handleLogout}
          aria-label="تسجيل الخروج"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5"
        >
          <LogOut size={18} className="text-primary" />
        </button>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-24 sm:px-6">
        {loading ? (
          <p className="py-10 text-center text-primary/50">جاري التحميل...</p>
        ) : (
          <div className="flex flex-col gap-4">
            {tables.map((table) => {
              const amount = table.games_count * GAME_PRICE;
              const isBusy = busyTable === table.table_number;

              return (
                <div
                  key={table.id}
                  className="relative flex flex-col gap-4 overflow-hidden rounded-3xl p-6 shadow-glass"
                  style={{ backgroundColor: "#1a4f8f" }}
                >
                  <BilliardsTablePockets />

                  <div className="relative z-10 flex items-start justify-between">
                    <h2 className="text-2xl font-extrabold text-white">
                      طاولة {table.table_number}
                    </h2>
                    <div className="text-left">
                      <p className="text-xl font-extrabold text-white">
                        {table.games_count} كيم
                      </p>
                      <p className="text-sm font-semibold text-white/70">
                        {amount.toLocaleString()} د.ع
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isBusy || table.games_count === 0}
                      onClick={() => runCountAction(table.table_number, props.removeGame)}
                      className="flex items-center gap-1 rounded-full bg-red-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                      aria-label="إنقاص كيم"
                    >
                      <Minus size={14} />
                      كيم
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => runCountAction(table.table_number, props.addGame)}
                      className="flex items-center gap-1.5 rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      <Plus size={16} />
                      كيم جديد
                    </button>
                  </div>

                  <div className="relative z-10 flex items-center gap-2 border-t border-white/20 pt-4">
                    <input
                      type="text"
                      value={customerRefs[table.table_number] ?? ""}
                      onChange={(e) =>
                        setCustomerRefs((prev) => ({
                          ...prev,
                          [table.table_number]: e.target.value,
                        }))
                      }
                      placeholder="اسم الزبون أو رقم طاولة الجلوس"
                      className="w-full min-w-0 flex-1 rounded-full bg-white/15 px-3.5 py-2 text-xs text-white placeholder:text-white/50 outline-none"
                    />
                    <button
                      type="button"
                      disabled={isBusy || table.games_count === 0}
                      onClick={() => handleEndSession(table.table_number)}
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/50 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      <Send size={14} />
                      إنهاء الجلسة
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-primary/10 bg-background p-5">
          <h3 className="mb-3 text-sm font-bold text-primary">الفواتير المعلّقة (لم تُدفع بعد)</h3>
          {pendingTickets.length === 0 ? (
            <p className="text-sm text-primary/50">لا توجد فواتير معلّقة حالياً</p>
          ) : (
            <div className="flex flex-col gap-2">
              {pendingTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/5 pb-2 text-sm last:border-0"
                >
                  <span className="font-semibold text-primary">
                    {ticket.customer_ref || "بدون اسم"}
                  </span>
                  <span className="text-primary/50">
                    {new Date(ticket.created_at).toLocaleString("ar")}
                  </span>
                  <span className="font-bold text-primary">
                    {Number(ticket.amount).toLocaleString()} د.ع
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/10 bg-background/95 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-center">
          <div className="text-center">
            <p className="text-xs text-primary/50">كيمات اليوم</p>
            <p className="font-extrabold text-primary">{totalGamesToday}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
