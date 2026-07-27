"use client";

import { useEffect, useState } from "react";
import { Wallet, X } from "lucide-react";
import { GAME_PRICE, type BilliardsTableRow, type BilliardsTicketRow } from "@/lib/billiards";

const POLL_INTERVAL_MS = 3000;

type BilliardsSummaryCardProps = {
  getBilliardsTables: () => Promise<BilliardsTableRow[]>;
  getPendingTickets: () => Promise<BilliardsTicketRow[]>;
  payTicket: (ticketId: string) => Promise<{ error: string | null }>;
  cancelTicket: (ticketId: string) => Promise<{ error: string | null }>;
  getBilliardsTodayTotal: () => Promise<{ games: number; amount: number }>;
};

export default function BilliardsSummaryCard(props: BilliardsSummaryCardProps) {
  const [tables, setTables] = useState<BilliardsTableRow[]>([]);
  const [tickets, setTickets] = useState<BilliardsTicketRow[]>([]);
  const [todayTotal, setTodayTotal] = useState({ games: 0, amount: 0 });
  const [busyTicket, setBusyTicket] = useState<string | null>(null);

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

  if (tables.length === 0) return null;

  return (
    <div className="mb-4 flex flex-col gap-4">
      <div className="rounded-2xl border border-primary/10 bg-background p-4">
        <h3 className="mb-3 text-sm font-bold text-primary">حساب البلياردو الحي</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {tables.map((table) => {
            const amount = table.games_count * GAME_PRICE;
            return (
              <div key={table.id} className="rounded-xl bg-primary/5 px-3 py-2.5">
                <p className="text-xs font-semibold text-primary/60">
                  طاولة {table.table_number}
                </p>
                <p className="text-sm font-bold text-primary">
                  {amount.toLocaleString()} د.ع
                  <span className="ms-1 font-normal text-primary/50">
                    ({table.games_count} كيم)
                  </span>
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 border-t border-primary/10 pt-3 text-xs font-semibold text-primary/60">
          حساب البلياردو المستلم:{" "}
          <span className="text-primary">{todayTotal.amount.toLocaleString()} د.ع</span>
        </p>
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
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {Number(ticket.amount).toLocaleString()} د.ع
                      <span className="ms-1 font-normal text-primary/50">
                        ({ticket.games_count} كيم)
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
