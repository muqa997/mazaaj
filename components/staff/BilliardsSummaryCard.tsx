"use client";

import { useEffect, useState } from "react";
import { Wallet, X } from "lucide-react";
import { computePoolAmount, type BilliardsTableRow, type BilliardsTicketRow } from "@/lib/billiards";

const POLL_INTERVAL_MS = 3000;

type BilliardsSummaryCardProps = {
  getBilliardsTables: () => Promise<BilliardsTableRow[]>;
  getPendingTickets: () => Promise<BilliardsTicketRow[]>;
  payTicket: (ticketId: string) => Promise<{ error: string | null }>;
  cancelTicket: (ticketId: string) => Promise<{ error: string | null }>;
  payTableDirect: (tableNumber: number) => Promise<{ error: string | null }>;
  getBilliardsTodayTotal: () => Promise<{ games: number; amount: number }>;
};

function ActiveDot() {
  return (
    <span className="absolute end-2.5 top-2.5 flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
    </span>
  );
}

export default function BilliardsSummaryCard(props: BilliardsSummaryCardProps) {
  const [tables, setTables] = useState<BilliardsTableRow[]>([]);
  const [tickets, setTickets] = useState<BilliardsTicketRow[]>([]);
  const [todayTotal, setTodayTotal] = useState({ games: 0, amount: 0 });
  const [busyTicket, setBusyTicket] = useState<string | null>(null);
  const [busyTable, setBusyTable] = useState<number | null>(null);

  const load = async () => {
    const [t, tk, total] = await Promise.all([
      props.getBilliardsTables(),
      props.getPendingTickets(),
      props.getBilliardsTodayTotal(),
    ]);
    setTables(t);
    setTickets(tk);
    setTodayTotal(total);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePay = async (ticketId: string) => {
    setBusyTicket(ticketId);
    await props.payTicket(ticketId);
    await load();
    setBusyTicket(null);
  };

  const handleCancel = async (ticketId: string) => {
    setBusyTicket(ticketId);
    await props.cancelTicket(ticketId);
    await load();
    setBusyTicket(null);
  };

  const handlePayTable = async (table: BilliardsTableRow) => {
    const amount = computePoolAmount(table.games_count, table.games_count_9ball);
    const confirmed = window.confirm(
      `تأكيد استلام حساب طاولة ${table.table_number} بمبلغ ${amount.toLocaleString("en-US")} د.ع؟\nسيتم تصفير الطاولة فوراً ولا يمكن التراجع عن هذا الإجراء.`
    );
    if (!confirmed) return;
    setBusyTable(table.table_number);
    await props.payTableDirect(table.table_number);
    await load();
    setBusyTable(null);
  };

  if (tables.length === 0) return null;

  return (
    <div className="mb-4 flex flex-col gap-4">
      <div className="rounded-2xl border border-primary/10 bg-background p-4">
        <h3 className="mb-3 text-sm font-bold text-primary">حساب البلياردو الحي</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {tables.map((table) => {
            const amount = computePoolAmount(table.games_count, table.games_count_9ball);
            const isActive = table.games_count > 0 || table.games_count_9ball > 0;
            const isBusy = busyTable === table.table_number;
            return (
              <div key={table.id} className="relative rounded-xl bg-primary/5 px-4 py-3.5">
                {isActive && <ActiveDot />}
                <p className="mb-1 text-sm font-semibold text-primary/60">
                  طاولة {table.table_number}
                </p>
                {table.customer_ref && (
                  <p className="mb-1 truncate text-xs font-semibold text-accent">
                    {table.customer_ref}
                  </p>
                )}
                <p className="text-lg font-bold text-primary">
                  {amount.toLocaleString("en-US")} د.ع
                </p>
                <p dir="ltr" className="mb-3 text-xs text-primary/50">
                  8 Pool: {table.games_count} · 9 Pool: {table.games_count_9ball}
                </p>
                <button
                  type="button"
                  disabled={!isActive || isBusy}
                  onClick={() => handlePayTable(table)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-green-100 py-1.5 text-green-700 disabled:opacity-40"
                >
                  <Wallet size={13} />
                  <span className="text-xs font-bold">دفع</span>
                </button>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-col items-center gap-1 rounded-2xl bg-primary/5 py-4 text-center">
          <p className="text-sm font-semibold text-primary/60">حساب البلياردو المستلم</p>
          <p className="text-2xl font-extrabold text-primary">
            {todayTotal.amount.toLocaleString("en-US")} د.ع
          </p>
        </div>
      </div>

      {tickets.length > 0 && (
        <div className="rounded-2xl border border-primary/10 bg-background p-4">
          <h3 className="mb-3 text-sm font-bold text-primary">التذاكر المعلّقة</h3>
          <div className="flex flex-col gap-2">
            {tickets.map((ticket) => {
              const isBusy = busyTicket === ticket.id;
              return (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-primary/5 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-primary/60">
                      {ticket.customer_ref || "بدون اسم"} — طاولة بلياردو {ticket.table_number}
                      <span className="ms-1 font-normal text-primary/40">
                        (
                        {new Date(ticket.created_at).toLocaleTimeString("ar", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        )
                      </span>
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {Number(ticket.amount).toLocaleString("en-US")} د.ع
                      <span dir="ltr" className="ms-1 font-normal text-primary/50">
                        ({ticket.games_count} 8 Pool
                        {ticket.games_count_9ball > 0 && ` + ${ticket.games_count_9ball} 9 Pool`})
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleCancel(ticket.id)}
                      aria-label="إلغاء التذكرة"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 text-primary/50 disabled:opacity-40"
                    >
                      <X size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handlePay(ticket.id)}
                      className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1.5 text-green-700 disabled:opacity-40"
                    >
                      <Wallet size={13} />
                      <span className="text-[11px] font-bold">دفع</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
