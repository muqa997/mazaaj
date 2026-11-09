"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  BILLIARDS_COOKIE_NAME,
  createBilliardsSessionToken,
  verifyBilliardsSessionToken,
} from "@/lib/billiards-session";
import {
  computePlaystationAmount,
  PS_MAX_SESSION_MINUTES,
  PS_MINUTES_PER_QUARTER,
  type PlaystationDeviceRow,
} from "@/lib/playstation";
import {
  computePoolAmount,
  getBusinessDayStart,
  getBusinessMonthStart,
  type BilliardsTableRow,
  type BilliardsTicketRow,
  type BilliardsNoteRow,
  type BilliardsTransactionRow,
} from "@/lib/billiards";

import { signalOnSuccess } from "@/lib/sync-signal-server";

export type { BilliardsTableRow, BilliardsTicketRow, BilliardsNoteRow, BilliardsTransactionRow };
export type { PlaystationDeviceRow };

export type PoolType = "eight" | "nine";

export async function billiardsLogin(code: string): Promise<{ success: boolean }> {
  const expected = process.env.BILLIARDS_ACCESS_CODE;
  if (!expected || code !== expected) {
    return { success: false };
  }

  const { value, maxAge } = createBilliardsSessionToken();
  cookies().set(BILLIARDS_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  return { success: true };
}

export async function billiardsLogout() {
  cookies().delete(BILLIARDS_COOKIE_NAME);
}

// يمدّد الجلسة 3 أيام إضافية من آخر استخدام فعلي للصفحة (يُستدعى من الواجهة عند فتحها)
export async function refreshBilliardsSession() {
  const token = cookies().get(BILLIARDS_COOKIE_NAME)?.value;
  if (!verifyBilliardsSessionToken(token)) return;

  const { value, maxAge } = createBilliardsSessionToken();
  cookies().set(BILLIARDS_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

function requireBilliardsSession() {
  const token = cookies().get(BILLIARDS_COOKIE_NAME)?.value;
  if (!verifyBilliardsSessionToken(token)) {
    throw new Error("Unauthorized");
  }
}

// ترجع null عند تعذّر الجلب (لا [] ): الواجهة عندها تُبقي آخر بيانات صحيحة بدل أن
// تمسح الشاشة. القائمة الفارغة محجوزة لمعناها الحقيقي: لا توجد سجلات
export async function getBilliardsTables(): Promise<BilliardsTableRow[] | null> {
  requireBilliardsSession();
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("billiards_tables")
    .select("*")
    .order("table_number", { ascending: true });
  if (error) {
    console.error(error);
    return null;
  }
  return (data ?? []) as BilliardsTableRow[];
}

// يضبط عدد كيمات القسم (٨/٩ بول) على قيمة مطلقة مباشرة (بلا قراءة مسبقة) — الواجهة
// تُرسل القيمة النهائية بعد تجميع ضغطات المستخدم السريعة (debounce)، فتصبح كل عملية
// كتابة واحدة مستقلة لا تتعارض مع غيرها، بعكس نمط "اقرأ ثم زِد بواحد" الذي كان يفقد
// بعض الضغطات عند الضغط السريع المتتالي (حالة تسابق race condition)
export async function setGameCount(tableNumber: number, pool: PoolType, count: number) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const safeCount = Math.max(0, Math.floor(count));
  const update = pool === "eight" ? { games_count: safeCount } : { games_count_9ball: safeCount };

  const { error } = await supabaseAdmin
    .from("billiards_tables")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("table_number", tableNumber);
  return signalOnSuccess("billiards", { error: error ? "حدث خطأ أثناء الحفظ" : null });
}

// يُحفظ اسم/رقم طاولة الزبون فور الكتابة (وليس فقط عند إنهاء الجلسة) ليظهر حياً عند الكاشير
export async function updateCustomerRef(tableNumber: number, customerRef: string) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin
    .from("billiards_tables")
    .update({ customer_ref: customerRef.trim() || null })
    .eq("table_number", tableNumber);
  return signalOnSuccess("billiards", { error: error ? "حدث خطأ أثناء الحفظ" : null });
}

// إنهاء الجلسة: يفصل كيمات الطاولة الحالية (٨ بول و٩ بول معاً) عن عداد الطاولة الحي
// في "تذكرة" مستقلة بانتظار الدفع عند الكاشير حصراً — وتُصفَّر الطاولة فوراً لتصبح
// جاهزة لزبون جديد بدون انتظار الدفع. وظيفة الموظف تقتصر على تسجيل الكيمات وإصدار
// الفاتورة؛ لا يدفعها ولا يلغيها بنفسه — الكاشير وحده من يفعل ذلك من صفحته.
//
// الكيمات تأتي **من الشاشة** لا من قراءة جديدة للطاولة: الشاشة هي ما رآه الموظف وبنى
// عليه قراره. القراءة من قاعدة البيانات هنا كانت سبب ضياع فواتير حقيقية — لو ضغط
// الموظف "إنهاء" قبل أن تصل آخر كتابة للعدّاد، كان الخادم يقرأ صفراً ويخرج بصمت بلا
// فاتورة، ثم تصل الكتابة المتأخرة فتُرجع الكيمات للطاولة وكأن شيئاً لم يكن
export async function endSession(
  tableNumber: number,
  customerRef: string,
  counts: { eight: number; nine: number }
) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };

  const eight = Math.max(0, Math.floor(counts.eight));
  const nine = Math.max(0, Math.floor(counts.nine));
  // خطأ صريح بدل نجاح صامت: الموظف لازم يشوف أن لا فاتورة صدرت
  if (eight === 0 && nine === 0) return { error: "لا توجد كيمات لإنهاء الجلسة" };

  const { error: ticketError } = await supabaseAdmin.from("billiards_tickets").insert({
    table_number: tableNumber,
    games_count: eight,
    games_count_9ball: nine,
    amount: computePoolAmount(eight, nine),
    customer_ref: customerRef.trim() || null,
  });
  if (ticketError) {
    console.error(ticketError);
    return { error: "حدث خطأ أثناء إنشاء الفاتورة — لم تُصفَّر الطاولة" };
  }

  // التصفير بعد نجاح الفاتورة حصراً، فلا تضيع كيمات بلا فاتورة مقابلها
  const { error } = await supabaseAdmin
    .from("billiards_tables")
    .update({
      games_count: 0,
      games_count_9ball: 0,
      customer_ref: null,
      updated_at: new Date().toISOString(),
    })
    .eq("table_number", tableNumber);
  if (error) console.error(error);
  return signalOnSuccess("billiards", {
    error: error ? "صدرت الفاتورة لكن تعذّر تصفير الطاولة — صفّرها يدوياً" : null,
  });
}

