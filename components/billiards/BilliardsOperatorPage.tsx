"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Minus, Send, Trash2, Wallet, X, HandCoins } from "lucide-react";
import {
  computePoolAmount,
  type BilliardsTableRow,
  type BilliardsTicketRow,
  type BilliardsNoteRow,
  type BilliardsTransactionRow,
} from "@/lib/billiards";

const POLL_INTERVAL_MS = 1200;

type PoolType = "eight" | "nine";
type PoolCounts = { eight: number; nine: number };
type OperatorStats = {
  today: PoolCounts;
  week: PoolCounts;
  month: PoolCounts;
  perTable: { table_number: number; eight: number; nine: number }[];
  todayIncomeAmount: number;
};

const EMPTY_STATS: OperatorStats = {
  today: { eight: 0, nine: 0 },
  week: { eight: 0, nine: 0 },
  month: { eight: 0, nine: 0 },
  perTable: [1, 2, 3].map((n) => ({ table_number: n, eight: 0, nine: 0 })),
  todayIncomeAmount: 0,
};

type BilliardsOperatorPageProps = {
  logoutAction: () => Promise<void>;
  refreshSessionAction: () => Promise<void>;
  getTables: () => Promise<BilliardsTableRow[]>;
  setGameCount: (tableNumber: number, pool: PoolType, count: number) => Promise<{ error: string | null }>;
  updateCustomerRef: (tableNumber: number, customerRef: string) => Promise<{ error: string | null }>;
  endSession: (tableNumber: number, customerRef: string) => Promise<{ error: string | null }>;
  getPendingTickets: () => Promise<BilliardsTicketRow[]>;
  payTicket: (ticketId: string) => Promise<{ error: string | null }>;
  cancelTicket: (ticketId: string) => Promise<{ error: string | null }>;
  getCashierHandoverPending: () => Promise<BilliardsTransactionRow[]>;
  confirmCashierHandover: () => Promise<{ error: string | null }>;
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
  const [cashierHandoverPending, setCashierHandoverPending] = useState<BilliardsTransactionRow[]>([]);
  const [stats, setStats] = useState<OperatorStats>(EMPTY_STATS);
  const [notes, setNotes] = useState<BilliardsNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyTable, setBusyTable] = useState<number | null>(null);
  const [busyTicket, setBusyTicket] = useState<string | null>(null);
  const [busyCashierHandover, setBusyCashierHandover] = useState(false);
  const [customerRefs, setCustomerRefs] = useState<Record<number, string>>({});
  const [noteText, setNoteText] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);
  const focusedTableRef = useRef<number | null>(null);
  // مؤقتات تجميع الضغطات السريعة (debounce) لكل طاولة+قسم — مفتاحها "رقم الطاولة:القسم"
  const pendingSyncRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // طابور "نداء واحد بالتنفيذ + نداء واحد لاحق مضمون": يمنع تداخل طلبين لنفس الدالة (فلا
  // يصل رد بترتيب خاطئ فيمحو تحديثاً أحدث)، لكنه لا يُسقط أي نداء وصل أثناء التنفيذ —
  // بل يضمن نداءً جديداً فور انتهاء الحالي، فتبقى البيانات صحيحة دائماً مهما تأخر الخادم
  function makeCoalescedLoader<T>(fetcher: () => Promise<T>, apply: (result: T) => void) {
    let inFlight = false;
    let pendingAgain = false;
    return async () => {
      if (inFlight) {
        pendingAgain = true;
        return;
      }
      inFlight = true;
      try {
        do {
          pendingAgain = false;
          const result = await fetcher();
          apply(result);
        } while (pendingAgain);
      } finally {
        inFlight = false;
      }
    };
  }

  // البيانات الأساسية (الطاولات/الفواتير/تسليم الكاشير) — نُحدّثها فور أي إجراء من
  // الموظف بلا انتظار الإحصائيات الأثقل (getStats يمسح 35 يوماً من المعاملات)، حتى
  // يشعر بالاستجابة الفورية عند إنهاء الجلسة أو دفع/إلغاء فاتورة
  const loadCoreRef = useRef(
    makeCoalescedLoader(
      () =>
        Promise.all([props.getTables(), props.getPendingTickets(), props.getCashierHandoverPending()]),
      ([t, tickets, cashierPending]) => {
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
        setCashierHandoverPending(cashierPending);
        setLoading(false);
      }
    )
  );
  const loadCore = () => loadCoreRef.current();

  const loadNotesRef = useRef(makeCoalescedLoader(() => props.getNotes(), setNotes));
  const loadNotes = () => loadNotesRef.current();

  const loadStatsRef = useRef(makeCoalescedLoader(() => props.getStats(), setStats));
  const loadStats = () => loadStatsRef.current();

  const load = async () => {
    await Promise.all([loadCore(), loadStats(), loadNotes()]);
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
    pendingSyncRef.current[key] = setTimeout(async () => {
      // نُبقي المفتاح "معلّقاً" طوال مدة الطلب نفسه (وليس فقط قبل إرساله) — وإلا فقد
      // يصل استطلاع الخادم الدوري بينما الطلب لا يزال بالطريق ويُرجع القيمة القديمة
      // مؤقتاً قبل أن يستقر الرقم الصحيح، مما يبدو كتأخّر أو ارتداد بصري في العداد
      await props.setGameCount(tableNumber, pool, nextCount);
      delete pendingSyncRef.current[key];
    }, 900);
  };

  const handleCustomerRefBlur = async (tableNumber: number) => {
    focusedTableRef.current = null;
    await props.updateCustomerRef(tableNumber, customerRefs[tableNumber] ?? "");
  };

  // تحديث تفاؤلي فوري (نفس أسلوب عدّادات الكيمات): تُصفَّر الطاولة وتظهر الفاتورة
  // بقائمة "الفواتير المعلّقة" بالواجهة لحظة الضغط بدل انتظار رد الخادم بالكامل —
  // ثم loadCore بالخلفية يستبدل الفاتورة المؤقتة بالحقيقية (معرّف حقيقي) للتأكد والمزامنة
  const handleEndSession = async (tableNumber: number) => {
    const table = tables.find((t) => t.table_number === tableNumber);
    if (!table) return;
    setBusyTable(tableNumber);
    setTables((prev) =>
      prev.map((t) =>
        t.table_number === tableNumber
          ? { ...t, games_count: 0, games_count_9ball: 0, customer_ref: null }
          : t
      )
    );
    setPendingTickets((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        table_number: tableNumber,
        games_count: table.games_count,
        games_count_9ball: table.games_count_9ball,
        amount: computePoolAmount(table.games_count, table.games_count_9ball),
        customer_ref: customerRefs[tableNumber]?.trim() || null,
        created_at: new Date().toISOString(),
      },
    ]);
    await props.endSession(tableNumber, customerRefs[tableNumber] ?? "");
    await loadCore();
    setBusyTable(null);
  };

  const handlePayTicket = async (ticketId: string) => {
    setBusyTicket(ticketId);
    setPendingTickets((prev) => prev.filter((t) => t.id !== ticketId));
    await props.payTicket(ticketId);
    await loadCore();
    setBusyTicket(null);
  };

  const handleCancelTicket = async (ticketId: string) => {
    setBusyTicket(ticketId);
    setPendingTickets((prev) => prev.filter((t) => t.id !== ticketId));
    await props.cancelTicket(ticketId);
    await loadCore();
    setBusyTicket(null);
  };

  // حالة نادرة: زبون نزل مباشرة وحاسبه الكاشير — الموظف يستلم المبلغ منه فعلياً
  // (نقداً) ثم يؤكد ذلك بضغطة واحدة تُسوّي كل ما هو بحوزة الكاشير دفعة واحدة
  const handleConfirmCashierHandover = async () => {
    const total = cashierHandoverPending.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const confirmed = window.confirm(
      `تأكيد استلامك ${total.toLocaleString("en-US")} د.ع نقداً من الكاشير؟`
    );
    if (!confirmed) return;
    setBusyCashierHandover(true);
    await props.confirmCashierHandover();
    await loadCore();
    setBusyCashierHandover(false);
  };

  const handleAddNote = async () => {
    const text = noteText.trim();
    if (!text) return;
    setNoteBusy(true);
    setNoteText("");
    // تحديث تفاؤلي فوري بمعرّف مؤقت — يُستبدل بالسجل الحقيقي بعد loadNotes بالخلفية
    setNotes((prev) => [{ id: `temp-${Date.now()}`, text, created_at: new Date().toISOString() }, ...prev]);
    await props.addNote(text);
    await loadNotes();
    setNoteBusy(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    setNoteBusy(true);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    await props.deleteNote(noteId);
    await loadNotes();
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
                    <div dir="ltr" className="text-left">
                      <p className="text-xl font-extrabold text-white">{totalGames} G</p>
                      <p className="text-sm font-semibold text-white/70">
                        {amount.toLocaleString("en-US")}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 flex items-stretch gap-3">
                    <div className="flex flex-[11] flex-col items-center justify-center gap-2 rounded-2xl bg-black/60 px-3 py-3.5">
                      <span dir="ltr" className="text-sm font-bold text-white">8 Pool</span>
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

                    <div className="flex flex-[9] flex-col items-center justify-center gap-2 rounded-2xl bg-yellow-400/60 px-3 py-3">
                      <span dir="ltr" className="text-xs font-bold text-white">9 Pool</span>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          disabled={table.games_count_9ball === 0}
                          onClick={() => adjustGame(table.table_number, "nine", -1)}
                          aria-label="إنقاص كيم 9 Pool"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white disabled:opacity-40"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-5 text-center text-sm font-extrabold text-white">
                          {table.games_count_9ball}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustGame(table.table_number, "nine", 1)}
                          aria-label="زيادة كيم 9 Pool"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white"
                        >
                          <Plus size={14} />
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
              {pendingTickets.map((ticket) => {
                const isTicketBusy = busyTicket === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/5 pb-2.5 text-sm last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-primary">
                        {ticket.customer_ref || "بدون اسم"} — طاولة {ticket.table_number}
                        <span className="ms-1 font-normal text-primary/40">
                          ({new Date(ticket.created_at).toLocaleString("ar")})
                        </span>
                      </p>
                      <p className="text-primary/70">
                        <span dir="ltr" className="text-xs">
                          {ticket.games_count > 0 && `8 Pool: ${ticket.games_count}`}
                          {ticket.games_count > 0 && ticket.games_count_9ball > 0 && " · "}
                          {ticket.games_count_9ball > 0 && `9 Pool: ${ticket.games_count_9ball}`}
                        </span>{" "}
                        <span className="font-bold text-primary">
                          {Number(ticket.amount).toLocaleString("en-US")} د.ع
                        </span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isTicketBusy}
                        onClick={() => handleCancelTicket(ticket.id)}
                        aria-label="إلغاء التذكرة"
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 text-primary/50 disabled:opacity-40"
                      >
                        <X size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={isTicketBusy}
                        onClick={() => handlePayTicket(ticket.id)}
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
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
          <h3 className="mb-3 text-sm font-bold text-primary">الدخل   </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-primary/5 px-3 py-2.5">
              <p className="mb-1 text-xs font-semibold text-primary/60">دخلي اليوم</p>
              <p className="text-base font-extrabold text-primary">
                {stats.todayIncomeAmount.toLocaleString("en-US")} د.ع
              </p>
            </div>
            <div className="rounded-xl bg-primary/5 px-3 py-2.5">
              <p className="mb-1 text-xs font-semibold text-primary/60">عند الكاشير</p>
              <p className="text-base font-extrabold text-primary">
                {cashierHandoverPending
                  .reduce((sum, tx) => sum + Number(tx.amount), 0)
                  .toLocaleString("en-US")}{" "}
                د.ع
              </p>
            </div>
            <div className="rounded-xl bg-green-500/10 px-3 py-2.5">
              <p className="mb-1 text-xs font-semibold text-green-700">المجموع</p>
              <p className="text-base font-extrabold text-green-700">
                {(
                  stats.todayIncomeAmount +
                  cashierHandoverPending.reduce((sum, tx) => sum + Number(tx.amount), 0)
                ).toLocaleString("en-US")}{" "}
                د.ع
              </p>
            </div>
          </div>
        </div>

        {cashierHandoverPending.length > 0 && (
          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <h3 className="mb-3 text-sm font-bold text-primary">
              حصّلها الكاشير عن زبائن نزلوا مباشرة
            </h3>
            <div className="mb-4 flex flex-col gap-2">
              {cashierHandoverPending.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/5 pb-2 text-sm last:border-0"
                >
                  <span className="font-semibold text-primary">
                    طاولة {tx.table_number} {tx.customer_ref ? `— ${tx.customer_ref}` : ""}
                  </span>
                  <span className="text-primary/50">
                    {new Date(tx.paid_at).toLocaleString("ar")}
                  </span>
                  <span className="font-bold text-primary">
                    {Number(tx.amount).toLocaleString("en-US")} د.ع
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              disabled={busyCashierHandover}
              onClick={handleConfirmCashierHandover}
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-amber-500 py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              <HandCoins size={16} />
              استلمت{" "}
              {cashierHandoverPending
                .reduce((sum, tx) => sum + Number(tx.amount), 0)
                .toLocaleString("en-US")}{" "}
              د.ع من الكاشير
            </button>
          </div>
        )}

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
