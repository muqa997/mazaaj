"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Minus, Wallet } from "lucide-react";
import { GAME_PRICE, type BilliardsTableRow } from "@/lib/billiards";

const POLL_INTERVAL_MS = 3000;

type BilliardsOperatorPageProps = {
  logoutAction: () => Promise<void>;
  refreshSessionAction: () => Promise<void>;
  getTables: () => Promise<BilliardsTableRow[]>;
  addGame: (tableNumber: number) => Promise<{ error: string | null }>;
  removeGame: (tableNumber: number) => Promise<{ error: string | null }>;
  payAndReset: (tableNumber: number) => Promise<{ error: string | null }>;
  getTodayPaidSummary: () => Promise<{ games: number; amount: number }>;
};

export default function BilliardsOperatorPage(props: BilliardsOperatorPageProps) {
  const router = useRouter();
  const [tables, setTables] = useState<BilliardsTableRow[]>([]);
  const [paidSummary, setPaidSummary] = useState({ games: 0, amount: 0 });
  const [loading, setLoading] = useState(true);
  const [busyTable, setBusyTable] = useState<number | null>(null);

  const load = async () => {
    const [t, s] = await Promise.all([props.getTables(), props.getTodayPaidSummary()]);
    setTables(t);
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

  const runAction = async (
    tableNumber: number,
    action: (n: number) => Promise<{ error: string | null }>
  ) => {
    setBusyTable(tableNumber);
    await action(tableNumber);
    await load();
    setBusyTable(null);
  };

  const pendingGames = tables.reduce((sum, t) => sum + t.games_count, 0);
  const totalGamesToday = pendingGames + paidSummary.games;

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

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 pb-28 sm:px-6">
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
                  className="flex flex-col gap-4 rounded-3xl border border-primary/10 bg-background p-5 shadow-glass"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-primary">
                      طاولة {table.table_number}
                    </h2>
                    <span className="text-sm font-semibold text-primary/60">
                      {table.games_count} لعبة
                    </span>
                  </div>

                  <p className="text-3xl font-extrabold text-accent">
                    {amount.toLocaleString()} <span className="text-base">د.ع</span>
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isBusy || table.games_count === 0}
                      onClick={() => runAction(table.table_number, props.removeGame)}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/5 disabled:opacity-40"
                      aria-label="إنقاص لعبة"
                    >
                      <Minus size={18} className="text-primary" />
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => runAction(table.table_number, props.addGame)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-semibold text-background disabled:opacity-60"
                    >
                      <Plus size={18} />
                      لعبة جديدة
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={isBusy || table.games_count === 0}
                    onClick={() => runAction(table.table_number, props.payAndReset)}
                    className="flex items-center justify-center gap-2 rounded-full border-2 border-accent py-3 text-sm font-semibold text-primary disabled:opacity-40"
                  >
                    <Wallet size={16} className="text-accent" />
                    دفع وتصفير
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/10 bg-background/95 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="text-center">
            <p className="text-xs text-primary/50">ألعاب اليوم</p>
            <p className="font-extrabold text-primary">{totalGamesToday}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-primary/50">الدخل المحصَّل اليوم</p>
            <p className="font-extrabold text-primary">
              {paidSummary.amount.toLocaleString()} د.ع
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