// التذاكر التي أنشأها الموظف بإنهاء الجلسة — يدفعها الكاشير حصراً، لكن يستطيع الموظف
// إلغاءها بنفسه (بدون دفع) لتصحيح خطأ عرضي كرقم طاولة خاطئ؛ الملغاة لا تظهر هنا
// (تبقى مرئية للمدير فقط بسجل التدقيق)
export async function getPendingTickets(): Promise<BilliardsTicketRow[] | null> {
  requireBilliardsSession();
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("billiards_tickets")
    .select("*")
    .is("cancelled_at", null)
    .order("created_at", { ascending: true });
  if (error) {
    console.error(error);
    return null;
  }
  return (data ?? []) as BilliardsTicketRow[];
}

// إلغاء الفاتورة بدون دفع — بلا سبب إلزامي (بعكس إلغاء الكاشير)، لتصحيح خطأ عرضي
// سريعاً كرقم طاولة خاطئ. لا تُحذف بل تُعلَّم ملغاة فتبقى مرئية للمدير بسجل التدقيق،
// فقط بلا سبب مكتوب
export async function cancelTicket(ticketId: string) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin
    .from("billiards_tickets")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", ticketId)
    .is("cancelled_at", null);
  return signalOnSuccess("billiards", { error: error ? "حدث خطأ أثناء إلغاء التذكرة" : null });
}

type PoolCounts = { eight: number; nine: number };

