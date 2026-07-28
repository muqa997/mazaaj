"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Minus, Send, Trash2 } from "lucide-react";
import {
  computePoolAmount,
  type BilliardsTableRow,
  type BilliardsTicketRow,
  type BilliardsNoteRow,
} from "@/lib/billiards";

const POLL_INTERVAL_MS = 3000;

type PoolType = "eight" | "nine";
type PoolCounts = { eight: number; nine: number };
type OperatorStats = {
  today: PoolCounts;
  week: PoolCounts;
  month: PoolCounts;
  perTable: { table_number: number; eight: number; nine: number }[];
};

const EMPTY_STATS: OperatorStats = {
  today: { eight: 0, nine: 0 },
  week: { eight: 0, nine: 0 },
  month: { eight: 0, nine: 0 },
  perTable: [1, 2, 3].map((n) => ({ table_number: n, eight: 0, nine: 0 })),
};

type BilliardsOperatorPageProps = {
  logoutAction: () => Promise<void>;
  refreshSessionAction: () => Promise<void>;
  getTables: () => Promise<BilliardsTableRow[]>;
  setGameCount: (tableNumber: number, pool: PoolType, count: number) => Promise<{ error: string | null }>;
  updateCustomerRef: (tableNumber: number, customerRef: string) => Promise<{ error: string | null }>;
  endSession: (tableNumber: number, customerRef: string) => Promise<{ error: string | null }>;
  getPendingTickets: () => Promise<BilliardsTicketRow[]>;
  getStats: () => Promise<OperatorStats>;
  getNotes: () => Promise<BilliardsNoteRow[]>;
  addNote: (text: string) => Promise<{ error: string | null }>;
  deleteNote: (noteId: string) => Promise<{ error: string | null }>;
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

// نقطة خضراء نابضة تدل أن الطاولة نشطة حالياً (فيها كيمات لم تُدفع بعد) — تتوسط أعلى البطاقة
function ActiveDot() {
  return (
    <span className="absolute start-1/2 top-4 z-10 flex h-3 w-3 -translate-x-1/2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
    </span>
  );
}

export default function BilliardsOperatorPage(props: BilliardsOperatorPageProps) {
  const router = useRouter();
  const [tables, setTables] = useState<BilliardsTableRow[]>([]);
  const [pendingTickets, setPendingTickets] = useState<BilliardsTicketRow[]>([]);
  const [stats, setStats] = useState<OperatorStats>(EMPTY_STATS);
  const [notes, setNotes] = useState<BilliardsNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyTable, setBusyTable] = useState<number | null>(null);
  const [customerRefs, setCustomerRefs] = useState<Record<number, string>>({});
  const [noteText, setNoteText] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const focusedTableRef = useRef<number | null>(null);
  // مؤقتات تجميع الضغطات السريعة (debounce) لكل طاولة+قسم — مفتاحها "رقم الطاولة:القسم"
  const pendingSyncRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const load = async () => {
    const [t, tickets, s, n] = await Promise.all([
      props.getTables(),
      props.getPendingTickets(),
      props.getStats(),
      props.getNotes(),
    ]);
    // لا نستبدل عداد طاولة+قسم لا يزال بانتظار مزامنة مؤجَّلة (debounce) — لتجنّب أن
    // يُصفِّر الاستطلاع الدوري القيمة المحلية قبل وصول التحديث الفعلي للخادم
    setTables((prevTables) =>
      t.map((freshTable) => {
        const prevTable = prevTables.find((p) => p.table_number === freshTable.table_number);
        if (!prevTable) return freshTable;
        const eightPending = pendingSyncRef.current[`${freshTable.table_number}:eight`];
        const ninePending = pendingSyncRef.current[`${freshTable.table_number}:nine`];
        return {
          ...freshTable,
          games_count: eightPending ? prevTable.games_count : freshTable.games_count,
          games_count_9ball: ninePending ? prevTable.games_count_9ball : freshTable.games_count_9ball,
        };
      })
    );
    // لا نستبدل قيمة الحقل أثناء كتابة الموظف فيه حالياً (تجنّباً لمسحه بمزامنة الاستطلاع)
    setCustomerRefs((prev) => {
      const next = { ...prev };
      for (const table of t) {
        if (focusedTableRef.current !== table.table_number) {
          next[table.table_number] = table.customer_ref ?? "";
        }
      }
      return next;
    });
    setPendingTickets(tickets);
    setStats(s);
    setNotes(n);
    setLoading(false);
  };

  useEffect(() => {
    load();
    props.refreshSessionAction();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      Object.values(pendingSyncRef.current).forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await props.logoutAction();
    router.refresh();
  };

  // تحديث تفاؤلي فوري للعداد المحلي عند كل ضغطة (بلا أي تأخير محسوس)، لكن الإرسال
  // الفعلي للخادم يُجمَّع (debounce ~900ms): كل ضغطات المستخدم السريعة المتتالية على
  // نفس العداد تُلغي المؤقّت السابق وتُعيد جدولته، فلا يُرسَل للخادم إلا القيمة
  // النهائية مرة واحدة — هذا يمنع تعارض عدة طلبات "اقرأ ثم زِد بواحد" المتزامنة التي
  // كانت تُفقِد بعض الضغطات وتُظهر رقماً خاطئاً عند الضغط السريع
  const adjustGame = (tableNumber: number, pool: PoolType, delta: 1 | -1) => {
    let nextCount = 0;
    setTables((prev) =>
      prev.map((t) => {
        if (t.table_number !== tableNumber) return t;
        if (pool === "eight") {
          nextCount = Math.max(0, t.games_count + delta);
          return { ...t, games_count: nextCount };
        }
        nextCount = Math.max(0, t.games_count_9ball + delta);
        return { ...t, games_count_9ball: nextCount };
      })
    );

    const key = `${tableNumber}:${pool}`;
    if (pendingSyncRef.current[key]) clearTimeout(pendingSyncRef.current[key]);
    pendingSyncRef.current[key] = setTimeout(() => {
      delete pendingSyncRef.current[key];
      props.setGameCount(tableNumber, pool, nextCount);
    }, 900);
  };

  const handleCustomerRefBlur = async (tableNumber: number) => {
    focusedTableRef.current = null;
    await props.updateCustomerRef(tableNumber, customerRefs[tableNumber] ?? "");
  };

  const handleEndSession = async (tableNumber: number) => {
    setBusyTable(tableNumber);
    await props.endSession(tableNumber, customerRefs[tableNumber] ?? "");
    await load();
    setBusyTable(null);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setNoteBusy(true);
    await props.addNote(noteText);
    setNoteText("");
    await load();
    setNoteBusy(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    setNoteBusy(true);
    await props.deleteNote(noteId);
    await load();
    setNoteBusy(false);
  };

  const maxTablePool = Math.max(1, ...stats.perTable.flatMap((t) => [t.eight, t.nine]));

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
              const totalGames = table.games_count + table.games_count_9ball;
              const amount = computePoolAmount(table.games_count, table.games_count_9ball);
              const isBusy = busyTable === table.table_number;
              const isActive = totalGames > 0;

              return (
                <div
                  key={table.id}
                  className="relative flex flex-col gap-4 overflow-hidden rounded-3xl p-6 shadow-glass"
                  style={{ backgroundColor: "#1a4f8f" }}
                >
                  <BilliardsTablePockets />
                  {isActive && <ActiveDot />}

                  <div className="relative z-10 flex items-start justify-between">
                    <h2 className="text-2xl font-extrabold text-white">
                      طاولة {table.table_number}
                    </h2>
                    <div className="text-left">
                      <p className="text-xl font-extrabold text-white">{totalGames} كيم</p>
                      <p className="text-sm font-semibold text-white/70">
                        {amount.toLocaleString("en-US")} د.ع
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 flex items-stretch gap-3">
                    <div className="flex flex-[6] flex-col items-center gap-2 rounded-2xl bg-black/60 px-3 py-3.5">
                      <span dir="ltr" className="text-base font-bold text-white">8 Pool</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={table.games_count === 0}
                          onClick={() => adjustGame(table.table_number, "eight", -1)}
                          aria-label="إنقاص كيم 8 Pool"
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white disabled:opacity-40"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-6 text-center text-base font-extrabold text-white">
                          {table.games_count}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustGame(table.table_number, "eight", 1)}
                          aria-label="زيادة كيم 8 Pool"
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-[5] flex-col items-center gap-1.5 rounded-2xl bg-yellow-400/60 px-2 py-2.5">
                      <span dir="ltr" className="text-xs font-bold text-white">9 Pool</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={table.games_count_9ball === 0}
                          onClick={() => adjustGame(table.table_number, "nine", -1)}
                          aria-label="إنقاص كيم 9 Pool"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white disabled:opacity-40"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-4 text-center text-sm font-extrabold text-white">
                          {table.games_count_9ball}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustGame(table.table_number, "nine", 1)}
                          aria-label="زيادة كيم 9 Pool"
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 flex items-center gap-2 border-t border-white/20 pt-4">
                    <input
                      type="text"
                      value={customerRefs[table.table_number] ?? ""}
                      onFocus={() => {
                        focusedTableRef.current = table.table_number;
                      }}
                      onChange={(e) =>
                        setCustomerRefs((prev) => ({
                          ...prev,
                          [table.table_number]: e.target.value,
                        }))
                      }
                      onBlur={() => handleCustomerRefBlur(table.table_number)}
                      placeholder="اسم الزبون أو رقم طاولة الجلوس"
                      className="w-full min-w-0 flex-1 rounded-full bg-white/15 px-3.5 py-2 text-xs text-white placeholder:text-white/50 outline-none"
                    />
                    <button
                      type="button"
                      disabled={isBusy || !isActive}
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
                  <span dir="ltr" className="text-xs text-primary/50">
                    {ticket.games_count > 0 && `8 Pool: ${ticket.games_count}`}
                    {ticket.games_count > 0 && ticket.games_count_9ball > 0 && " · "}
                    {ticket.games_count_9ball > 0 && `9 Pool: ${ticket.games_count_9ball}`}
                  </span>
                  <span className="font-bold text-primary">
                    {Number(ticket.amount).toLocaleString("en-US")} د.ع
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-primary/10 bg-background p-5">
          <h3 className="mb-3 text-sm font-bold text-primary">إحصائيات الكيمات</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(
              [
                ["اليوم", stats.today],
                ["آخر 7 أيام", stats.week],
                ["هذا الشهر", stats.month],
              ] as const
            ).map(([label, counts]) => (
              <div key={label} className="rounded-xl bg-primary/5 px-3 py-2.5">
                <p className="mb-1 text-xs font-semibold text-primary/60">{label}</p>
                <p className="text-sm text-primary">
                  <span className="font-bold">{counts.eight}</span> كيم{" "}
                  <span dir="ltr">8 Pool</span>
                </p>
                <p className="text-sm text-primary">
                  <span className="font-bold">{counts.nine}</span> كيم{" "}
                  <span dir="ltr">9 Pool</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-primary/10 bg-background p-5">
          <h3 className="mb-4 text-sm font-bold text-primary">أداء الطاولات (هذا الشهر — عدد الكيمات)</h3>
          <div className="flex h-32 items-end justify-between gap-4">
            {stats.perTable.map((t) => (
              <div key={t.table_number} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-24 w-full items-end justify-center gap-1.5">
                  <div
                    className="w-6 rounded-t-md bg-black/70"
                    style={{ height: `${Math.max(4, (t.eight / maxTablePool) * 100)}%` }}
                  />
                  <div
                    className="w-6 rounded-t-md bg-yellow-400"
                    style={{ height: `${Math.max(4, (t.nine / maxTablePool) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] text-primary/50">طاولة {t.table_number}</span>
              </div>
            ))}
          </div>
          <div dir="ltr" className="mt-3 flex items-center justify-center gap-4 text-[11px] text-primary/50">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-black/70" /> 8 Pool
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" /> 9 Pool
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-primary/10 bg-background p-5">
          <h3 className="mb-3 text-sm font-bold text-primary">ملاحظات</h3>
          <div className="mb-3 flex items-center gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              placeholder="ملاحظة أو دين..."
              className="w-full min-w-0 flex-1 rounded-full border border-primary/15 bg-background px-3.5 py-2 text-xs text-primary outline-none"
            />
            <button
              type="button"
              disabled={noteBusy || !noteText.trim()}
              onClick={handleAddNote}
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-background disabled:opacity-40"
            >
              إضافة
            </button>
          </div>
          {notes.length === 0 ? (
            <p className="text-sm text-primary/50">لا توجد ملاحظات</p>
          ) : (
            <div className="flex flex-col gap-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-primary/5 px-3 py-2.5"
                >
                  <span className="min-w-0 flex-1 text-sm text-primary">{note.text}</span>
                  <button
                    type="button"
                    disabled={noteBusy}
                    onClick={() => handleDeleteNote(note.id)}
                    aria-label="حذف الملاحظة"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary/50 disabled:opacity-40"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/10 bg-background/95 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-xs text-primary/50">
              <span dir="ltr">8 Pool</span> اليوم
            </p>
            <p className="font-extrabold text-primary">{stats.today.eight}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-primary/50">
              <span dir="ltr">9 Pool</span> اليوم
            </p>
            <p className="font-extrabold text-primary">{stats.today.nine}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
