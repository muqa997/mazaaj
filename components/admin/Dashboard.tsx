"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LogOut,
  ClipboardList,
  Users,
  Briefcase,
  LayoutGrid,
  MessageSquare,
  Ticket,
  Megaphone,
  Trash2,
  Pencil,
  Plus,
  X,
  Menu as MenuIcon,
  ChevronDown,
  Save,
  Image as ImageIcon,
  Upload,
  CircleDot,
  Phone,
  Trophy,
} from "lucide-react";
import {
  businessDayTimestamp,
  computePoolAmount,
  GAME_PRICE,
  GAME_PRICE_9BALL,
  getBusinessDayStart,
  getBusinessMonthStart,
} from "@/lib/billiards";
import {
  computePlaystationAmount,
  formatDuration,
  PS_DURATION_PRESETS,
  PS_MINUTES_PER_QUARTER,
} from "@/lib/playstation";
import { POSITION_KEYS, POSITION_LABELS_AR, type PositionKey } from "@/lib/job-openings";
import { DELIVERY_FEE } from "@/lib/config";
import { MENU_CATEGORIES, MENU_CATEGORY_LABELS_AR, type MenuCategory } from "@/lib/menu-data";
import { STATUS_META, STATUS_ORDER, toWhatsAppNumber, buildConfirmMessage } from "@/lib/order-helpers";
import { Shuffle } from "lucide-react";
import DrawBoard from "@/components/draw/DrawBoard";
import DrawChooser from "@/components/draw/DrawChooser";
import ManualDrawBoard from "@/components/draw/ManualDrawBoard";
import DrawGate from "@/components/draw/DrawGate";
import {
  findDuplicateTournaments,
  formatTournamentDate,
  listLiveTournaments,
  teamLabel,
} from "@/lib/tournaments";
import { useSyncSignal } from "@/lib/use-sync-signal";
import type {
  OrderRow,
  OrderStatus,
  ApplicantRow,
  JobOpeningRow,
  JobOpeningInput,
  SuggestionRow,
  CouponRow,
  CouponInput,
  AnnouncementRow,
  PromoKey,
  PromoRow,
  BilliardsTableRow,
  BilliardsTransactionRow,
  BilliardsNoteRow,
  BilliardsTicketRow,
  TournamentRow,
  TournamentTeamRow,
  TournamentInput,
  TeamInput,
} from "@/app/(admin)/panel/actions";

type Tab =
  | "overview"
  | "orders"
  | "coupons"
  | "announcements"
  | "promos"
  | "billiards"
  | "tournaments"
  | "draw"
  | "applicants"
  | "jobs"
  | "suggestions";

const TAB_VALUES: Tab[] = [
  "overview",
  "orders",
  "coupons",
  "announcements",
  "promos",
  "billiards",
  "tournaments",
  "draw",
  "applicants",
  "jobs",
  "suggestions",
];
const TAB_STORAGE_KEY = "mazaaj-admin-tab";

type DashboardProps = {
  logoutAction: () => Promise<void>;
  refreshSessionAction: () => Promise<void>;
  getOrders: () => Promise<OrderRow[]>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<{ error: string | null }>;
  deleteOrder: (id: string) => Promise<{ error: string | null }>;
  getCoupons: () => Promise<CouponRow[]>;
  createCoupon: (input: CouponInput) => Promise<{ error: string | null }>;
  updateCoupon: (id: string, input: CouponInput) => Promise<{ error: string | null }>;
  deleteCoupon: (id: string) => Promise<{ error: string | null }>;
  getApplicants: () => Promise<ApplicantRow[]>;
  getJobOpenings: () => Promise<JobOpeningRow[]>;
  createJobOpening: (input: JobOpeningInput) => Promise<{ error: string | null }>;
  updateJobOpening: (
    id: string,
    patch: Partial<JobOpeningInput & { is_active: boolean }>
  ) => Promise<{ error: string | null }>;
  deleteJobOpening: (id: string) => Promise<{ error: string | null }>;
  getSuggestions: () => Promise<SuggestionRow[]>;
  getAnnouncements: () => Promise<AnnouncementRow[]>;
  updateAnnouncement: (
    id: string,
    input: { text_ar: string; text_en: string }
  ) => Promise<{ error: string | null }>;
  getHomePromos: () => Promise<PromoRow[]>;
  updatePromoTarget: (
    key: PromoKey,
    target_category: MenuCategory | null
  ) => Promise<{ error: string | null }>;
  uploadPromoImage: (key: PromoKey, formData: FormData) => Promise<{ error: string | null }>;
  getBilliardsTables: () => Promise<BilliardsTableRow[]>;
  getBilliardsTransactions: () => Promise<BilliardsTransactionRow[]>;
  addManualBilliardsIncome: (input: {
    date: string;
    billiardsAmount: number;
    eight: number;
    nine: number;
    playstationAmount: number;
    minutes: number;
    note: string;
    settled: boolean;
  }) => Promise<{ error: string | null }>;
  deleteManualBilliardsIncome: (id: string) => Promise<{ error: string | null }>;
  settleBilliardsToday: () => Promise<{ error: string | null }>;
  settleBilliardsOverdue: () => Promise<{ error: string | null }>;
  getBilliardsNotes: () => Promise<BilliardsNoteRow[]>;
  getCancelledBilliardsTickets: () => Promise<BilliardsTicketRow[]>;
  verifyDrawCode: (code: string) => Promise<{ ok: boolean }>;
  getTournaments: () => Promise<TournamentRow[]>;
  createTournament: (input: TournamentInput) => Promise<{ error: string | null }>;
  updateTournament: (id: string, input: TournamentInput) => Promise<{ error: string | null }>;
  deleteTournament: (id: string) => Promise<{ error: string | null }>;
  getTournamentTeams: () => Promise<TournamentTeamRow[]>;
  updateTournamentTeam: (id: string, input: TeamInput) => Promise<{ error: string | null }>;
  deleteTournamentTeam: (id: string) => Promise<{ error: string | null }>;
};

const PROMO_LABELS: Record<PromoKey, { title: string; cta: string }> = {
  trending: { title: "الرائج الآن", cta: "اطلب الآن" },
  offer: { title: "العروض", cta: "اطلب العرض" },
};

// حقل datetime-local يتعامل بالتوقيت المحلي بصيغة "YYYY-MM-DDTHH:mm" بلا منطقة زمنية،
// فنحوّل بينه وبين ISO المخزَّن بقاعدة البيانات (المدير وجهازه على توقيت بغداد)
const toDateTimeLocal = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EMPTY_TOURNAMENT_FORM: TournamentInput = {
  title: "بطولة ورق ٧١ خبيثة",
  category: "71 خبيثة",
  starts_at: "",
  registration_closes_at: "",
  entry_fee: 10000,
  max_teams: null,
  is_active: true,
};

const SUGGESTION_TYPE_LABELS: Record<string, string> = {
  bug: "الإبلاغ عن خطأ",
  uiImprovement: "تحسين واجهة",
  newFeature: "إضافة قسم",
  poorService: "سوء خدمة",
  inquiry: "استفسار",
  compliment: "إشادة",
  other: "أخرى",
  qrFeedback: "ملاحظة من صفحة QR (بعد تقييم سلبي)",
};

const EMPTY_JOB_FORM: JobOpeningInput = {
  position_key: "",
  title_ar: "",
  title_en: "",
  description_ar: "",
  description_en: "",
};

const EMPTY_COUPON_FORM: CouponInput = {
  code: "",
  discount_type: "percentage",
  discount_value: 0,
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function netRevenue(orders: OrderRow[]) {
  return orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + (Number(o.total) - DELIVERY_FEE), 0);
}

function computeStats(orders: OrderRow[]) {
  const now = new Date();

  const newOrders = orders.filter((o) => o.status === "new").length;

  const todayOrdersList = orders.filter((o) => isSameDay(new Date(o.created_at), now));
  const todayOrders = todayOrdersList.length;

  const monthOrders = orders.filter((o) => {
    const d = new Date(o.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const last7DaysStart = new Date(now);
  last7DaysStart.setDate(last7DaysStart.getDate() - 6);
  last7DaysStart.setHours(0, 0, 0, 0);
  const last7DaysOrders = orders.filter((o) => new Date(o.created_at) >= last7DaysStart);

  const itemCounts = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items ?? []) {
      itemCounts.set(item.name, (itemCounts.get(item.name) ?? 0) + item.qty);
    }
  }
  const topItems = Array.from(itemCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, qty]) => ({ name, qty }));

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(now);
    day.setDate(day.getDate() - (6 - i));
    const count = orders.filter((o) => isSameDay(new Date(o.created_at), day)).length;
    return { label: day.toLocaleDateString("ar", { weekday: "short" }), count };
  });

  const daysElapsedInMonth = now.getDate();
  const monthDays = Array.from({ length: daysElapsedInMonth }).map((_, i) => {
    const day = i + 1;
    const count = orders.filter((o) => {
      const d = new Date(o.created_at);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === day
      );
    }).length;
    return { label: String(day), count };
  });

  return {
    newOrders,
    todayOrders,
    monthOrdersCount: monthOrders.length,
    totalOrders: orders.length,
    topItems,
    last7Days,
    monthDays,
    todayNetRevenue: netRevenue(todayOrdersList),
    weekNetRevenue: netRevenue(last7DaysOrders),
    monthNetRevenue: netRevenue(monthOrders),
  };
}

const ARABIC_ORDINAL_MONTHS = [
  "الأول",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
  "السادس",
  "السابع",
  "الثامن",
  "التاسع",
  "العاشر",
  "الحادي عشر",
  "الثاني عشر",
];

const formatDayMonth = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;

/** «٥ × 1,000 + ٥ × 500 = 7,500 د.ع» تحت العدّادات، مع زر اعتماده مبلغاً */
function IncomeCalcRow({
  text,
  amount,
  current,
  onAdopt,
}: {
  text: string;
  amount: number;
  current: string;
  onAdopt: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-accent/10 px-3 py-2">
      <span dir="ltr" className="text-[11px] text-primary/60">
        {text}
      </span>
      <span className="text-sm font-extrabold text-primary">
        = {amount.toLocaleString("en-US")} د.ع
      </span>
      {/* يظهر فقط حين يكتب المدير مبلغاً مخالفاً للاحتساب: ساعتها رقمه هو المعتمد،
          والزر يرجّعه للمحسوب إن أرادها */}
      {String(amount) !== current && (
        <button
          type="button"
          onClick={onAdopt}
          className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-background"
        >
          اعتمده مبلغاً
        </button>
      )}
    </div>
  );
}