// إحصائيات اليوم/الأسبوع/الشهر وأداء الطاولات الشهري، مقسّمة ٨ بول/٩ بول كلٌ على حدة.
// "اليوم" فقط يجمع (الحي غير المدفوع + التذاكر المعلّقة + المدفوع فعلياً) لأنها تعكس
// كل ما لُعب اليوم بغضّ النظر عن حالة الدفع؛ الأسبوع/الشهر وأداء الطاولات تعتمد على
// المدفوع فعلياً فقط (نفس منطق لوحة تحكم المدير) لتفادي تعقيد حساب التذاكر عبر أيام متعددة
export async function getBilliardsOperatorStats(): Promise<{
  today: PoolCounts;
  week: PoolCounts;
  month: PoolCounts;
  /** مجموع البلياردو + البلي ستيشن */
  todayAmount: number;
  yesterdayAmount: number;
  perTable: { table_number: number; eight: number; nine: number }[];
  ps: {
    todayMinutes: number;
    todayAmount: number;
    weekMinutes: number;
    weekAmount: number;
    monthMinutes: number;
    monthAmount: number;
  };
}> {
  requireBilliardsSession();
  const empty = {
    today: { eight: 0, nine: 0 },
    week: { eight: 0, nine: 0 },
    month: { eight: 0, nine: 0 },
    todayAmount: 0,
    yesterdayAmount: 0,
    perTable: [1, 2, 3].map((n) => ({ table_number: n, eight: 0, nine: 0 })),
    ps: {
      todayMinutes: 0,
      todayAmount: 0,
      weekMinutes: 0,
      weekAmount: 0,
      monthMinutes: 0,
      monthAmount: 0,
    },
  };
  if (!supabaseAdmin) return empty;

  const now = new Date();
  const startOfDay = getBusinessDayStart(now);
  const startOfYesterday = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(startOfDay.getTime() - 6 * 24 * 60 * 60 * 1000);
  const startOfMonth = getBusinessMonthStart(now);
  // أداء الطاولات يعرض الشهر الماضي المكتمل (وليس الشهر الحالي الجاري)، فنحتاج جلب
  // بيانات تسبق بداية الشهر الحالي أيضاً
  const startOfLastMonth = getBusinessMonthStart(new Date(startOfMonth.getTime() - 1));
  const fetchSince = new Date(Math.min(startOfWeek.getTime(), startOfLastMonth.getTime()));

  const [tablesRes, ticketsRes, txRes] = await Promise.all([
    supabaseAdmin.from("billiards_tables").select("games_count, games_count_9ball"),
    supabaseAdmin
      .from("billiards_tickets")
      .select("games_count, games_count_9ball, created_at")
      .gte("created_at", startOfDay.toISOString()),
    supabaseAdmin
      .from("billiards_transactions")
      .select("table_number, games_count, games_count_9ball, amount, paid_at, kind, minutes")
      .gte("paid_at", fetchSince.toISOString()),
  ]);

  const tables = tablesRes.data ?? [];
  const tickets = ticketsRes.data ?? [];
  const transactions = txRes.data ?? [];

  const liveEight = tables.reduce((s, t) => s + t.games_count, 0);
  const liveNine = tables.reduce((s, t) => s + t.games_count_9ball, 0);
  const ticketsEight = tickets.reduce((s, t) => s + t.games_count, 0);
  const ticketsNine = tickets.reduce((s, t) => s + t.games_count_9ball, 0);

  const sumTx = (rows: typeof transactions) => ({
    eight: rows.reduce((s, t) => s + t.games_count, 0),
    nine: rows.reduce((s, t) => s + t.games_count_9ball, 0),
  });
  const sumAmount = (rows: typeof transactions) => rows.reduce((s, t) => s + Number(t.amount), 0);

  // أداء الطاولات للبلياردو وحده: معاملة بلي ستيشن على الجهاز رقم ١ كانت ستُحسب
  // ضمن الطاولة ١ لولا تصفية النوع، فتضخّم أرقام طاولة لم تُلعب
  const isBilliards = (t: { kind?: string | null }) => (t.kind ?? "billiards") === "billiards";
  const isPs = (t: { kind?: string | null }) => t.kind === "playstation";

  const todayTx = transactions.filter((t) => new Date(t.paid_at) >= startOfDay);
  const yesterdayTx = transactions.filter((t) => {
    const d = new Date(t.paid_at);
    return d >= startOfYesterday && d < startOfDay;
  });
  const weekTx = transactions.filter((t) => new Date(t.paid_at) >= startOfWeek);
  const monthTx = transactions.filter((t) => new Date(t.paid_at) >= startOfMonth);
  const lastMonthTx = transactions.filter((t) => {
    const d = new Date(t.paid_at);
    return d >= startOfLastMonth && d < startOfMonth;
  });

  const todayPaid = sumTx(todayTx.filter(isBilliards));
  const weekPaid = sumTx(weekTx.filter(isBilliards));
  const monthPaid = sumTx(monthTx.filter(isBilliards));

  const perTable = [1, 2, 3].map((n) => {
    const tableTx = sumTx(lastMonthTx.filter((t) => isBilliards(t) && t.table_number === n));
    return { table_number: n, eight: tableTx.eight, nine: tableTx.nine };
  });

  const sumMinutes = (rows: typeof transactions) =>
    rows.reduce((s, t) => s + (Number(t.minutes) || 0), 0);
  const psToday = todayTx.filter(isPs);
  const psWeek = weekTx.filter(isPs);
  const psMonth = monthTx.filter(isPs);

  // نضيف كيمات اليوم الحية/المعلّقة (غير المدفوعة بعد) لمجموعي الأسبوع والشهر أيضاً —
  // وإلا يظهر "الأسبوع/الشهر" أقل من "اليوم" بشكل مربك طالما توجد كيمات لم تُدفع بعد،
  // رغم أن اليوم الحالي جزء منهما دائماً
  return {
    today: { eight: liveEight + ticketsEight + todayPaid.eight, nine: liveNine + ticketsNine + todayPaid.nine },
    week: { eight: liveEight + ticketsEight + weekPaid.eight, nine: liveNine + ticketsNine + weekPaid.nine },
    month: { eight: liveEight + ticketsEight + monthPaid.eight, nine: liveNine + ticketsNine + monthPaid.nine },
    todayAmount: sumAmount(todayTx),
    yesterdayAmount: sumAmount(yesterdayTx),
    perTable,
    ps: {
      todayMinutes: sumMinutes(psToday),
      todayAmount: sumAmount(psToday),
      weekMinutes: sumMinutes(psWeek),
      weekAmount: sumAmount(psWeek),
      monthMinutes: sumMinutes(psMonth),
      monthAmount: sumAmount(psMonth),
    },
  };
}

