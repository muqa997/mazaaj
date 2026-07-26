"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { GAME_PRICE, type BilliardsTableRow } from "@/lib/billiards";

const POLL_INTERVAL_MS = 3000;

type BilliardsSummaryCardProps = {
  getBilliardsTables: () => Promise<BilliardsTableRow[]>;
  payAndResetBilliards: (tableNumber: number) => Promise<{ error: string | null }>;
};

export default function BilliardsSummaryCard(props: BilliardsSummaryCardProps) {
  const [tables, setTables] = useState<BilliardsTableRow[]>([]);
  const [busyTable, setBusyTable] = useState<number | null>(null);

  const load = async () => {
    setTables(await props.getBilliardsTables());
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePayAndReset = async (tableNumber: number) => {
    setBusyTable(tableNumber);
    await props.payAndResetBilliards(tableNumber);
    await load();
    setBusyTable(null);
  };

  if (tables.length === 0) return null;

  return (
    <div className="mb-4 rounded-2xl border border-primary/10 bg-background p-4">
      <h3 className="mb-3 text-sm font-bold text-primary">حساب البلياردو الحي</h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {tables.map((table) => {
          const amount = table.games_count * GAME_PRICE;
          const isBusy = busyTable === table.table_number;

          return (
            <div
              key={table.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-primary/5 px-3 py-2.5"
            >
              <div>
                <p className="text-xs font-semibold text-primary/60">
                  طاولة {table.table_number}
                </p>
                <p className="text-sm font-bold text-primary">
                  {amount.toLocaleString()} د.ع
                  <span className="ms-1 font-normal text-primary/50">
                    ({table.games_count} لعبة)
                  </span>
                </p>
              </div>
              <button
                type="button"
                disabled={isBusy || table.games_count === 0}
                onClick={() => handlePayAndReset(table.table_number)}
                aria-label="إنهاء الطلب وتصفير الطاولة"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 disabled:opacity-40"
              >
                <Wallet size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