function computeBilliardsStats(transactions: BilliardsTransactionRow[]) {
  const now = new Date();
  // اليوم التجاري يبدأ الساعة ٦ صباحاً (وليس منتصف الليل) — الكافيه يعمل أحياناً حتى
  // الساعة ٣ فجراً، فتُحسب تلك الساعات ضمن يوم العمل السابق بدل أن تُفتح كـ"يوم جديد"
  const todayStart = getBusinessDayStart(now);
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
  const monthStart = getBusinessMonthStart(now);
  // الشهر التجاري السابق بالكامل: من أوله إلى أول الشهر الحالي
  const lastMonthStart = getBusinessMonthStart(new Date(monthStart.getTime() - 1));
  // نقطة داخل اليوم التجاري الحالي (وليس "الآن" الفعلي) — لعرض تسمية التاريخ الصحيحة
  // حتى لو كانت الساعة الفعلية بعد منتصف الليل وقبل السادسة صباحاً
  const businessNow = new Date(todayStart.getTime() + 12 * 60 * 60 * 1000);

  const sumBy = (rows: BilliardsTransactionRow[], key: "games_count" | "amount") =>
    rows.reduce((sum, t) => sum + Number(t[key]), 0);

  const sumPool = (rows: BilliardsTransactionRow[]) => ({
    eight: rows.reduce((sum, t) => sum + Number(t.games_count), 0),
    nine: rows.reduce((sum, t) => sum + Number(t.games_count_9ball), 0),
  });

  const todayTx = transactions.filter((t) => new Date(t.paid_at) >= todayStart);
  const yesterdayTx = transactions.filter((t) => {
    const d = new Date(t.paid_at);
    return d >= yesterdayStart && d < todayStart;
  });
  const weekTx = transactions.filter((t) => new Date(t.paid_at) >= weekStart);
  const monthTx = transactions.filter((t) => new Date(t.paid_at) >= monthStart);
  const lastMonthTx = transactions.filter((t) => {
    const d = new Date(t.paid_at);
    return d >= lastMonthStart && d < monthStart;
  });

  const isPool = (t: BilliardsTransactionRow) => (t.kind ?? "billiards") === "billiards";
  const isPs = (t: BilliardsTransactionRow) => (t.kind ?? "billiards") === "playstation";

  // أداء الطاولات لهذا الشهر فقط (وليس إجمالي منذ البداية)، مقسّم ٨ بول/٩ بول.
  // تذاكر البلي تحمل رقم الجهاز في table_number ورقم الجهاز الأول ١، فبلا تمييز
  // النوع يُضاف دخل البلي كله إلى طاولة البلياردو الأولى
  const perTable = [1, 2, 3].map((n) => {
    const tableTx = monthTx.filter((t) => isPool(t) && t.table_number === n);
    return {
      table_number: n,
      pool: sumPool(tableTx),
      amount: sumBy(tableTx, "amount"),
    };
  });

  const psSummary = (rows: BilliardsTransactionRow[]) => {
    const psTx = rows.filter(isPs);
    return {
      amount: sumBy(psTx, "amount"),
      minutes: psTx.reduce((sum, t) => sum + Number(t.minutes ?? 0), 0),
      count: psTx.length,
    };
  };

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const dayStart = new Date(todayStart.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const amount = sumBy(
      transactions.filter((t) => {
        const d = new Date(t.paid_at);
        return d >= dayStart && d < dayEnd;
      }),
      "amount"
    );
    const labelDate = new Date(dayStart.getTime() + 12 * 60 * 60 * 1000);
    return { label: labelDate.toLocaleDateString("ar", { weekday: "short" }), amount };
  });

  const daysElapsedInMonth =
    Math.round((todayStart.getTime() - monthStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const monthDays = Array.from({ length: daysElapsedInMonth }).map((_, i) => {
    const dayStart = new Date(monthStart.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const amount = sumBy(
      monthTx.filter((t) => {
        const d = new Date(t.paid_at);
        return d >= dayStart && d < dayEnd;
      }),
      "amount"
    );
    return { label: String(i + 1), amount };
  });

  // الشهر السابق كامل الأيام (لا حتى اليوم الحالي): عدد أيامه = الفرق بين بدايته
  // وبداية الشهر الحالي، فيصح لشهور ٢٨ و٢٩ و٣٠ و٣١ يوماً بلا حالات خاصة
  const lastMonthDayCount = Math.round(
    (monthStart.getTime() - lastMonthStart.getTime()) / (24 * 60 * 60 * 1000)
  );
  const lastMonthDays = Array.from({ length: lastMonthDayCount }).map((_, i) => {
    const dayStart = new Date(lastMonthStart.getTime() + i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dayTx = lastMonthTx.filter((t) => {
      const d = new Date(t.paid_at);
      return d >= dayStart && d < dayEnd;
    });
    return {
      label: String(i + 1),
      amount: sumBy(dayTx, "amount"),
      count: dayTx.length,
    };
  });

  const lastMonthPerTable = [1, 2, 3].map((n) => {
    const tableTx = lastMonthTx.filter(
      (t) => (t.kind ?? "billiards") === "billiards" && t.table_number === n
    );
    return { table_number: n, pool: sumPool(tableTx), amount: sumBy(tableTx, "amount") };
  });

  const lastMonthLabelDate = new Date(lastMonthStart.getTime() + 12 * 60 * 60 * 1000);
  const activeDays = lastMonthDays.filter((d) => d.amount > 0);
  const bestDay = lastMonthDays.reduce(
    (best, d) => (d.amount > best.amount ? d : best),
    lastMonthDays[0] ?? { label: "-", amount: 0, count: 0 }
  );

  // "بحوزة الكاشير" غير المسوّى — مقسّم عمداً إلى اليوم الحالي والمتأخر من أيام سابقة،
  // بدل رقم واحد مجمّع، حتى لا يختلط دخل الأمس (لو نسي المدير تسويته) مع دخل اليوم
  const outstandingTodayTx = transactions.filter(
    (t) => !t.settled_at && new Date(t.paid_at) >= todayStart
  );
  const outstandingOverdueTx = transactions.filter(
    (t) => !t.settled_at && new Date(t.paid_at) < todayStart
  );

  return {
    todayPool: sumPool(todayTx),
    todayAmount: sumBy(todayTx, "amount"),
    yesterdayPool: sumPool(yesterdayTx),
    yesterdayAmount: sumBy(yesterdayTx, "amount"),
    weekAmount: sumBy(weekTx, "amount"),
    monthPool: sumPool(monthTx),
    monthAmount: sumBy(monthTx, "amount"),
    todayLabel: formatDayMonth(businessNow),
    yesterdayLabel: formatDayMonth(new Date(yesterdayStart.getTime() + 12 * 60 * 60 * 1000)),
    monthLabel: `الشهر ${ARABIC_ORDINAL_MONTHS[businessNow.getMonth()]}`,
    perTable,
    monthPs: psSummary(monthTx),
    lastMonthPs: psSummary(lastMonthTx),
    weekDays,
    monthDays,
    lastMonthAmount: sumBy(lastMonthTx, "amount"),
    lastMonthPool: sumPool(lastMonthTx),
    lastMonthDays,
    lastMonthPerTable,
    lastMonthLabel: `الشهر ${ARABIC_ORDINAL_MONTHS[lastMonthLabelDate.getMonth()]}`,
    lastMonthActiveDays: activeDays.length,
    lastMonthBestDay: bestDay,
    lastMonthAvgPerActiveDay: activeDays.length
      ? Math.round(sumBy(lastMonthTx, "amount") / activeDays.length)
      : 0,
    outstandingTodayAmount: sumBy(outstandingTodayTx, "amount"),
    outstandingTodayCount: outstandingTodayTx.length,
    outstandingOverdueAmount: sumBy(outstandingOverdueTx, "amount"),
    outstandingOverdueCount: outstandingOverdueTx.length,
  };
}

// نقطة خضراء نابضة تدل أن الطاولة نشطة حالياً (فيها كيمات لم تُدفع بعد) — أعلى يسار البطاقة
function BilliardsActiveDot() {
  return (
    <span className="absolute end-2.5 top-2.5 flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
    </span>
  );
}

export default function Dashboard(props: DashboardProps) {
  const router = useRouter();
  // يبقى المدير على نفس التبويب بعد تحديث الصفحة (F5) — يُقرأ من localStorage عند
  // فتح الصفحة، ويُحفظ في كل مرة يتغيّر التبويب
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "overview";
    const stored = window.localStorage.getItem(TAB_STORAGE_KEY);
    return TAB_VALUES.includes(stored as Tab) ? (stored as Tab) : "overview";
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [jobs, setJobs] = useState<JobOpeningRow[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [billiardsTables, setBilliardsTables] = useState<BilliardsTableRow[]>([]);
  const [billiardsTransactions, setBilliardsTransactions] = useState<BilliardsTransactionRow[]>([]);
  const [billiardsNotes, setBilliardsNotes] = useState<BilliardsNoteRow[]>([]);
  const [billiardsCancelledTickets, setBilliardsCancelledTickets] = useState<BilliardsTicketRow[]>([]);
  const [showFullBilliardsLog, setShowFullBilliardsLog] = useState(false);
  const [billiardsLogDisplayCount, setBilliardsLogDisplayCount] = useState(10);
  const [settlingBilliardsToday, setSettlingBilliardsToday] = useState(false);
  const [settlingBilliardsOverdue, setSettlingBilliardsOverdue] = useState(false);
  const [loading, setLoading] = useState(true);

  const [announcementDrafts, setAnnouncementDrafts] = useState<
    Record<string, { text_ar: string; text_en: string }>
  >({});
  const [announcementSavingId, setAnnouncementSavingId] = useState<string | null>(null);

  const [promoCategoryDrafts, setPromoCategoryDrafts] = useState<
    Record<PromoKey, MenuCategory | "">
  >({ trending: "", offer: "" });
  const [promoSavingKey, setPromoSavingKey] = useState<PromoKey | null>(null);
  const [promoUploadingKey, setPromoUploadingKey] = useState<PromoKey | null>(null);
  const [promoError, setPromoError] = useState<Record<PromoKey, string>>({
    trending: "",
    offer: "",
  });

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [jobForm, setJobForm] = useState<JobOpeningInput | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobFormError, setJobFormError] = useState("");

  const [couponForm, setCouponForm] = useState<CouponInput | null>(null);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [couponFormError, setCouponFormError] = useState("");

  const [tournaments, setTournaments] = useState<TournamentRow[]>([]);
  const [tournamentTeams, setTournamentTeams] = useState<TournamentTeamRow[]>([]);
  const [tournamentForm, setTournamentForm] = useState<TournamentInput | null>(null);
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(null);
  const [tournamentFormError, setTournamentFormError] = useState("");
  const [expandedTournamentId, setExpandedTournamentId] = useState<string | null>(null);
  const [tournamentSaved, setTournamentSaved] = useState<string | null>(null);
  // تُفتح شاشة القرعة بعد الرمز فقط، وتُقفل عند مغادرة التبويب فيُطلب الرمز ثانيةً
  const [drawUnlocked, setDrawUnlocked] = useState(false);
  // بعد الرمز تُعرض بطاقتا الاختيار، ثم تُفتح الشاشة المطلوبة
  const [drawMode, setDrawMode] = useState<"wheel" | "manual" | null>(null);
  // نموذج تسجيل دخل يوم فات تسجيله — المدير وحده
  const [incomeOpen, setIncomeOpen] = useState(false);
// آخر مبلغ كتبه الحساب التلقائي لكل لعبة. نقارن به الخانة لنعرف إن كان المدير قد
  // كتب رقماً بيده: ساعتها نتوقف عن الكتابة فوقه مهما عدّل العدّادات
  const [incomeAuto, setIncomeAuto] = useState<{
    billiards: number | null;
    playstation: number | null;
  }>({ billiards: null, playstation: null });
  // اللعبتان بنموذج واحد: ٢٢ ألفاً بلياردو و٨ آلاف بلي تُسجَّلان معاً ليوم واحد
  const [incomeForm, setIncomeForm] = useState({
    date: "",
    billiards: "",
    eight: "",
    nine: "",
    playstation: "",
    minutes: "",
    note: "",
    settled: true,
  });
  const [incomeBusy, setIncomeBusy] = useState(false);
  const [incomeMsg, setIncomeMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // نفس الدالة التي يستخدمها الموقع حرفياً، فما يُعلَّم هنا "معروضة بالموقع" هو ما
  // يراه الزائر فعلاً — لا تخمين. الموقع يعرضها كلها، كل بطولة ببطاقتها
  const liveIds = useMemo(
    () => new Set(listLiveTournaments(tournaments).map((t) => t.id)),
    [tournaments]
  );
  // التحذير للنسخ المكرّرة فقط (نفس العنوان ونفس الموعد)، لا لتعدد البطولات — تعدّدها
  // مقصود. المكرّرة تقسم المشتركين بين بطولتين متطابقتين بلا أن ينتبه أحد
  const duplicateIds = useMemo(
    () => new Set(findDuplicateTournaments(tournaments).map((t) => t.id)),
    [tournaments]
  );
  const [teamForm, setTeamForm] = useState<TeamInput | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamFormError, setTeamFormError] = useState("");

  // showSpinner=false للتحديثات اللحظية: بدونها تومض اللوحة كاملةً عند كل إشارة
  const loadAll = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const [o, c, a, j, s, an, pr, bt, btx, bn, bct, tr, trt] = await Promise.all([
        props.getOrders(),
        props.getCoupons(),
        props.getApplicants(),
        props.getJobOpenings(),
        props.getSuggestions(),
        props.getAnnouncements(),
        props.getHomePromos(),
        props.getBilliardsTables(),
        props.getBilliardsTransactions(),
        props.getBilliardsNotes(),
        props.getCancelledBilliardsTickets(),
        props.getTournaments(),
        props.getTournamentTeams(),
      ]);
      setOrders(o ?? []);
      setCoupons(c ?? []);
      setApplicants(a ?? []);
      setJobs(j ?? []);
      setSuggestions(s ?? []);
      setAnnouncements(an ?? []);
      setAnnouncementDrafts(
        Object.fromEntries(
          (an ?? []).map((item) => [item.id, { text_ar: item.text_ar, text_en: item.text_en }])
        )
      );
      setPromos(pr ?? []);
      setPromoCategoryDrafts({
        trending: pr?.find((p) => p.key === "trending")?.target_category ?? "",
        offer: pr?.find((p) => p.key === "offer")?.target_category ?? "",
      });
      setBilliardsTables(bt ?? []);
      setBilliardsTransactions(btx ?? []);
      setBilliardsNotes(bn ?? []);
      setBilliardsCancelledTickets(bct ?? []);
      setTournaments(tr ?? []);
      setTournamentTeams(trt ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    loadAll(true);
    props.refreshSessionAction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // تحديث لحظي لكل بيانات البلياردو فور أي تغيير من أي جهاز (الكاشير، صفحة
  // البلياردو، أو مدير آخر): الطاولات والحركات والملاحظات والفواتير الملغاة معاً —
  // بدون هذا كانت الأرقام في اللوحة تتأخر أو تتناقض مع ما يراه الكاشير
  const refreshBilliards = useCallback(async () => {
    try {
      const [bt, btx, bn, bct] = await Promise.all([
        props.getBilliardsTables(),
        props.getBilliardsTransactions(),
        props.getBilliardsNotes(),
        props.getCancelledBilliardsTickets(),
      ]);
      setBilliardsTables(bt ?? []);
      setBilliardsTransactions(btx ?? []);
      setBilliardsNotes(bn ?? []);
      setBilliardsCancelledTickets(bct ?? []);
    } catch (err) {
      console.error(err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      const o = await props.getOrders();
      setOrders(o ?? []);
    } catch (err) {
      console.error(err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useSyncSignal("billiards", refreshBilliards);
  useSyncSignal("orders", refreshOrders);


  useEffect(() => {
    window.localStorage.setItem(TAB_STORAGE_KEY, tab);
  }, [tab]);

  // إعادة الصفحة الأولى من السجل عند تبديل نطاق التاريخ (٧ أيام ↔ الأقدم)
  useEffect(() => {
    setBilliardsLogDisplayCount(10);
  }, [showFullBilliardsLog]);

  const handleLogout = async () => {
    await props.logoutAction();
    router.refresh();
  };

  // الكيمات تسعّر خانة البلياردو والمدد تسعّر خانة البلي، كلٌّ منفصلة عن الأخرى.
  // عمداً خارج دالة التحديث لا داخلها: setState داخل updater غير نقيّ ويُنفَّذ مرتين
  // بطور التطوير
  const updatePoolCounts = (patch: { eight?: string; nine?: string }) => {
    const next = { ...incomeForm, ...patch };
    const auto = computePoolAmount(Number(next.eight) || 0, Number(next.nine) || 0);
    const typedByHand =
      incomeForm.billiards !== "" && incomeForm.billiards !== String(incomeAuto.billiards ?? "");
    if (typedByHand) {
      setIncomeForm(next);
      return;
    }
    setIncomeForm({ ...next, billiards: auto > 0 ? String(auto) : "" });
    setIncomeAuto((a) => ({ ...a, billiards: auto > 0 ? auto : null }));
  };

  const updatePsMinutes = (value: string) => {
    const next = { ...incomeForm, minutes: value };
    const auto = computePlaystationAmount(Number(value) || 0);
    const typedByHand =
      incomeForm.playstation !== "" &&
      incomeForm.playstation !== String(incomeAuto.playstation ?? "");
    if (typedByHand) {
      setIncomeForm(next);
      return;
    }
    setIncomeForm({ ...next, playstation: auto > 0 ? String(auto) : "" });
    setIncomeAuto((a) => ({ ...a, playstation: auto > 0 ? auto : null }));
  };

  // المدير يؤكد استلامه دخل اليوم نقداً من الكاشير — منفصلة عمداً عن تسوية المتأخر
  // (بطاقة/زر مستقلان) حتى لا يختلط دخل الأمس المنسي بدخل اليوم في رقم واحد مربك
  const submitManualIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (incomeBusy) return;
    setIncomeBusy(true);
    setIncomeMsg(null);

    const result = await props.addManualBilliardsIncome({
      date: incomeForm.date,
      billiardsAmount: Number(incomeForm.billiards) || 0,
      eight: Number(incomeForm.eight) || 0,
      nine: Number(incomeForm.nine) || 0,
      playstationAmount: Number(incomeForm.playstation) || 0,
      minutes: Number(incomeForm.minutes) || 0,
      note: incomeForm.note,
      settled: incomeForm.settled,
    });

    if (result.error) {
      setIncomeMsg({ ok: false, text: result.error });
    } else {
      setIncomeMsg({
        ok: true,
        text: "تم التسجيل — يظهر الآن عند موظف البلياردو والكاشير ولوحة المدير",
      });
      setIncomeForm({
        date: "",
        billiards: "",
        eight: "",
        nine: "",
        playstation: "",
        minutes: "",
        note: "",
        settled: true,
      });
      setIncomeAuto({ billiards: null, playstation: null });
      setIncomeOpen(false);
      await refreshBilliards();
    }
    setIncomeBusy(false);
  };

  const removeManualIncome = async (id: string) => {
    if (!confirm("حذف هذا الإدخال اليدوي؟")) return;
    const result = await props.deleteManualBilliardsIncome(id);
    if (result.error) setIncomeMsg({ ok: false, text: result.error });
    else await refreshBilliards();
  };

  const handleSettleToday = async () => {
    const confirmed = window.confirm(
      `تأكيد استلامك ${billiardsStats.outstandingTodayAmount.toLocaleString("en-US")} د.ع نقداً من الكاشير (دخل اليوم)؟`
    );
    if (!confirmed) return;
    setSettlingBilliardsToday(true);
    await props.settleBilliardsToday();
    await loadAll();
    setSettlingBilliardsToday(false);
  };

  // في حال نسي المدير الضغط على تسوية اليوم في وقتها — يبقى ظاهراً كبطاقة منفصلة
  // إلى أن يُسوّى، بمعزل عن دخل اليوم الحالي
  const handleSettleOverdue = async () => {
    const confirmed = window.confirm(
      `تأكيد استلامك ${billiardsStats.outstandingOverdueAmount.toLocaleString("en-US")} د.ع نقداً من الكاشير (متأخر من أيام سابقة)؟`
    );
    if (!confirmed) return;
    setSettlingBilliardsOverdue(true);
    await props.settleBilliardsOverdue();
    await loadAll();
    setSettlingBilliardsOverdue(false);
  };

  const stats = useMemo(() => computeStats(orders), [orders]);
  const billiardsStats = useMemo(
    () => computeBilliardsStats(billiardsTransactions),
    [billiardsTransactions]
  );
  // المسجَّل أصلاً لليوم المختار بنموذج "دخل يوم سابق". الإدخال يُضاف ولا يستبدل،
  // فبدون هذا الرقم يسهل تسجيل مبلغ اليوم كاملاً مرة ثانية بدل الفرق الناقص وحده
  const incomeDaySummary = useMemo(() => {
    const at = businessDayTimestamp(incomeForm.date);
    if (!at) return null;
    const dayStart = getBusinessDayStart(at);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    // السجل المُحمَّل يبدأ من أول الشهر التجاري السابق؛ ما قبله لم يُجلب أصلاً
    // فلا ندّعي أنه صفر
    const loadedSince = getBusinessMonthStart(
      new Date(getBusinessMonthStart(new Date()).getTime() - 1)
    );
    if (dayStart < loadedSince) return { known: false as const };
    const dayTx = billiardsTransactions.filter((t) => {
      const d = new Date(t.paid_at);
      return d >= dayStart && d < dayEnd;
    });
    return {
      known: true as const,
      amount: dayTx.reduce((sum, t) => sum + Number(t.amount), 0),
      count: dayTx.length,
    };
  }, [incomeForm.date, billiardsTransactions]);

  // ناتج العدّادات معروضاً: المدير يرى المبلغ وهو يكتب العدد، ويرى تفصيله فيتأكد
  // أن الرقم جاء من ٨ بول و٩ بول لا من ضربة واحدة
  const incomeCalc = useMemo(() => {
    const eight = Math.max(0, Math.floor(Number(incomeForm.eight) || 0));
    const nine = Math.max(0, Math.floor(Number(incomeForm.nine) || 0));
    const minutes = Math.max(0, Math.floor(Number(incomeForm.minutes) || 0));
    const poolParts: string[] = [];
    if (eight > 0) poolParts.push(`${eight} × ${GAME_PRICE.toLocaleString("en-US")}`);
    if (nine > 0) poolParts.push(`${nine} × ${GAME_PRICE_9BALL.toLocaleString("en-US")}`);
    return {
      pool: poolParts.length
        ? { amount: computePoolAmount(eight, nine), text: poolParts.join(" + ") }
        : null,
      ps:
        minutes > 0
          ? {
              amount: computePlaystationAmount(minutes),
              text: `${formatDuration(minutes)} · ${Math.ceil(
                minutes / PS_MINUTES_PER_QUARTER
              )} × ربع ساعة`,
            }
          : null,
    };
  }, [incomeForm.eight, incomeForm.nine, incomeForm.minutes]);

  // ما سيُسجَّل لذلك اليوم: اللعبتان مجموعتين — ٢٢ ألفاً + ٨ آلاف = ٣٠ ألفاً
  const incomeTotal =
    Math.max(0, Math.round(Number(incomeForm.billiards) || 0)) +
    Math.max(0, Math.round(Number(incomeForm.playstation) || 0));

  const maxWeekChartCount = Math.max(1, ...stats.last7Days.map((d) => d.count));
  const maxMonthChartCount = Math.max(1, ...stats.monthDays.map((d) => d.count));
  const maxBilliardsWeekAmount = Math.max(1, ...billiardsStats.weekDays.map((d) => d.amount));
  const maxBilliardsMonthAmount = Math.max(1, ...billiardsStats.monthDays.map((d) => d.amount));
  const maxBilliardsTableAmount = Math.max(1, ...billiardsStats.perTable.map((t) => t.amount));
  const maxBilliardsLastMonthAmount = Math.max(
    1,
    ...billiardsStats.lastMonthDays.map((d) => d.amount)
  );

  // سجل العمليات: آخر 7 أيام افتراضياً (تخفيفاً للصفحة)، مع رابط لعرض كل ما جُلب
  // (من أول الشهر التجاري السابق)
  const visibleBilliardsTransactions = useMemo(() => {
    if (showFullBilliardsLog) return billiardsTransactions;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return billiardsTransactions.filter((t) => new Date(t.paid_at) >= sevenDaysAgo);
  }, [billiardsTransactions, showFullBilliardsLog]);

  // السجل قد يطول ويملأ الصفحة — نعرض 10 عمليات فقط في البداية، مع زر "عرض المزيد"
  // يكشف 10 إضافية في كل ضغطة بدل عرضها كلها دفعة واحدة
  const displayedBilliardsTransactions = useMemo(
    () => visibleBilliardsTransactions.slice(0, billiardsLogDisplayCount),
    [visibleBilliardsTransactions, billiardsLogDisplayCount]
  );

  // نُلوّن كل يوم عمل بخلفية تختلف عن اليوم الذي يليه (تناوب فاتح/غامق شبيه بتلوين
  // صفوف إكسل بالتناوب)، حتى تتميّز عمليات كل يوم عن اليوم السابق والتالي له بنظرة
  // واحدة. السجل مرتّب تنازلياً (الأحدث أولاً) فتكون معاملات نفس اليوم متتالية دائماً
  const billiardsLogRows = useMemo(() => {
    let lastDayKey: number | null = null;
    let shaded = false;
    return displayedBilliardsTransactions.map((t) => {
      const dayKey = getBusinessDayStart(new Date(t.paid_at)).getTime();
      if (dayKey !== lastDayKey) {
        shaded = !shaded;
        lastDayKey = dayKey;
      }
      return { t, shaded };
    });
  }, [displayedBilliardsTransactions]);

  const changeOrderStatus = async (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    await props.updateOrderStatus(id, status);
  };

  const removeOrder = async (id: string) => {
    await props.deleteOrder(id);
    loadAll();
  };

  const startCreateJob = () => {
    setEditingJobId(null);
    setJobForm(EMPTY_JOB_FORM);
    setJobFormError("");
  };

  const startEditJob = (job: JobOpeningRow) => {
    setEditingJobId(job.id);
    setJobForm({
      position_key: job.position_key,
      title_ar: job.title_ar,
      title_en: job.title_en,
      description_ar: job.description_ar,
      description_en: job.description_en,
    });
    setJobFormError("");
  };

  const closeJobForm = () => {
    setJobForm(null);
    setEditingJobId(null);
    setJobFormError("");
  };

  const submitJobForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm) return;

    const result = editingJobId
      ? await props.updateJobOpening(editingJobId, jobForm)
      : await props.createJobOpening(jobForm);

    if (result.error) {
      setJobFormError(result.error);
      return;
    }

    closeJobForm();
    loadAll();
  };

  const toggleJobActive = async (job: JobOpeningRow) => {
    await props.updateJobOpening(job.id, { is_active: !job.is_active });
    loadAll();
  };

  const removeJob = async (id: string) => {
    await props.deleteJobOpening(id);
    loadAll();
  };

  const startCreateCoupon = () => {
    setEditingCouponId(null);
    setCouponForm(EMPTY_COUPON_FORM);
    setCouponFormError("");
  };

  const startEditCoupon = (coupon: CouponRow) => {
    setEditingCouponId(coupon.id);
    setCouponForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
    });
    setCouponFormError("");
  };

  const closeCouponForm = () => {
    setCouponForm(null);
    setEditingCouponId(null);
    setCouponFormError("");
  };

  const submitCouponForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm) return;

    const result = editingCouponId
      ? await props.updateCoupon(editingCouponId, couponForm)
      : await props.createCoupon(couponForm);

    if (result.error) {
      setCouponFormError(result.error);
      return;
    }

    closeCouponForm();
    loadAll();
  };

  const saveAnnouncement = async (id: string) => {
    const draft = announcementDrafts[id];
    if (!draft) return;
    setAnnouncementSavingId(id);
    await props.updateAnnouncement(id, draft);
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...draft } : a))
    );
    setAnnouncementSavingId(null);
  };

  const removeCoupon = async (id: string) => {
    await props.deleteCoupon(id);
    loadAll();
  };

  const startCreateTournament = () => {
    setEditingTournamentId(null);
    setTournamentForm(EMPTY_TOURNAMENT_FORM);
    setTournamentFormError("");
  };

  const startEditTournament = (tournament: TournamentRow) => {
    setEditingTournamentId(tournament.id);
    setTournamentForm({
      title: tournament.title,
      category: tournament.category,
      starts_at: toDateTimeLocal(tournament.starts_at),
      registration_closes_at: toDateTimeLocal(tournament.registration_closes_at),
      entry_fee: tournament.entry_fee,
      max_teams: tournament.max_teams,
      is_active: tournament.is_active,
    });
    setTournamentFormError("");
  };

  const closeTournamentForm = () => {
    setTournamentForm(null);
    setEditingTournamentId(null);
    setTournamentFormError("");
  };

  const submitTournamentForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournamentForm) return;

    if (!tournamentForm.starts_at || !tournamentForm.registration_closes_at) {
      setTournamentFormError("الرجاء تحديد موعد البطولة وموعد انتهاء التسجيل");
      return;
    }
    const startsAt = new Date(tournamentForm.starts_at);
    const closesAt = new Date(tournamentForm.registration_closes_at);
    if (closesAt > startsAt) {
      // نعرض الوقتين بالرسالة: الخطأ الغالب هنا هو ص/م بحقل التاريخ (٧:٣٠ ص بدل ٧:٣٠ م)،
      // وجملة «يجب أن يكون قبل» وحدها لا تكشفه لأن التاريخ نفسه يبدو صحيحاً
      const time = (d: Date) =>
        d.toLocaleTimeString("ar-IQ-u-nu-latn", { hour: "numeric", minute: "2-digit" });
      setTournamentFormError(
        `انتهاء التسجيل (${time(closesAt)}) بعد موعد البطولة (${time(startsAt)}) — تأكد من ص/م`
      );
      return;
    }

    // الحقلان قادمان من datetime-local بالتوقيت المحلي — نحوّلهما لـ ISO قبل الحفظ
    const payload: TournamentInput = {
      ...tournamentForm,
      starts_at: startsAt.toISOString(),
      registration_closes_at: closesAt.toISOString(),
    };

    const result = editingTournamentId
      ? await props.updateTournament(editingTournamentId, payload)
      : await props.createTournament(payload);

    if (result.error) {
      setTournamentFormError(result.error);
      setTournamentSaved(null);
      return;
    }

    closeTournamentForm();
    setTournamentSaved(
      editingTournamentId
        ? "تم حفظ التعديل — صفحة البطولة والصفحة الرئيسية محدّثتان الآن"
        : "تمت إضافة البطولة — صفحة البطولة والصفحة الرئيسية محدّثتان الآن"
    );
    loadAll();
  };

  const removeTournament = async (tournament: TournamentRow) => {
    const teamCount = tournamentTeams.filter((t) => t.tournament_id === tournament.id).length;
    const confirmed = window.confirm(
      teamCount > 0
        ? `حذف «${tournament.title}» سيحذف معها ${teamCount} فريق مسجَّل. متأكد؟`
        : `حذف «${tournament.title}»؟`
    );
    if (!confirmed) return;
    await props.deleteTournament(tournament.id);
    setTournamentSaved("تم حذف البطولة — صفحة البطولة والصفحة الرئيسية محدّثتان الآن");
    loadAll();
  };

  const startEditTeam = (team: TournamentTeamRow) => {
    setEditingTeamId(team.id);
    setTeamForm({
      player1_name: team.player1_name,
      player2_name: team.player2_name,
      phone: team.phone,
    });
    setTeamFormError("");
  };

  const closeTeamForm = () => {
    setTeamForm(null);
    setEditingTeamId(null);
    setTeamFormError("");
  };

  const submitTeamForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm || !editingTeamId) return;

    const result = await props.updateTournamentTeam(editingTeamId, teamForm);
    if (result.error) {
      setTeamFormError(result.error);
      return;
    }

    closeTeamForm();
    loadAll();
  };

  const removeTeam = async (team: TournamentTeamRow) => {
    const confirmed = window.confirm(`حذف فريق «${teamLabel(team)}» من البطولة؟`);
    if (!confirmed) return;
    await props.deleteTournamentTeam(team.id);
    loadAll();
  };

  const savePromoTarget = async (key: PromoKey) => {
    setPromoSavingKey(key);
    setPromoError((prev) => ({ ...prev, [key]: "" }));
    const target = promoCategoryDrafts[key] || null;
    const result = await props.updatePromoTarget(key, target);
    if (result.error) {
      setPromoError((prev) => ({ ...prev, [key]: result.error! }));
    } else {
      setPromos((prev) =>
        prev.map((p) => (p.key === key ? { ...p, target_category: target } : p))
      );
    }
    setPromoSavingKey(null);
  };

  const uploadPromoImage = async (key: PromoKey, file: File) => {
    setPromoUploadingKey(key);
    setPromoError((prev) => ({ ...prev, [key]: "" }));
    const formData = new FormData();
    formData.set("image", file);
    const result = await props.uploadPromoImage(key, formData);
    if (result.error) {
      setPromoError((prev) => ({ ...prev, [key]: result.error! }));
    } else {
      loadAll();
    }
    setPromoUploadingKey(null);
  };

  const tabs: { key: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { key: "overview", label: "الرئيسية", icon: LayoutGrid },
    { key: "orders", label: "الطلبات", icon: ClipboardList },
    { key: "billiards", label: "الألعاب", icon: CircleDot },
    { key: "tournaments", label: "البطولات", icon: Trophy },
    { key: "draw", label: "شاشة القرعة", icon: Shuffle },
    { key: "applicants", label: "المتقدمون", icon: Users },
    { key: "coupons", label: "الكوبونات", icon: Ticket },
    { key: "announcements", label: "الإعلانات", icon: Megaphone },
    { key: "promos", label: "الرائج والعروض", icon: ImageIcon },
    { key: "jobs", label: "الوظائف", icon: Briefcase },
    { key: "suggestions", label: "الاقتراحات", icon: MessageSquare },
  ];

  const selectTab = (key: Tab) => {
    if (key !== "draw") {
      setDrawUnlocked(false);
      setDrawMode(null);
    }
    setTab(key);
    setDrawerOpen(false);
  };

  if (tab === "draw" && drawUnlocked && drawMode === "wheel") {
    return (
      <DrawBoard
        tournaments={tournaments}
        tournamentTeams={tournamentTeams}
        onExit={() => setDrawMode(null)}
      />
    );
  }

  if (tab === "draw" && drawUnlocked && drawMode === "manual") {
    return <ManualDrawBoard onExit={() => setDrawMode(null)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* الهيدر: الهمبركر يميناً، عنوان اللوحة بالوسط (يفتح الرئيسية)، اللوجو يساراً (يفتح الموقع) */}
      <header className="sticky top-0 z-40 grid grid-cols-3 items-center border-b border-primary/10 bg-background px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="القائمة"
          className="flex h-10 w-10 items-center justify-center justify-self-start rounded-full bg-primary/5"
        >
          <MenuIcon size={20} className="text-primary" />
        </button>

        <button
          type="button"
          onClick={() => selectTab("overview")}
          className="justify-self-center text-sm font-extrabold text-primary"
        >
          لوحة تحكم مزاج
        </button>

        <a href="/" className="justify-self-end">
          <img src="/mazaaj-logo-trimmed.png" alt="mazaaj" className="h-9 w-9 object-contain" />
        </a>
      </header>

      {/* الدرج الجانبي (يمين الشاشة) — يعرض أسماء الأقسام فقط؛ محتوى كل قسم يظهر
          بالصفحة الرئيسية بعد اختياره وإغلاق الدرج تلقائياً */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-primary/30 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[80vw] flex-col bg-background shadow-glass-lg"
            >
              <div className="flex items-center justify-between border-b border-primary/10 px-5 py-4">
                <span className="font-bold text-primary">الأقسام</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="إغلاق"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/5"
                >
                  <X size={16} className="text-primary/70" />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                {tabs.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectTab(key)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                      tab === key
                        ? "bg-primary text-background"
                        : "text-primary/70 hover:bg-primary/5"
                    }`}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </nav>

              <div className="border-t border-primary/10 p-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  تسجيل الخروج
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {loading ? (
          <p className="text-center text-primary/50">جاري التحميل...</p>
        ) : (
          <>
            {tab === "overview" && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard label="طلبات جديدة (بانتظار التأكيد)" value={stats.newOrders} />
                  <StatCard label="طلبات اليوم" value={stats.todayOrders} />
                  <StatCard label="طلبات الشهر" value={stats.monthOrdersCount} />
                  <StatCard label="إجمالي الطلبات" value={stats.totalOrders} />
                </div>

                <div className="rounded-2xl border border-primary/10 bg-background p-5">
                  <h3 className="mb-4 text-sm font-bold text-primary">
                    الأكثر طلباً (أعلى 10 أصناف)
                  </h3>
                  {stats.topItems.length === 0 ? (
                    <p className="text-sm text-primary/50">لا توجد بيانات كافية بعد</p>
                  ) : (
                    <ol className="flex flex-col gap-2">
                      {stats.topItems.map((item, i) => (
                        <li
                          key={item.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-primary/70">
                            {i + 1}. {item.name}
                          </span>
                          <span className="font-bold text-primary">{item.qty}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                <div className="rounded-2xl border border-primary/10 bg-background p-5">
                  <h3 className="mb-4 text-sm font-bold text-primary">
                    أداء آخر 7 أيام (عدد الطلبات)
                  </h3>
                  <div className="flex items-end justify-between gap-2 h-32">
                    {stats.last7Days.map((day, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-24 w-full items-end">
                          <div
                            className="w-full rounded-md bg-accent/60"
                            style={{
                              height: `${Math.max(6, (day.count / maxWeekChartCount) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-primary/50">{day.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/10 bg-background p-5">
                  <h3 className="mb-4 text-sm font-bold text-primary">
                    أداء الشهر (عدد الطلبات يومياً)
                  </h3>
                  <div className="flex items-end justify-between gap-1 h-32 overflow-x-auto">
                    {stats.monthDays.map((day, i) => (
                      <div key={i} className="flex min-w-[10px] flex-1 flex-col items-center gap-1">
                        <div className="flex h-24 w-full items-end">
                          <div
                            className="w-full rounded-sm bg-accent/60"
                            style={{
                              height: `${Math.max(6, (day.count / maxMonthChartCount) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-primary/40">{day.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="عدد المتقدمين" value={applicants.length} />
                  <StatCard label="عدد الاقتراحات" value={suggestions.length} />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <StatCard
                    label="صافي مبيعات اليوم (المسلّمة)"
                    value={`${stats.todayNetRevenue.toLocaleString("en-US")} د.ع`}
                  />
                  <StatCard
                    label="صافي مبيعات الأسبوع (المسلّمة)"
                    value={`${stats.weekNetRevenue.toLocaleString("en-US")} د.ع`}
                  />
                  <StatCard
                    label="صافي مبيعات الشهر (المسلّمة)"
                    value={`${stats.monthNetRevenue.toLocaleString("en-US")} د.ع`}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <StatCard
                    label="دخل البليارد والبلي اليوم"
                    value={`${billiardsStats.todayAmount.toLocaleString("en-US")} د.ع`}
                  />
                  <StatCard
                    label="دخل البليارد والبلي الأسبوع"
                    value={`${billiardsStats.weekAmount.toLocaleString("en-US")} د.ع`}
                  />
                  <StatCard
                    label="دخل البليارد والبلي الشهر"
                    value={`${billiardsStats.monthAmount.toLocaleString("en-US")} د.ع`}
                  />
                </div>

                <div
                  className={`flex items-center justify-between rounded-2xl border p-4 ${
                    billiardsStats.outstandingTodayAmount > 0
                      ? "border-amber-500/30 bg-amber-500/10"
                      : "border-primary/10 bg-background"
                  }`}
                >
                  <div>
                    <p className="mb-1 text-xs text-primary/50">بحوزة الكاشير الآن</p>
                    <p className="text-lg font-extrabold text-primary sm:text-xl">
                      {billiardsStats.outstandingTodayAmount.toLocaleString("en-US")} د.ع
                    </p>
                  </div>
                  {billiardsStats.outstandingTodayCount > 0 && (
                    <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-700">
                      {billiardsStats.outstandingTodayCount} معاملة
                    </span>
                  )}
                </div>

                {billiardsStats.outstandingOverdueAmount > 0 && (
                  <div className="flex items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                    <div>
                      <p className="mb-1 text-xs text-red-700">بحوزة الكاشير من الأمس (متأخر)</p>
                      <p className="text-lg font-extrabold text-red-700 sm:text-xl">
                        {billiardsStats.outstandingOverdueAmount.toLocaleString("en-US")} د.ع
                      </p>
                    </div>
                    <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-700">
                      {billiardsStats.outstandingOverdueCount} معاملة
                    </span>
                  </div>
                )}
              </div>
            )}

            {tab === "orders" && (
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
                          <p className="truncate font-bold text-primary">
                            {order.customer_name}
                          </p>
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
                              <li
                                key={i}
                                className="flex justify-between text-sm text-primary/70"
                              >
                                <span>
                                  {item.name} × {item.qty}
                                </span>
                                <span>{(item.price * item.qty).toLocaleString("en-US")} د.ع</span>
                              </li>
                            ))}
                          </ul>
                          {order.notes && (
                            <p className="mb-3 text-sm text-primary/50">
                              ملاحظات: {order.notes}
                            </p>
                          )}
                          <p className="mb-3 font-bold text-primary">
                            الإجمالي: {Number(order.total).toLocaleString("en-US")} د.ع
                          </p>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-primary/10 pt-3">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            changeOrderStatus(order.id, e.target.value as OrderStatus)
                          }
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
                          {Number(order.total).toLocaleString("en-US")} د.ع
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "coupons" && (
              <div>
                {!couponForm && (
                  <button
                    type="button"
                    onClick={startCreateCoupon}
                    className="mb-5 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background"
                  >
                    <Plus size={16} />
                    إضافة كوبون
                  </button>
                )}

                {couponForm && (
                  <form
                    onSubmit={submitCouponForm}
                    className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/10 bg-background p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-primary">
                        {editingCouponId ? "تعديل كوبون" : "كوبون جديد"}
                      </h3>
                      <button type="button" onClick={closeCouponForm}>
                        <X size={18} className="text-primary/50" />
                      </button>
                    </div>

                    <input
                      required
                      placeholder="رمز الكوبون"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                      className="rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCouponForm({ ...couponForm, discount_type: "percentage" })
                        }
                        className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                          couponForm.discount_type === "percentage"
                            ? "bg-primary text-background"
                            : "bg-primary/5 text-primary/60"
                        }`}
                      >
                        نسبة مئوية %
                      </button>
                      <button
                        type="button"
                        onClick={() => setCouponForm({ ...couponForm, discount_type: "fixed" })}
                        className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                          couponForm.discount_type === "fixed"
                            ? "bg-primary text-background"
                            : "bg-primary/5 text-primary/60"
                        }`}
                      >
                        مبلغ ثابت (د.ع)
                      </button>
                    </div>

                    <input
                      required
                      type="number"
                      min={0}
                      max={couponForm.discount_type === "percentage" ? 100 : undefined}
                      placeholder={
                        couponForm.discount_type === "percentage"
                          ? "نسبة الخصم (%)"
                          : "مبلغ الخصم (د.ع)"
                      }
                      value={couponForm.discount_value || ""}
                      onChange={(e) =>
                        setCouponForm({
                          ...couponForm,
                          discount_value: Number(e.target.value),
                        })
                      }
                      className="rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                    />

                    {couponFormError && (
                      <p className="text-sm text-red-500">{couponFormError}</p>
                    )}

                    <button
                      type="submit"
                      className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background"
                    >
                      {editingCouponId ? "حفظ التعديلات" : "إضافة الكوبون"}
                    </button>
                  </form>
                )}

                <div className="flex flex-col gap-3">
                  {coupons.length === 0 && (
                    <p className="py-10 text-center text-primary/50">لا توجد كوبونات مضافة</p>
                  )}
                  {coupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-primary/10 bg-background p-4"
                    >
                      <div>
                        <p className="font-bold text-primary">{coupon.code}</p>
                        <p className="text-sm text-accent">
                          {coupon.discount_type === "percentage"
                            ? `خصم ${coupon.discount_value}%`
                            : `خصم ${coupon.discount_value.toLocaleString("en-US")} د.ع`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEditCoupon(coupon)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5"
                        >
                          <Pencil size={14} className="text-primary/60" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCoupon(coupon.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5"
                        >
                          <Trash2 size={14} className="text-red-500/70" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "announcements" && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-primary/50">
                  هذه الرسائل الثلاث تظهر بشريط متحرك أعلى الموقع، عدّلها بالعربي والإنجليزي
                  متى تريد.
                </p>
                {announcements.map((announcement, i) => {
                  const draft = announcementDrafts[announcement.id] ?? {
                    text_ar: announcement.text_ar,
                    text_en: announcement.text_en,
                  };
                  return (
                    <div
                      key={announcement.id}
                      className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-background p-4"
                    >
                      <h3 className="text-sm font-bold text-primary">
                        الرسالة {i + 1}
                      </h3>
                      <textarea
                        rows={2}
                        value={draft.text_ar}
                        onChange={(e) =>
                          setAnnouncementDrafts({
                            ...announcementDrafts,
                            [announcement.id]: { ...draft, text_ar: e.target.value },
                          })
                        }
                        placeholder="النص بالعربي"
                        className="resize-none rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                      />
                      <textarea
                        rows={2}
                        dir="ltr"
                        value={draft.text_en}
                        onChange={(e) =>
                          setAnnouncementDrafts({
                            ...announcementDrafts,
                            [announcement.id]: { ...draft, text_en: e.target.value },
                          })
                        }
                        placeholder="Text in English"
                        className="resize-none rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                      />
                      <button
                        type="button"
                        onClick={() => saveAnnouncement(announcement.id)}
                        disabled={announcementSavingId === announcement.id}
                        className="flex items-center justify-center gap-2 self-start rounded-full bg-primary px-5 py-2 text-xs font-semibold text-background disabled:opacity-50"
                      >
                        <Save size={14} />
                        {announcementSavingId === announcement.id ? "جاري الحفظ..." : "حفظ"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "promos" && (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-primary/50">
                  هذان القسمان يظهران بالصفحة الرئيسية بالموقع. إذا لم تُرفع صورة لقسم
                  معين فلن يظهر ذلك القسم للزوار إطلاقاً. زر الطلب يفتح صفحة الطلب مباشرة
                  على القسم الذي تحدده هنا.
                </p>
                {(["trending", "offer"] as PromoKey[]).map((key) => {
                  const promo = promos.find((p) => p.key === key);
                  return (
                    <div
                      key={key}
                      className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-background p-4"
                    >
                      <h3 className="text-sm font-bold text-primary">
                        {PROMO_LABELS[key].title}
                      </h3>

                      <div className="flex items-center gap-4">
                        <div className="aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl bg-primary/5">
                          {promo?.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={promo.image_url}
                              alt={PROMO_LABELS[key].title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <ImageIcon size={20} className="text-primary/30" />
                            </div>
                          )}
                        </div>

                        <label className="flex cursor-pointer items-center gap-2 rounded-full bg-primary/5 px-4 py-2.5 text-xs font-semibold text-primary">
                          <Upload size={14} />
                          {promoUploadingKey === key ? "جاري الرفع..." : "رفع صورة جديدة"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={promoUploadingKey === key}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              if (file) uploadPromoImage(key, file);
                            }}
                          />
                        </label>
                      </div>

                      <label className="text-xs font-semibold text-primary/60">
                        القسم الذي يفتحه زر &quot;{PROMO_LABELS[key].cta}&quot;
                      </label>
                      <select
                        value={promoCategoryDrafts[key]}
                        onChange={(e) =>
                          setPromoCategoryDrafts((prev) => ({
                            ...prev,
                            [key]: e.target.value as MenuCategory | "",
                          }))
                        }
                        className="rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                      >
                        <option value="">بدون تحديد (يفتح صفحة الطلب من البداية)</option>
                        {MENU_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {MENU_CATEGORY_LABELS_AR[category]}
                          </option>
                        ))}
                      </select>

                      {promoError[key] && (
                        <p className="text-xs text-red-500">{promoError[key]}</p>
                      )}

                      <button
                        type="button"
                        onClick={() => savePromoTarget(key)}
                        disabled={promoSavingKey === key}
                        className="flex items-center justify-center gap-2 self-start rounded-full bg-primary px-5 py-2 text-xs font-semibold text-background disabled:opacity-50"
                      >
                        <Save size={14} />
                        {promoSavingKey === key ? "جاري الحفظ..." : "حفظ"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "billiards" && (
              <div className="flex flex-col gap-6">
                {/* تسجيل دخل يوم فات — المدير وحده. يُكتب بتاريخ ذلك اليوم فيدخل
                    تلقائياً في حسابات الجميع */}
                <div className="rounded-2xl border border-primary/10 bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-primary">دخل يوم سابق</p>
                      <p className="mt-0.5 text-xs text-primary/50">
                        فات تسجيله لحظتها؟ سجّله هنا بتاريخه — أو أضف الفرق لو
                        كان المسجَّل ناقصاً
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIncomeOpen((v) => !v);
                        setIncomeMsg(null);
                      }}
                      className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-bold text-background"
                    >
                      {incomeOpen ? "إغلاق" : "تسجيل"}
                    </button>
                  </div>

                  {incomeMsg && (
                    <p
                      className={`mt-3 rounded-xl px-3 py-2 text-xs font-bold ${
                        incomeMsg.ok
                          ? "bg-green-50 text-green-800"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {incomeMsg.text}
                    </p>
                  )}

                  {incomeOpen && (
                    <form onSubmit={submitManualIncome} className="mt-4 flex flex-col gap-3">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-primary/50">اليوم</span>
                        <input
                          required
                          type="date"
                          value={incomeForm.date}
                          max={new Date().toISOString().slice(0, 10)}
                          onChange={(e) =>
                            setIncomeForm({ ...incomeForm, date: e.target.value })
                          }
                          className="min-h-[48px] rounded-xl border border-primary/15 bg-background px-3 text-base text-primary outline-none focus:border-accent"
                        />
                        {incomeDaySummary &&
                          (incomeDaySummary.known ? (
                            <span className="text-[11px] leading-5 text-primary/50">
                              المسجَّل حالياً لهذا اليوم:{" "}
                              <b className="text-primary">
                                {incomeDaySummary.amount.toLocaleString("en-US")} د.ع
                              </b>{" "}
                              · ما تكتبه يُضاف إليه ولا يستبدله
                              {incomeTotal > 0 && (
                                <>
                                  {" "}
                                  — سيصبح{" "}
                                  <b className="text-accent">
                                    {(incomeDaySummary.amount + incomeTotal).toLocaleString(
                                      "en-US"
                                    )}{" "}
                                    د.ع
                                  </b>
                                </>
                              )}
                            </span>
                          ) : (
                            <span className="text-[11px] leading-5 text-primary/50">
                              يوم أقدم من السجل المُحمَّل — لا يمكن عرض المسجَّل له
                            </span>
                          ))}
                      </label>

                      {/* البلياردو والبلي ستيشن بنموذج واحد: ما يُكتب بالخانتين
                          يُسجَّل سطرين بنفس التاريخ، فمجموع اليوم يجمعهما */}
                      <div className="flex flex-col gap-2 rounded-2xl border border-primary/10 p-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-extrabold text-primary">البلياردو</span>
                          <span className="text-[10px] text-primary/35">اتركه فارغاً إن لم يكن فيه دخل</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={incomeForm.billiards}
                          onChange={(e) =>
                            setIncomeForm({ ...incomeForm, billiards: e.target.value })
                          }
                          placeholder="22000"
                          className="min-h-[48px] rounded-xl border border-primary/15 bg-background px-3 text-base font-bold text-primary outline-none focus:border-accent"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <label className="flex flex-col gap-1">
                            <span className="text-[11px] text-primary/50">كيمات ٨ بول</span>
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={incomeForm.eight}
                              onChange={(e) => updatePoolCounts({ eight: e.target.value })}
                              placeholder="0"
                              className="min-h-[44px] rounded-xl border border-primary/15 bg-background px-3 text-base text-primary outline-none focus:border-accent"
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-[11px] text-primary/50">كيمات ٩ بول</span>
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={incomeForm.nine}
                              onChange={(e) => updatePoolCounts({ nine: e.target.value })}
                              placeholder="0"
                              className="min-h-[44px] rounded-xl border border-primary/15 bg-background px-3 text-base text-primary outline-none focus:border-accent"
                            />
                          </label>
                        </div>
                        {incomeCalc.pool && (
                          <IncomeCalcRow
                            text={incomeCalc.pool.text}
                            amount={incomeCalc.pool.amount}
                            current={incomeForm.billiards}
                            onAdopt={() => {
                              setIncomeForm({
                                ...incomeForm,
                                billiards: String(incomeCalc.pool!.amount),
                              });
                              setIncomeAuto((a) => ({ ...a, billiards: incomeCalc.pool!.amount }));
                            }}
                          />
                        )}
                      </div>

                      <div className="flex flex-col gap-2 rounded-2xl border border-primary/10 p-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-xs font-extrabold text-primary">البلي ستيشن</span>
                          <span className="text-[10px] text-primary/35">اتركه فارغاً إن لم يكن فيه دخل</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={incomeForm.playstation}
                          onChange={(e) =>
                            setIncomeForm({ ...incomeForm, playstation: e.target.value })
                          }
                          placeholder="8000"
                          className="min-h-[48px] rounded-xl border border-primary/15 bg-background px-3 text-base font-bold text-primary outline-none focus:border-accent"
                        />
                        <span className="text-[11px] text-primary/50">
                          مدة اللعب — اضغط لتجمع مدد اليوم
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {PS_DURATION_PRESETS.map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() =>
                                updatePsMinutes(String((Number(incomeForm.minutes) || 0) + m))
                              }
                              className="min-h-[42px] rounded-xl bg-primary/5 px-1 text-xs font-bold text-primary/70"
                            >
                              + {formatDuration(m)}
                            </button>
                          ))}
                        </div>
                        {Number(incomeForm.minutes) > 0 && (
                          <div className="flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2">
                            <span className="text-xs font-bold text-primary">
                              المجموع: {formatDuration(Number(incomeForm.minutes))}
                            </span>
                            <button
                              type="button"
                              onClick={() => updatePsMinutes("")}
                              className="text-[11px] font-bold text-red-500/80"
                            >
                              تصفير
                            </button>
                          </div>
                        )}
                        {incomeCalc.ps && (
                          <IncomeCalcRow
                            text={incomeCalc.ps.text}
                            amount={incomeCalc.ps.amount}
                            current={incomeForm.playstation}
                            onAdopt={() => {
                              setIncomeForm({
                                ...incomeForm,
                                playstation: String(incomeCalc.ps!.amount),
                              });
                              setIncomeAuto((a) => ({ ...a, playstation: incomeCalc.ps!.amount }));
                            }}
                          />
                        )}
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-primary/5 px-3 py-3">
                        <span className="text-xs font-bold text-primary/60">مجموع دخل اليوم</span>
                        <span className="text-lg font-extrabold text-primary">
                          {incomeTotal.toLocaleString("en-US")} د.ع
                        </span>
                      </div>

                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-bold text-primary/50">ملاحظة</span>
                        <input
                          value={incomeForm.note}
                          maxLength={120}
                          onChange={(e) =>
                            setIncomeForm({ ...incomeForm, note: e.target.value })
                          }
                          placeholder="سبب الإدخال اليدوي"
                          className="min-h-[48px] rounded-xl border border-primary/15 bg-background px-3 text-base text-primary outline-none focus:border-accent"
                        />
                      </label>

                      <label className="flex items-center gap-2.5 py-1">
                        <input
                          type="checkbox"
                          checked={incomeForm.settled}
                          onChange={(e) =>
                            setIncomeForm({ ...incomeForm, settled: e.target.checked })
                          }
                          className="h-5 w-5 accent-current text-primary"
                        />
                        <span className="text-xs font-bold text-primary/70">
                          المبلغ بيدي فعلاً (وإلا ظهر للكاشير كمتأخر غير مُسلَّم)
                        </span>
                      </label>

                      {/* لا حقل إجباري بعينه: المطلوب دخل إحدى اللعبتين على الأقل */}
                      <button
                        type="submit"
                        disabled={incomeBusy || incomeTotal <= 0}
                        className="min-h-[52px] rounded-xl bg-primary text-sm font-extrabold text-background disabled:opacity-40"
                      >
                        {incomeBusy
                          ? "جارِ التسجيل..."
                          : incomeTotal > 0
                            ? `تسجيل ${incomeTotal.toLocaleString("en-US")} د.ع`
                            : "تسجيل الدخل"}
                      </button>
                    </form>
                  )}
                </div>
                <div
                  className={`rounded-2xl border p-4 ${
                    billiardsStats.outstandingTodayAmount > 0
                      ? "border-amber-500/30 bg-amber-500/10"
                      : "border-primary/10 bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="mb-1 text-xs text-primary/50">بحوزة الكاشير الآن</p>
                      <p className="text-lg font-extrabold text-primary sm:text-xl">
                        {billiardsStats.outstandingTodayAmount.toLocaleString("en-US")} د.ع
                      </p>
                    </div>
                    {billiardsStats.outstandingTodayCount > 0 && (
                      <span className="shrink-0 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-700">
                        {billiardsStats.outstandingTodayCount} معاملة
                      </span>
                    )}
                  </div>
                  {billiardsStats.outstandingTodayAmount > 0 && (
                    <button
                      type="button"
                      disabled={settlingBilliardsToday}
                      onClick={handleSettleToday}
                      className="mt-3 w-full rounded-full bg-amber-500 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                    >
                      استلمت من الكاشير
                    </button>
                  )}
                </div>

                {billiardsStats.outstandingOverdueAmount > 0 && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="mb-1 text-xs text-red-700">بحوزة الكاشير من الأمس (متأخر)</p>
                        <p className="text-lg font-extrabold text-red-700 sm:text-xl">
                          {billiardsStats.outstandingOverdueAmount.toLocaleString("en-US")} د.ع
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-700">
                        {billiardsStats.outstandingOverdueCount} معاملة
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={settlingBilliardsOverdue}
                      onClick={handleSettleOverdue}
                      className="mt-3 w-full rounded-full bg-red-500 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                    >
                      استلمت من الكاشير (متأخر)
                    </button>
                  </div>
                )}

                <div>
                  <h3 className="mb-3 text-sm font-bold text-primary">
                    الحالة الحالية (غير مدفوعة بعد)
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {billiardsTables.map((table) => {
                      const isTableActive = table.games_count > 0 || table.games_count_9ball > 0;
                      return (
                      <div
                        key={table.id}
                        className={`relative rounded-2xl p-4 ${
                          isTableActive
                            ? "border-2 border-green-500/50 bg-green-500/5"
                            : "border border-primary/10 bg-background"
                        }`}
                      >
                        {isTableActive && <BilliardsActiveDot />}
                        <p className="mb-1 text-xs text-primary/50">
                          طاولة {table.table_number}
                        </p>
                        {table.customer_ref && (
                          <p className="mb-1 truncate text-xs font-semibold text-accent">
                            {table.customer_ref}
                          </p>
                        )}
                        <p className="text-lg font-extrabold text-primary">
                          {computePoolAmount(table.games_count, table.games_count_9ball).toLocaleString("en-US")}{" "}
                          د.ع
                        </p>
                        <p dir="ltr" className="text-xs text-primary/60">
                          8 Pool: {table.games_count} · 9 Pool: {table.games_count_9ball}
                        </p>
                      </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-bold text-primary">الدخل المُحصَّل</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {(
                      [
                        ["اليوم", billiardsStats.todayLabel, billiardsStats.todayAmount, billiardsStats.todayPool],
                        ["الأمس", billiardsStats.yesterdayLabel, billiardsStats.yesterdayAmount, billiardsStats.yesterdayPool],
                        ["هذا الشهر", billiardsStats.monthLabel, billiardsStats.monthAmount, billiardsStats.monthPool],
                      ] as const
                    ).map(([label, dateLabel, amount, pool]) => (
                      <div key={label} className="rounded-2xl bg-primary p-4">
                        <p className="mb-1 text-xs text-background/60">
                          {label} <span dir="ltr">({dateLabel})</span>
                        </p>
                        <p className="text-lg font-extrabold text-background sm:text-xl">
                          {amount.toLocaleString("en-US")} د.ع{" "}
                          <span dir="ltr" className="text-sm font-normal text-background/60">
                            (8 Pool {pool.eight} + 9 Pool {pool.nine})
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/10 bg-background p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-primary">
                      سجل العمليات والتسديدات {!showFullBilliardsLog && "(آخر 7 أيام)"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowFullBilliardsLog((v) => !v)}
                      className="text-xs font-semibold text-accent underline"
                    >
                      {showFullBilliardsLog ? "عرض آخر 7 أيام فقط" : "عرض السجل الأقدم"}
                    </button>
                  </div>
                  {visibleBilliardsTransactions.length === 0 ? (
                    <p className="text-sm text-primary/50">لا توجد عمليات بهذه الفترة</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {billiardsLogRows.map(({ t, shaded }) => (
                        <div
                          key={t.id}
                          className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border-b border-primary/5 px-2 py-2 text-sm last:border-0 ${
                            shaded ? "bg-primary/5" : "bg-transparent"
                          }`}
                        >
                          <span className="text-primary/50">
                            {t.session_ended_at && (
                              <>
                                إنهاء الجلسة: {new Date(t.session_ended_at).toLocaleString("ar")}
                                <br />
                              </>
                            )}
                            وقت الاستلام: {new Date(t.paid_at).toLocaleString("ar")}
                            <br />
                            {t.settled_at ? (
                              <>تمت التسوية مع المدير: {new Date(t.settled_at).toLocaleString("ar")}</>
                            ) : (
                              <span className="font-semibold text-amber-700">لم تُسوَّ مع المدير بعد</span>
                            )}
                          </span>
                          <span className="text-primary/70">
                            {t.collected_by === "manual"
                              ? t.entry_note || "إدخال يدوي"
                              : t.kind === "playstation"
                                ? `جهاز ${t.table_number}`
                                : `طاولة ${t.table_number}`}
                          </span>
                          <span dir="ltr" className="text-primary/70">
                            {t.games_count > 0 && `8 Pool ${t.games_count}`}
                            {t.games_count > 0 && t.games_count_9ball > 0 && " + "}
                            {t.games_count_9ball > 0 && `9 Pool ${t.games_count_9ball}`}
                          </span>
                          {t.customer_ref && (
                            <span className="text-primary/50">{t.customer_ref}</span>
                          )}
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              t.collected_by === "cashier"
                                ? "bg-blue-100 text-blue-700"
                                : t.collected_by === "manual"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {t.collected_by === "cashier"
                              ? "الكاشير"
                              : t.collected_by === "manual"
                                ? "يدوي — المدير"
                                : "موظف البلياردو"}
                          </span>
                          {t.kind === "playstation" && (
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                              بلي ستيشن
                              {t.minutes ? ` — ${t.minutes.toLocaleString("en-US")} دقيقة` : ""}
                            </span>
                          )}
                          <span className="font-bold text-primary">
                            {Number(t.amount).toLocaleString("en-US")} د.ع
                          </span>
                          {/* الحذف للإدخالات اليدوية فقط: المعاملات الحقيقية سجلّ مالي */}
                          {t.collected_by === "manual" && (
                            <button
                              type="button"
                              onClick={() => removeManualIncome(t.id)}
                              aria-label="حذف الإدخال اليدوي"
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5"
                            >
                              <Trash2 size={13} className="text-red-500/70" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {visibleBilliardsTransactions.length > billiardsLogDisplayCount && (
                    <button
                      type="button"
                      onClick={() => setBilliardsLogDisplayCount((c) => c + 10)}
                      className="mt-3 w-full rounded-full bg-primary/5 py-2 text-xs font-semibold text-accent"
                    >
                      عرض المزيد (
                      {visibleBilliardsTransactions.length - billiardsLogDisplayCount} متبقية)
                    </button>
                  )}
                </div>

                <div className="rounded-2xl border border-primary/10 bg-background p-5">
                  <h3 className="mb-4 text-sm font-bold text-primary">
                    أداء الصالة (هذا الشهر)
                  </h3>
                  <div className="flex flex-col gap-2">
                    {billiardsStats.perTable.map((t) => (
                      <div
                        key={t.table_number}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-primary/70">طاولة {t.table_number}</span>
                        <span dir="ltr" className="text-primary/70">
                          8 Pool {t.pool.eight} · 9 Pool {t.pool.nine}
                        </span>
                        <span className="font-bold text-primary">
                          {t.amount.toLocaleString("en-US")} د.ع
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-primary/[0.07] pt-2 text-sm">
                      <span className="text-primary/70">بلي ستيشن</span>
                      <span className="text-primary/70">
                        {billiardsStats.monthPs.minutes > 0
                          ? formatDuration(billiardsStats.monthPs.minutes)
                          : "—"}
                      </span>
                      <span className="font-bold text-primary">
                        {billiardsStats.monthPs.amount.toLocaleString("en-US")} د.ع
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/10 bg-background p-5">
                  <h3 className="mb-1 text-sm font-bold text-primary">
                    أداء الصالة (آخر 7 أيام)
                  </h3>
                  <p className="mb-4 text-[11px] text-primary/40">
                    بلياردو وبلي ستيشن معاً
                  </p>
                  <div className="flex items-end justify-between gap-2 h-32">
                    {billiardsStats.weekDays.map((day, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-24 w-full items-end">
                          <div
                            className="w-full rounded-md bg-accent/60"
                            style={{
                              height: `${Math.max(6, (day.amount / maxBilliardsWeekAmount) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-primary/50">{day.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/10 bg-background p-5">
                  <h3 className="mb-1 text-sm font-bold text-primary">
                    أداء الصالة (هذا الشهر يومياً)
                  </h3>
                  <p className="mb-4 text-[11px] text-primary/40">
                    بلياردو وبلي ستيشن معاً
                  </p>
                  {/* رقم الدخل المحصّل لكل يوم مكتوب عمودياً فوق شمعته — 31 شمعة لا تتّسع لأرقام
                      أفقية على الجوال، فالرقم الدائر يوفّر العرض ويبقى الرقم كاملاً (بلا اختصار) */}
                  <div className="flex h-48 items-end justify-between gap-1 overflow-x-auto">
                    {billiardsStats.monthDays.map((day, i) => (
                      <div
                        key={i}
                        className="flex min-w-[20px] flex-1 flex-col items-center justify-end gap-1"
                      >
                        {day.amount > 0 && (
                          <span
                            dir="ltr"
                            className="rotate-180 whitespace-nowrap text-[10px] font-semibold text-primary/70 [writing-mode:vertical-rl]"
                          >
                            {day.amount.toLocaleString("en-US")}
                          </span>
                        )}
                        <div
                          className="w-full rounded-sm bg-accent/60"
                          style={{
                            height: `${Math.max(4, (day.amount / maxBilliardsMonthAmount) * 96)}px`,
                          }}
                        />
                        <span className="text-[9px] text-primary/40">{day.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* الشهر السابق كاملاً — يُقرأ بعد انتهاء الشهر لمقارنة الأداء */}
                <div className="rounded-2xl border border-primary/10 bg-background p-5">
                  <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm font-bold text-primary">
                      دخل {billiardsStats.lastMonthLabel} (الشهر السابق)
                    </h3>
                    <span className="text-lg font-extrabold text-primary">
                      {billiardsStats.lastMonthAmount.toLocaleString("en-US")} د.ع
                    </span>
                  </div>

                  <div className="mb-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-primary/5 px-3 py-2.5">
                      <p className="mb-0.5 text-[11px] text-primary/50">أيام فيها دخل</p>
                      <p className="text-sm font-extrabold text-primary">
                        {billiardsStats.lastMonthActiveDays.toLocaleString("en-US")} من{" "}
                        {billiardsStats.lastMonthDays.length.toLocaleString("en-US")}
                      </p>
                    </div>
                    <div className="rounded-xl bg-primary/5 px-3 py-2.5">
                      <p className="mb-0.5 text-[11px] text-primary/50">معدّل اليوم العامل</p>
                      <p className="text-sm font-extrabold text-primary">
                        {billiardsStats.lastMonthAvgPerActiveDay.toLocaleString("en-US")} د.ع
                      </p>
                    </div>
                    <div className="rounded-xl bg-primary/5 px-3 py-2.5">
                      <p className="mb-0.5 text-[11px] text-primary/50">أعلى يوم</p>
                      <p className="text-sm font-extrabold text-primary">
                        {billiardsStats.lastMonthBestDay.amount.toLocaleString("en-US")} د.ع
                        <span className="ms-1 text-[11px] font-normal text-primary/50">
                          (يوم {billiardsStats.lastMonthBestDay.label})
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* نفس أسلوب مخطط الشهر الحالي: الرقم عمودياً فوق شمعته ليتّسع 31 يوماً */}
                  <div className="flex h-48 items-end justify-between gap-1 overflow-x-auto">
                    {billiardsStats.lastMonthDays.map((day, i) => (
                      <div
                        key={i}
                        className="flex min-w-[20px] flex-1 flex-col items-center justify-end gap-1"
                      >
                        {day.amount > 0 && (
                          <span
                            dir="ltr"
                            className="rotate-180 whitespace-nowrap text-[10px] font-semibold text-primary/70 [writing-mode:vertical-rl]"
                          >
                            {day.amount.toLocaleString("en-US")}
                          </span>
                        )}
                        <div
                          className={`w-full rounded-sm ${
                            day.amount === billiardsStats.lastMonthBestDay.amount && day.amount > 0
                              ? "bg-accent"
                              : "bg-accent/55"
                          }`}
                          style={{
                            height: `${Math.max(
                              4,
                              (day.amount / maxBilliardsLastMonthAmount) * 96
                            )}px`,
                          }}
                        />
                        <span className="text-[9px] text-primary/40">{day.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-primary/[0.07] pt-3">
                    <p className="mb-2 text-[11px] font-bold text-primary/50">
                      أداء الصالة في {billiardsStats.lastMonthLabel}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {billiardsStats.lastMonthPerTable.map((t) => (
                        <div key={t.table_number} className="rounded-xl bg-primary/5 px-3 py-2">
                          <p className="text-[11px] text-primary/50">طاولة {t.table_number}</p>
                          <p className="text-sm font-extrabold text-primary">
                            {t.amount.toLocaleString("en-US")} د.ع
                          </p>
                          <p dir="ltr" className="text-[10px] text-primary/40">
                            {t.pool.eight} × 8 · {t.pool.nine} × 9
                          </p>
                        </div>
                      ))}
                      {billiardsStats.lastMonthPs.amount > 0 && (
                        <div className="rounded-xl bg-primary/5 px-3 py-2">
                          <p className="text-[11px] text-primary/50">بلي ستيشن</p>
                          <p className="text-sm font-extrabold text-primary">
                            {billiardsStats.lastMonthPs.amount.toLocaleString("en-US")} د.ع
                          </p>
                          <p className="text-[10px] text-primary/40">
                            {formatDuration(billiardsStats.lastMonthPs.minutes)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/10 bg-background p-5">
                  <h3 className="mb-4 text-sm font-bold text-primary">
                    أداء الطاولات الثلاث (هذا الشهر)
                  </h3>
                  <div className="flex items-end justify-between gap-4 h-32">
                    {billiardsStats.perTable.map((t) => (
                      <div key={t.table_number} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-24 w-full items-end">
                          <div
                            className="w-full rounded-md bg-accent/60"
                            style={{
                              height: `${Math.max(6, (t.amount / maxBilliardsTableAmount) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-primary/50">طاولة {t.table_number}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/10 bg-background p-5">
                  <h3 className="mb-3 text-sm font-bold text-primary">
                    ملاحظات موظف البلياردو
                  </h3>
                  {billiardsNotes.length === 0 ? (
                    <p className="text-sm text-primary/50">لا توجد ملاحظات</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {billiardsNotes.map((note) => (
                        <div
                          key={note.id}
                          className="flex items-center justify-between gap-2 rounded-xl bg-primary/5 px-3 py-2.5 text-sm"
                        >
                          <span className="min-w-0 flex-1 text-primary">{note.text}</span>
                          <span className="shrink-0 text-xs text-primary/40">
                            {new Date(note.created_at).toLocaleString("ar")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-primary/10 bg-background p-5">
                  <h3 className="mb-1 text-sm font-bold text-primary">الفواتير الملغاة</h3>
                  <p className="mb-3 text-xs text-primary/40">
                    سجل تدقيق — راجع السبب المكتوب مع كل إلغاء
                  </p>
                  {billiardsCancelledTickets.length === 0 ? (
                    <p className="text-sm text-primary/50">لا توجد فواتير ملغاة</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {billiardsCancelledTickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/5 pb-2 text-sm last:border-0"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-primary">
                              {ticket.customer_ref || "بدون اسم"} — طاولة {ticket.table_number}
                              <span className="ms-1 font-normal text-primary/40">
                                ({ticket.cancelled_at && new Date(ticket.cancelled_at).toLocaleString("ar")})
                              </span>
                            </p>
                            {ticket.cancel_reason && (
                              <p className="text-xs text-primary/60">السبب: {ticket.cancel_reason}</p>
                            )}
                          </div>
                          <span className="font-bold text-primary">
                            {Number(ticket.amount).toLocaleString("en-US")} د.ع
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "draw" &&
              (drawUnlocked ? (
                <DrawChooser onPick={setDrawMode} />
              ) : (
                <DrawGate
                  verifyCode={props.verifyDrawCode}
                  onUnlock={() => setDrawUnlocked(true)}
                />
              ))}

            {tab === "tournaments" && (
              <div>
                <p className="mb-4 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-xs text-primary/60">
                  رابط صفحة البطولة للمشاركة:{" "}
                  <span dir="ltr" className="font-bold text-accent">
                    mazaajcafe.com/tournament
                  </span>
                  <br />
                  تظهر بالصفحة الرئيسية وبهذا الرابط <b>كل</b> البطولات المفعّلة التي لم
                  ينتهِ موعدها، مرتّبة بالأقرب موعداً. البطولة المنتهية تختفي وحدها بعد ٦
                  ساعات من موعد بدايتها.
                </p>

                {tournamentSaved && (
                  <p className="mb-4 rounded-2xl border border-green-300 bg-green-50 px-4 py-3 text-xs font-bold text-green-800">
                    {tournamentSaved}
                  </p>
                )}

                {duplicateIds.size > 0 && (
                  <p className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">
                    عندك بطولتان بنفس العنوان ونفس الموعد (المعلّمتان «مكرّرة»). الاثنتان
                    تظهران بالموقع، فينقسم المشتركون بينهما. احذف أو أخفِ واحدة منهما.
                  </p>
                )}

                {!tournamentForm && (
                  <button
                    type="button"
                    onClick={startCreateTournament}
                    className="mb-5 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background"
                  >
                    <Plus size={16} />
                    إضافة بطولة
                  </button>
                )}

                {tournamentForm && (
                  <form
                    onSubmit={submitTournamentForm}
                    className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/10 bg-background p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-primary">
                        {editingTournamentId ? "تعديل بطولة" : "بطولة جديدة"}
                      </h3>
                      <button type="button" onClick={closeTournamentForm}>
                        <X size={18} className="text-primary/50" />
                      </button>
                    </div>

                    <input
                      required
                      placeholder="اسم البطولة"
                      value={tournamentForm.title}
                      onChange={(e) =>
                        setTournamentForm({ ...tournamentForm, title: e.target.value })
                      }
                      className="rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                    />

                    <input
                      required
                      placeholder="صنف البطولة (مثلاً: 71 خبيثة)"
                      value={tournamentForm.category}
                      onChange={(e) =>
                        setTournamentForm({ ...tournamentForm, category: e.target.value })
                      }
                      className="rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                    />

                    <label className="text-xs font-semibold text-primary/60">
                      موعد البطولة
                      <input
                        required
                        type="datetime-local"
                        value={tournamentForm.starts_at}
                        onChange={(e) =>
                          setTournamentForm({ ...tournamentForm, starts_at: e.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                      />
                    </label>

                    <label className="text-xs font-semibold text-primary/60">
                      انتهاء التسجيل
                      <input
                        required
                        type="datetime-local"
                        value={tournamentForm.registration_closes_at}
                        onChange={(e) =>
                          setTournamentForm({
                            ...tournamentForm,
                            registration_closes_at: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                      />
                    </label>

                    <label className="text-xs font-semibold text-primary/60">
                      سعر الطاولة للفريق (د.ع)
                      <input
                        required
                        type="number"
                        min={0}
                        value={tournamentForm.entry_fee}
                        onChange={(e) =>
                          setTournamentForm({
                            ...tournamentForm,
                            entry_fee: Number(e.target.value),
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                      />
                    </label>

                    <label className="text-xs font-semibold text-primary/60">
                      حد أقصى للفرق (اتركه فارغاً = مفتوح)
                      <input
                        type="number"
                        min={1}
                        value={tournamentForm.max_teams ?? ""}
                        onChange={(e) =>
                          setTournamentForm({
                            ...tournamentForm,
                            max_teams: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setTournamentForm({
                          ...tournamentForm,
                          is_active: !tournamentForm.is_active,
                        })
                      }
                      className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                        tournamentForm.is_active
                          ? "bg-primary text-background"
                          : "bg-primary/5 text-primary/60"
                      }`}
                    >
                      {tournamentForm.is_active ? "مفعّلة — تظهر بالموقع" : "غير مفعّلة — مخفية"}
                    </button>

                    {tournamentFormError && (
                      <p className="text-sm text-red-500">{tournamentFormError}</p>
                    )}

                    <button
                      type="submit"
                      className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background"
                    >
                      {editingTournamentId ? "حفظ التعديلات" : "إضافة البطولة"}
                    </button>
                  </form>
                )}

                <div className="flex flex-col gap-3">
                  {tournaments.length === 0 && (
                    <p className="py-10 text-center text-primary/50">لا توجد بطولات بعد</p>
                  )}
                  {tournaments.map((tournament) => {
                    const teams = tournamentTeams.filter(
                      (t) => t.tournament_id === tournament.id
                    );
                    const isExpanded = expandedTournamentId === tournament.id;
                    const isLive = liveIds.has(tournament.id);
                    const isDuplicate = duplicateIds.has(tournament.id);
                    return (
                      <div
                        key={tournament.id}
                        className="rounded-2xl border border-primary/10 bg-background p-4"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <p className="font-bold text-primary">{tournament.title}</p>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                  tournament.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-primary/5 text-primary/50"
                                }`}
                              >
                                {tournament.is_active ? "مفعّلة" : "مخفية"}
                              </span>
                              {isLive && (
                                <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                                  معروضة بالموقع
                                </span>
                              )}
                              {isDuplicate && (
                                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                                  مكرّرة
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-primary/60">
                              {tournament.category} — {formatTournamentDate(tournament.starts_at)}
                            </p>
                            <p className="mt-1 text-xs text-primary/50">
                              ينتهي التسجيل:{" "}
                              {formatTournamentDate(tournament.registration_closes_at)}
                            </p>
                            <p className="mt-1 text-xs text-primary/50">
                              سعر الطاولة {tournament.entry_fee.toLocaleString("en-US")} د.ع
                              {tournament.max_teams !== null &&
                                ` — حد أقصى ${tournament.max_teams.toLocaleString("en-US")} فريق`}
                            </p>
                            <p className="mt-2 border-t border-primary/5 pt-2 text-[11px] text-primary/40">
                              أُنشئت: {formatTournamentDate(tournament.created_at)}
                              {tournament.updated_at
                                ? ` — آخر تعديل: ${formatTournamentDate(tournament.updated_at)}`
                                : " — بلا تعديلات"}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEditTournament(tournament)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5"
                            >
                              <Pencil size={14} className="text-primary/60" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeTournament(tournament)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5"
                            >
                              <Trash2 size={14} className="text-red-500/70" />
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setExpandedTournamentId(isExpanded ? null : tournament.id);
                            closeTeamForm();
                          }}
                          className="flex w-full items-center justify-between rounded-xl bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary"
                        >
                          <span>المشتركون ({teams.length.toLocaleString("en-US")})</span>
                          <ChevronDown
                            size={16}
                            className={`text-primary/50 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <div className="mt-3 flex flex-col gap-2">
                            {teams.length === 0 && (
                              <p className="py-4 text-center text-sm text-primary/50">
                                لا يوجد مشتركون بعد
                              </p>
                            )}
                            {teams.map((team, index) =>
                              editingTeamId === team.id && teamForm ? (
                                <form
                                  key={team.id}
                                  onSubmit={submitTeamForm}
                                  className="flex flex-col gap-2 rounded-xl border border-accent/30 bg-accent/5 p-3"
                                >
                                  <input
                                    required
                                    value={teamForm.player1_name}
                                    onChange={(e) =>
                                      setTeamForm({ ...teamForm, player1_name: e.target.value })
                                    }
                                    placeholder="اللاعب الأول"
                                    className="rounded-lg border border-primary/15 bg-background px-3 py-2 text-sm text-primary"
                                  />
                                  <input
                                    required
                                    value={teamForm.player2_name}
                                    onChange={(e) =>
                                      setTeamForm({ ...teamForm, player2_name: e.target.value })
                                    }
                                    placeholder="اللاعب الثاني"
                                    className="rounded-lg border border-primary/15 bg-background px-3 py-2 text-sm text-primary"
                                  />
                                  <input
                                    required
                                    dir="ltr"
                                    value={teamForm.phone}
                                    onChange={(e) =>
                                      setTeamForm({ ...teamForm, phone: e.target.value })
                                    }
                                    placeholder="07XXXXXXXXX"
                                    className="rounded-lg border border-primary/15 bg-background px-3 py-2 text-start text-sm text-primary"
                                  />
                                  {teamFormError && (
                                    <p className="text-xs text-red-500">{teamFormError}</p>
                                  )}
                                  <div className="flex gap-2">
                                    <button
                                      type="submit"
                                      className="flex-1 rounded-full bg-primary py-2 text-xs font-bold text-background"
                                    >
                                      حفظ
                                    </button>
                                    <button
                                      type="button"
                                      onClick={closeTeamForm}
                                      className="rounded-full bg-primary/5 px-4 py-2 text-xs font-bold text-primary/60"
                                    >
                                      إلغاء
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <div
                                  key={team.id}
                                  className="flex items-start justify-between gap-3 rounded-xl bg-primary/5 px-3 py-2.5"
                                >
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-primary">
                                      {index + 1}. {teamLabel(team)}
                                    </p>
                                    <a
                                      href={`tel:${team.phone}`}
                                      dir="ltr"
                                      className="mt-1 flex items-center gap-1 text-xs font-semibold text-accent"
                                    >
                                      <Phone size={12} />
                                      {team.phone}
                                    </a>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => startEditTeam(team)}
                                      className="flex h-7 w-7 items-center justify-center rounded-full bg-background"
                                    >
                                      <Pencil size={12} className="text-primary/60" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeTeam(team)}
                                      className="flex h-7 w-7 items-center justify-center rounded-full bg-background"
                                    >
                                      <Trash2 size={12} className="text-red-500/70" />
                                    </button>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "applicants" && (
              <div className="flex flex-col gap-3">
                {applicants.length === 0 && (
                  <p className="py-10 text-center text-primary/50">لا يوجد متقدمون بعد</p>
                )}
                {applicants.map((applicant) => (
                  <div
                    key={applicant.id}
                    className="rounded-2xl border border-primary/10 bg-background p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-bold text-primary">{applicant.name}</span>
                      <span className="text-xs text-primary/40">
                        {new Date(applicant.created_at).toLocaleString("ar")}
                      </span>
                    </div>
                    <div className="mb-1 flex items-center gap-2">
                      <a
                        href={`tel:${applicant.phone}`}
                        className="flex items-center gap-1 text-sm text-primary/60 underline-offset-2 hover:underline"
                      >
                        <Phone size={12} />
                        {applicant.phone}
                      </a>
                      <a
                        href={`https://wa.me/${toWhatsAppNumber(applicant.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="مراسلة عبر واتساب"
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700"
                      >
                        <MessageSquare size={12} />
                      </a>
                    </div>
                    <p className="mb-1 text-sm font-semibold text-accent">
                      {POSITION_LABELS_AR[applicant.position as PositionKey] ?? applicant.position}
                    </p>
                    {applicant.notes && (
                      <p className="mb-2 text-sm text-primary/50">{applicant.notes}</p>
                    )}
                    {applicant.cv_url && (
                      <a
                        href={applicant.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-primary underline"
                      >
                        عرض السيرة الذاتية
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === "jobs" && (
              <div>
                {!jobForm && (
                  <button
                    type="button"
                    onClick={startCreateJob}
                    className="mb-5 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background"
                  >
                    <Plus size={16} />
                    إضافة وظيفة
                  </button>
                )}

                {jobForm && (
                  <form
                    onSubmit={submitJobForm}
                    className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/10 bg-background p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-primary">
                        {editingJobId ? "تعديل وظيفة" : "وظيفة جديدة"}
                      </h3>
                      <button type="button" onClick={closeJobForm}>
                        <X size={18} className="text-primary/50" />
                      </button>
                    </div>

                    <select
                      required
                      value={jobForm.position_key}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, position_key: e.target.value })
                      }
                      className="rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                    >
                      <option value="" disabled>
                        اختر المسمى الوظيفي
                      </option>
                      {POSITION_KEYS.map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </select>

                    <input
                      required
                      placeholder="عنوان الوظيفة (عربي)"
                      value={jobForm.title_ar}
                      onChange={(e) => setJobForm({ ...jobForm, title_ar: e.target.value })}
                      className="rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                    />
                    <input
                      required
                      placeholder="Title (English)"
                      value={jobForm.title_en}
                      onChange={(e) => setJobForm({ ...jobForm, title_en: e.target.value })}
                      className="rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                      dir="ltr"
                    />
                    <textarea
                      required
                      rows={2}
                      placeholder="وصف الوظيفة (عربي)"
                      value={jobForm.description_ar}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, description_ar: e.target.value })
                      }
                      className="resize-none rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                    />
                    <textarea
                      required
                      rows={2}
                      placeholder="Description (English)"
                      value={jobForm.description_en}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, description_en: e.target.value })
                      }
                      className="resize-none rounded-xl border border-primary/15 bg-background px-4 py-2.5 text-sm text-primary"
                      dir="ltr"
                    />

                    {jobFormError && <p className="text-sm text-red-500">{jobFormError}</p>}

                    <button
                      type="submit"
                      className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background"
                    >
                      {editingJobId ? "حفظ التعديلات" : "إضافة الوظيفة"}
                    </button>
                  </form>
                )}

                <div className="flex flex-col gap-3">
                  {jobs.length === 0 && (
                    <p className="py-10 text-center text-primary/50">لا توجد وظائف مضافة</p>
                  )}
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-primary/10 bg-background p-4"
                    >
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-bold text-primary">{job.title_ar}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              job.is_active
                                ? "bg-accent/15 text-primary"
                                : "bg-primary/5 text-primary/40"
                            }`}
                          >
                            {job.is_active ? "شاغرة" : "غير مفعّلة"}
                          </span>
                        </div>
                        <p className="text-sm text-primary/60">{job.description_ar}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleJobActive(job)}
                          className="rounded-full bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary/70"
                        >
                          {job.is_active ? "إخفاء" : "تفعيل"}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditJob(job)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5"
                        >
                          <Pencil size={14} className="text-primary/60" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeJob(job.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5"
                        >
                          <Trash2 size={14} className="text-red-500/70" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "suggestions" && (
              <div className="flex flex-col gap-3">
                {suggestions.length === 0 && (
                  <p className="py-10 text-center text-primary/50">لا توجد اقتراحات بعد</p>
                )}
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="rounded-2xl border border-primary/10 bg-background p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-primary">
                        {SUGGESTION_TYPE_LABELS[suggestion.type] ?? suggestion.type}
                      </span>
                      <span className="text-xs text-primary/40">
                        {new Date(suggestion.created_at).toLocaleString("ar")}
                      </span>
                    </div>
                    <p className="text-sm leading-loose text-primary/70">
                      {suggestion.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-background p-4">
      <p className="mb-1 text-xs text-primary/50">{label}</p>
      <p className="text-lg font-extrabold text-primary sm:text-xl">{value}</p>
    </div>
  );
}