// ═══════════════ البلي ستيشن ═══════════════

export async function getPlaystationDevices(): Promise<PlaystationDeviceRow[] | null> {
  requireBilliardsSession();
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("playstation_devices")
    .select("*")
    .order("device_number", { ascending: true });
  if (error) {
    console.error(error);
    return null;
  }
  return (data ?? []) as PlaystationDeviceRow[];
}

/** بدء اللعب: نُثبّت لحظة البداية بقاعدة البيانات لا بالمتصفح، فيتطابق العدّاد على كل الشاشات */
export async function startPlaystation(deviceNumber: number) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("playstation_devices")
    .update({ started_at: now, updated_at: now })
    .eq("device_number", deviceNumber)
    .is("started_at", null); // لا نعيد ضبط البداية على جلسة شغّالة فنضيّع وقتها
  return signalOnSuccess("billiards", { error: error ? "تعذّر بدء الجلسة" : null });
}

/**
 * إيقاف العدّاد بلا إصدار فاتورة — جلسة نُسي إيقافها ليلة كاملة، أو عدّاد شُغّل
 * بالخطأ. المحاسبة لا تمرّ من هنا: الفاتورة تُصدر بمدة يختارها الموظف
 */
export async function stopPlaystationTimer(deviceNumber: number) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin
    .from("playstation_devices")
    .update({ started_at: null, updated_at: new Date().toISOString() })
    .eq("device_number", deviceNumber);
  return signalOnSuccess("billiards", { error: error ? "تعذّر إيقاف العدّاد" : null });
}

/**
 * تصحيح وقت البداية — يُستعمل حين ينسى الموظف الضغط على «بدء» فيرجّعه للوقت الحقيقي.
 * يُرفض المستقبل لأنه يعطي وقتاً سالباً، ويُرفض ما قبل ٢٤ ساعة لأنه غالباً خطأ تاريخ
 */
