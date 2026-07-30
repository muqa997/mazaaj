"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
} from "lucide-react";
import { computePoolAmount } from "@/lib/billiards";
import { POSITION_KEYS, POSITION_LABELS_AR, type PositionKey } from "@/lib/job-openings";
import { DELIVERY_FEE } from "@/lib/config";
import { MENU_CATEGORIES, MENU_CATEGORY_LABELS_AR, type MenuCategory } from "@/lib/menu-data";
import { STATUS_META, STATUS_ORDER, toWhatsAppNumber, buildConfirmMessage } from "@/lib/order-helpers";
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
} from "@/app/(admin)/panel/actions";

type Tab =
  | "overview"
  | "orders"
  | "coupons"
  | "announcements"
  | "promos"
  | "billiards"
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
  settleBilliardsWithOperator: () => Promise<{ error: string | null }>;
  getBilliardsNotes: () => Promise<BilliardsNoteRow[]>;
};

const PROMO_LABELS: Record<PromoKey, { title: string; cta: string }> = {
  trending: { title: "الرائج الآن", cta: "اطلب الآن" },
  offer: { title: "العروض", cta: "اطلب العرض" },
};

const SUGGESTION_TYPE_LABELS: Record<string, string> = {
  bug: "الإبلاغ عن خطأ",
  uiImprovement: "تحسين واجهة",
  newFeature: "إضافة قسم",
  poorService: "سوء خدمة",
  inquiry: "استفسار",
  compliment: "إشادة",
  other: "أخرى",
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

function computeBilliardsStats(transactions: BilliardsTransactionRow[]) {
  const now = new Date();

  const sumBy = (rows: BilliardsTransactionRow[], key: "games_count" | "amount") =>
    rows.reduce((sum, t) => sum + Number(t[key]), 0);

  const sumPool = (rows: BilliardsTransactionRow[]) => ({
    eight: rows.reduce((sum, t) => sum + Number(t.games_count), 0),
    nine: rows.reduce((sum, t) => sum + Number(t.games_count_9ball), 0),
  });

  const todayTx = transactions.filter((t) => isSameDay(new Date(t.paid_at), now));

  const last7DaysStart = new Date(now);
  last7DaysStart.setDate(last7DaysStart.getDate() - 6);
  last7DaysStart.setHours(0, 0, 0, 0);
  const weekTx = transactions.filter((t) => new Date(t.paid_at) >= last7DaysStart);

  const monthTx = transactions.filter((t) => {
    const d = new Date(t.paid_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  // أداء الطاولات لهذا الشهر فقط (وليس إجمالي منذ البداية)، مقسّم ٨ بول/٩ بول
  const perTable = [1, 2, 3].map((n) => {
    const tableTx = monthTx.filter((t) => t.table_number === n);
    return {
      table_number: n,
      pool: sumPool(tableTx),
      amount: sumBy(tableTx, "amount"),
    };
  });

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const day = new Date(now);
    day.setDate(day.getDate() - (6 - i));
    const amount = sumBy(
      transactions.filter((t) => isSameDay(new Date(t.paid_at), day)),
      "amount"
    );
    return { label: day.toLocaleDateString("ar", { weekday: "short" }), amount };
  });

  const daysElapsedInMonth = now.getDate();
  const monthDays = Array.from({ length: daysElapsedInMonth }).map((_, i) => {
    const day = i + 1;
    const amount = sumBy(
      monthTx.filter((t) => new Date(t.paid_at).getDate() === day),
      "amount"
    );
    return { label: String(day), amount };
  });

  // ما هو "بحوزة موظف البلياردو" فعلاً الآن ولم يُسوَّ مع المدير بعد — إما جمعه هو
  // مباشرة، أو استلمه من الكاشير وأكّد ذلك (handed_over_at). هذا هو رصيد المطالبة
  // اليومية: المدير يقرأ هذا الرقم ويطالب الموظف به مباشرة نهاية اليوم
  const withOperatorTx = transactions.filter(
    (t) => !t.settled_at && (t.collected_by === "billiards" || !!t.handed_over_at)
  );
  // حالة نادرة: مبلغ لا يزال بحوزة الكاشير (زبون نزل مباشرة) ولم يستلمه الموظف بعد —
  // مؤشر ثانوي صغير يذكّر المدير بمتابعته
  const withCashierTx = transactions.filter(
    (t) => t.collected_by === "cashier" && !t.handed_over_at
  );

  return {
    todayPool: sumPool(todayTx),
    todayAmount: sumBy(todayTx, "amount"),
    weekPool: sumPool(weekTx),
    weekAmount: sumBy(weekTx, "amount"),
    monthPool: sumPool(monthTx),
    monthAmount: sumBy(monthTx, "amount"),
    todayLabel: formatDayMonth(now),
    weekLabel: `${formatDayMonth(last7DaysStart)} - ${formatDayMonth(now)}`,
    monthLabel: `الشهر ${ARABIC_ORDINAL_MONTHS[now.getMonth()]}`,
    perTable,
    weekDays,
    monthDays,
    withOperatorAmount: sumBy(withOperatorTx, "amount"),
    withOperatorCount: withOperatorTx.length,
    withCashierAmount: sumBy(withCashierTx, "amount"),
    withCashierCount: withCashierTx.length,
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
  const [showFullBilliardsLog, setShowFullBilliardsLog] = useState(false);
  const [settlingBilliards, setSettlingBilliards] = useState(false);
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

  const loadAll = async () => {
    setLoading(true);
    try {
      const [o, c, a, j, s, an, pr, bt, btx, bn] = await Promise.all([
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    props.refreshSessionAction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.localStorage.setItem(TAB_STORAGE_KEY, tab);
  }, [tab]);

  const handleLogout = async () => {
    await props.logoutAction();
    router.refresh();
  };

  // المدير يؤكد استلامه دخل اليوم نقداً من موظف البلياردو — تسوية جماعية لكل ما هو
  // "بحوزة الموظف" فعلاً الآن، بضغطة واحدة، بعد أن يعرض له الرقم الدقيق من النظام
  const handleSettleBilliards = async () => {
    const confirmed = window.confirm(
      `تأكيد استلامك ${billiardsStats.withOperatorAmount.toLocaleString("en-US")} د.ع نقداً من موظف البلياردو؟`
    );
    if (!confirmed) return;
    setSettlingBilliards(true);
    await props.settleBilliardsWithOperator();
    await loadAll();
    setSettlingBilliards(false);
  };

  const stats = useMemo(() => computeStats(orders), [orders]);
  const billiardsStats = useMemo(
    () => computeBilliardsStats(billiardsTransactions),
    [billiardsTransactions]
  );
  const maxWeekChartCount = Math.max(1, ...stats.last7Days.map((d) => d.count));
  const maxMonthChartCount = Math.max(1, ...stats.monthDays.map((d) => d.count));
  const maxBilliardsWeekAmount = Math.max(1, ...billiardsStats.weekDays.map((d) => d.amount));
  const maxBilliardsMonthAmount = Math.max(1, ...billiardsStats.monthDays.map((d) => d.amount));
  const maxBilliardsTableAmount = Math.max(1, ...billiardsStats.perTable.map((t) => t.amount));

  // سجل العمليات: آخر 7 أيام افتراضياً (تخفيفاً للصفحة)، مع رابط لعرض كل ما جُلب (حتى 35 يوماً)
  const visibleBilliardsTransactions = useMemo(() => {
    if (showFullBilliardsLog) return billiardsTransactions;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return billiardsTransactions.filter((t) => new Date(t.paid_at) >= sevenDaysAgo);
  }, [billiardsTransactions, showFullBilliardsLog]);

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
    { key: "billiards", label: "البلياردو", icon: CircleDot },
    { key: "applicants", label: "المتقدمون", icon: Users },
    { key: "coupons", label: "الكوبونات", icon: Ticket },
    { key: "announcements", label: "الإعلانات", icon: Megaphone },
    { key: "promos", label: "الرائج والعروض", icon: ImageIcon },
    { key: "jobs", label: "الوظائف", icon: Briefcase },
    { key: "suggestions", label: "الاقتراحات", icon: MessageSquare },
  ];

  const selectTab = (key: Tab) => {
    setTab(key);
    setDrawerOpen(false);
  };

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
                    label="دخل البلياردو اليوم"
                    value={`${billiardsStats.todayAmount.toLocaleString("en-US")} د.ع`}
                  />
                  <StatCard
                    label="دخل البلياردو الأسبوع"
                    value={`${billiardsStats.weekAmount.toLocaleString("en-US")} د.ع`}
                  />
                  <StatCard
                    label="دخل البلياردو الشهر"
                    value={`${billiardsStats.monthAmount.toLocaleString("en-US")} د.ع`}
                  />
                </div>

                <div
                  className={`flex items-center justify-between rounded-2xl border p-4 ${
                    billiardsStats.withOperatorAmount > 0
                      ? "border-amber-500/30 bg-amber-500/10"
                      : "border-primary/10 bg-background"
                  }`}
                >
                  <div>
                    <p className="mb-1 text-xs text-primary/50">بحوزة موظف البلياردو الآن</p>
                    <p className="text-lg font-extrabold text-primary sm:text-xl">
                      {billiardsStats.withOperatorAmount.toLocaleString("en-US")} د.ع
                    </p>
                    {billiardsStats.withCashierAmount > 0 && (
                      <p className="mt-1 text-[11px] font-semibold text-amber-700">
                        + {billiardsStats.withCashierAmount.toLocaleString("en-US")} د.ع لا تزال بحوزة الكاشير
                      </p>
                    )}
                    <p className="mt-1 text-[11px] font-semibold text-primary/50">
                      المجموع:{" "}
                      {(billiardsStats.withOperatorAmount + billiardsStats.withCashierAmount).toLocaleString(
                        "en-US"
                      )}{" "}
                      د.ع
                    </p>
                  </div>
                  {billiardsStats.withOperatorCount > 0 && (
                    <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-700">
                      {billiardsStats.withOperatorCount} معاملة
                    </span>
                  )}
                </div>
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
                <div
                  className={`rounded-2xl border p-4 ${
                    billiardsStats.withOperatorAmount > 0
                      ? "border-amber-500/30 bg-amber-500/10"
                      : "border-primary/10 bg-background"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="mb-1 text-xs text-primary/50">بحوزة موظف البلياردو الآن</p>
                      <p className="text-lg font-extrabold text-primary sm:text-xl">
                        {billiardsStats.withOperatorAmount.toLocaleString("en-US")} د.ع
                      </p>
                      {billiardsStats.withCashierAmount > 0 && (
                        <p className="mt-1 text-[11px] font-semibold text-amber-700">
                          + {billiardsStats.withCashierAmount.toLocaleString("en-US")} د.ع لا تزال بحوزة الكاشير (بانتظار استلام الموظف)
                        </p>
                      )}
                      <p className="mt-1 text-[11px] font-semibold text-primary/50">
                        المجموع:{" "}
                        {(billiardsStats.withOperatorAmount + billiardsStats.withCashierAmount).toLocaleString(
                          "en-US"
                        )}{" "}
                        د.ع
                      </p>
                    </div>
                    {billiardsStats.withOperatorCount > 0 && (
                      <span className="shrink-0 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-700">
                        {billiardsStats.withOperatorCount} معاملة
                      </span>
                    )}
                  </div>
                  {billiardsStats.withOperatorAmount > 0 && (
                    <button
                      type="button"
                      disabled={settlingBilliards}
                      onClick={handleSettleBilliards}
                      className="mt-3 w-full rounded-full bg-amber-500 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                    >
                      استلمت من موظف البلياردو
                    </button>
                  )}
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-bold text-primary">
                    الحالة الحالية (غير مدفوعة بعد)
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {billiardsTables.map((table) => (
                      <div
                        key={table.id}
                        className="relative rounded-2xl border border-primary/10 bg-background p-4"
                      >
                        {(table.games_count > 0 || table.games_count_9ball > 0) && (
                          <BilliardsActiveDot />
                        )}
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
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-bold text-primary">الدخل المُحصَّل</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {(
                      [
                        ["اليوم", billiardsStats.todayLabel, billiardsStats.todayAmount, billiardsStats.todayPool],
                        ["آخر 7 أيام", billiardsStats.weekLabel, billiardsStats.weekAmount, billiardsStats.weekPool],
                        ["هذا الشهر", billiardsStats.monthLabel, billiardsStats.monthAmount, billiardsStats.monthPool],
                      ] as const
                    ).map(([label, dateLabel, amount, pool]) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-accent/25 bg-accent/10 p-4"
                      >
                        <p className="mb-1 text-xs text-primary/50">
                          {label} <span dir="ltr">({dateLabel})</span>
                        </p>
                        <p className="text-lg font-extrabold text-primary sm:text-xl">
                          {amount.toLocaleString("en-US")} د.ع{" "}
                          <span dir="ltr" className="text-sm font-normal text-primary/50">
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
                      {visibleBilliardsTransactions.map((t) => (
                        <div
                          key={t.id}
                          className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/5 pb-2 text-sm last:border-0"
                        >
                          <span className="text-primary/50">
                            {t.session_ended_at && (
                              <>
                                إنهاء الجلسة: {new Date(t.session_ended_at).toLocaleString("ar")}
                                <br />
                              </>
                            )}
                            وقت الاستلام: {new Date(t.paid_at).toLocaleString("ar")}
                            {t.collected_by === "cashier" && (
                              <>
                                <br />
                                {t.handed_over_at ? (
                                  <>استلمه الموظف من الكاشير: {new Date(t.handed_over_at).toLocaleString("ar")}</>
                                ) : (
                                  <span className="font-semibold text-amber-700">لم يستلمه الموظف من الكاشير بعد</span>
                                )}
                              </>
                            )}
                            {(t.collected_by === "billiards" || t.handed_over_at) && (
                              <>
                                <br />
                                {t.settled_at ? (
                                  <>تمت التسوية مع المدير: {new Date(t.settled_at).toLocaleString("ar")}</>
                                ) : (
                                  <span className="font-semibold text-amber-700">لم تُسوَّ مع المدير بعد</span>
                                )}
                              </>
                            )}
                          </span>
                          <span className="text-primary/70">طاولة {t.table_number}</span>
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
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {t.collected_by === "cashier" ? "الكاشير" : "موظف البلياردو"}
                          </span>
                          <span className="font-bold text-primary">
                            {Number(t.amount).toLocaleString("en-US")} د.ع
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-primary/10 bg-background p-5">
                  <h3 className="mb-4 text-sm font-bold text-primary">
                    أداء الطاولات (هذا الشهر)
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
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/10 bg-background p-5">
                  <h3 className="mb-4 text-sm font-bold text-primary">
                    أداء البلياردو (آخر 7 أيام)
                  </h3>
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
                  <h3 className="mb-4 text-sm font-bold text-primary">
                    أداء البلياردو (هذا الشهر يومياً)
                  </h3>
                  <div className="flex items-end justify-between gap-1 h-32 overflow-x-auto">
                    {billiardsStats.monthDays.map((day, i) => (
                      <div key={i} className="flex min-w-[10px] flex-1 flex-col items-center gap-1">
                        <div className="flex h-24 w-full items-end">
                          <div
                            className="w-full rounded-sm bg-accent/60"
                            style={{
                              height: `${Math.max(6, (day.amount / maxBilliardsMonthAmount) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-primary/40">{day.label}</span>
                      </div>
                    ))}
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