export async function setPlaystationStart(deviceNumber: number, startedAtIso: string) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };

  const at = new Date(startedAtIso);
  if (Number.isNaN(at.getTime())) return { error: "وقت غير صحيح" };
  if (at.getTime() > Date.now() + 60_000) return { error: "وقت البداية لا يكون بالمستقبل" };
  if (Date.now() - at.getTime() > 24 * 60 * 60 * 1000) {
    return { error: "وقت البداية أقدم من ٢٤ ساعة — تأكد من التاريخ" };
  }

  const { error } = await supabaseAdmin
    .from("playstation_devices")
    .update({ started_at: at.toISOString(), updated_at: new Date().toISOString() })
    .eq("device_number", deviceNumber);
  return signalOnSuccess("billiards", { error: error ? "تعذّر تعديل وقت البداية" : null });
}

export async function updatePlaystationCustomerRef(deviceNumber: number, customerRef: string) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin
    .from("playstation_devices")
    .update({ customer_ref: customerRef.trim() || null })
    .eq("device_number", deviceNumber);
  return signalOnSuccess("billiards", { error: error ? "حدث خطأ أثناء الحفظ" : null });
}

/**
 * فاتورة البلي بمدة يختارها الموظف — عند الإنهاء يثبّت المدة («لعب ساعة» بدل ٦٣
 * دقيقة)، وللجلسة التي نُسي تشغيل عدّادها يسجّلها ويرحّلها مباشرة بلا عدّاد.
 *
 * المدة لا تُؤخذ كما جاءت: تُحقَّق هنا أنها مضاعف ربع ساعة ضمن سقف، فلا يرسل
 * المتصفح مبلغاً ولا مدة اعتباطية. والفاتورة تُنشأ قبل إيقاف الجهاز، فإن فشلت بقيت
 * الجلسة شغّالة بدل أن يضيع وقتها
 */
export async function billPlaystationFixed(deviceNumber: number, minutes: number) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };

  const safe = Math.floor(Number(minutes));
  if (!Number.isFinite(safe) || safe < PS_MINUTES_PER_QUARTER) {
    return { error: "أقل مدة ربع ساعة" };
  }
  if (safe % PS_MINUTES_PER_QUARTER !== 0) return { error: "المدة بمضاعفات ربع الساعة" };
  if (safe > PS_MAX_SESSION_MINUTES) return { error: "المدة أطول من المسموح بفاتورة واحدة" };

  const { data: device, error: fetchError } = await supabaseAdmin
    .from("playstation_devices")
    .select("started_at, customer_ref")
    .eq("device_number", deviceNumber)
    .single();
  if (fetchError || !device) return { error: "تعذّر إيجاد الجهاز" };

  const amount = computePlaystationAmount(safe);

  const { error: ticketError } = await supabaseAdmin.from("billiards_tickets").insert({
    kind: "playstation",
    table_number: deviceNumber,
    games_count: 0,
    games_count_9ball: 0,
    minutes: safe,
    amount,
    customer_ref: device.customer_ref,
  });
  if (ticketError) {
    console.error(ticketError);
    return { error: "حدث خطأ أثناء إنشاء الفاتورة — الجهاز ما زال شغّالاً" };
  }

  const { error } = await supabaseAdmin
    .from("playstation_devices")
    .update({ started_at: null, customer_ref: null, updated_at: new Date().toISOString() })
    .eq("device_number", deviceNumber);
  if (error) console.error(error);
  return signalOnSuccess("billiards", {
    error: error ? "صدرت الفاتورة لكن تعذّر إيقاف الجهاز" : null,
  });
}

export async function getNotes(): Promise<BilliardsNoteRow[] | null> {
  requireBilliardsSession();
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("billiards_notes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return null;
  }
  return (data ?? []) as BilliardsNoteRow[];
}

export async function addNote(text: string) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const trimmed = text.trim();
  if (!trimmed) return { error: null };
  const { error } = await supabaseAdmin.from("billiards_notes").insert({ text: trimmed });
  return signalOnSuccess("billiards", { error: error ? "حدث خطأ أثناء إضافة الملاحظة" : null });
}

export async function deleteNote(noteId: string) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin.from("billiards_notes").delete().eq("id", noteId);
  return signalOnSuccess("billiards", { error: error ? "حدث خطأ أثناء حذف الملاحظة" : null });
}
