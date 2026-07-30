"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  BILLIARDS_COOKIE_NAME,
  createBilliardsSessionToken,
  verifyBilliardsSessionToken,
} from "@/lib/billiards-session";
import {
  computePoolAmount,
  type BilliardsTableRow,
  type BilliardsTicketRow,
  type BilliardsNoteRow,
  type BilliardsTransactionRow,
} from "@/lib/billiards";

export type { BilliardsTableRow, BilliardsTicketRow, BilliardsNoteRow, BilliardsTransactionRow };

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

export async function getBilliardsTables(): Promise<BilliardsTableRow[]> {
  requireBilliardsSession();
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("billiards_tables")
    .select("*")
    .order("table_number", { ascending: true });
  if (error) {
    console.error(error);
    return [];
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
  return { error: error ? "حدث خطأ أثناء الحفظ" : null };
}

// يُحفظ اسم/رقم طاولة الزبون فور الكتابة (وليس فقط عند إنهاء الجلسة) ليظهر حياً عند الكاشير
export async function updateCustomerRef(tableNumber: number, customerRef: string) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin
    .from("billiards_tables")
    .update({ customer_ref: customerRef.trim() || null })
    .eq("table_number", tableNumber);
  return { error: error ? "حدث خطأ أثناء الحفظ" : null };
}

// إنهاء الجلسة: يفصل كيمات الطاولة الحالية (٨ بول و٩ بول معاً) عن عداد الطاولة الحي
// في "تذكرة" مستقلة بانتظار الدفع — وتُصفَّر الطاولة فوراً لتصبح جاهزة لزبون جديد
// بدون انتظار الدفع. المسار الوحيد لإنهاء الجلسة سواء دفع الزبون فوراً أو تأخر —
// فالموظف يدفع التذكرة بنفسه من قائمة "الفواتير المعلّقة" (payTicket بالأسفل) في
// الحالتين معاً
export async function endSession(tableNumber: number, customerRef: string) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { data, error: fetchError } = await supabaseAdmin
    .from("billiards_tables")
    .select("games_count, games_count_9ball")
    .eq("table_number", tableNumber)
    .single();
  if (fetchError || !data) return { error: "تعذّر إيجاد الطاولة" };
  if (data.games_count === 0 && data.games_count_9ball === 0) return { error: null };

  const { error: ticketError } = await supabaseAdmin.from("billiards_tickets").insert({
    table_number: tableNumber,
    games_count: data.games_count,
    games_count_9ball: data.games_count_9ball,
    amount: computePoolAmount(data.games_count, data.games_count_9ball),
    customer_ref: customerRef.trim() || null,
  });
  if (ticketError) return { error: "حدث خطأ أثناء إنشاء التذكرة" };

  const { error } = await supabaseAdmin
    .from("billiards_tables")
    .update({
      games_count: 0,
      games_count_9ball: 0,
      customer_ref: null,
      updated_at: new Date().toISOString(),
    })
    .eq("table_number", tableNumber);
  return { error: error ? "حدث خطأ أثناء التصفير" : null };
}

// التذاكر المعلّقة التي أنشأها الموظف بإنهاء الجلسة ولم يدفعها بعد — يدفعها بنفسه
// من هذه القائمة عبر payTicket فوراً أو لاحقاً
export async function getPendingTickets(): Promise<BilliardsTicketRow[]> {
  requireBilliardsSession();
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("billiards_tickets")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []) as BilliardsTicketRow[];
}

// الموظف يدفع فاتورة معلّقة بنفسه (سواء دفعها الزبون فوراً بعد إنهاء الجلسة أو تأخر
// بالدفع) — يسجّل معاملة collected_by='billiards' ويحذف التذكرة
export async function payTicket(ticketId: string) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { data: ticket, error: fetchError } = await supabaseAdmin
    .from("billiards_tickets")
    .select("*")
    .eq("id", ticketId)
    .single();
  if (fetchError || !ticket) return { error: "تعذّر إيجاد التذكرة" };

  const { error: txError } = await supabaseAdmin.from("billiards_transactions").insert({
    table_number: ticket.table_number,
    games_count: ticket.games_count,
    games_count_9ball: ticket.games_count_9ball,
    amount: ticket.amount,
    collected_by: "billiards",
    customer_ref: ticket.customer_ref,
    session_ended_at: ticket.created_at,
  });
  if (txError) return { error: "حدث خطأ أثناء تسجيل الدفعة" };

  const { error } = await supabaseAdmin.from("billiards_tickets").delete().eq("id", ticketId);
  return { error: error ? "حدث خطأ أثناء إزالة التذكرة" : null };
}

// إلغاء تذكرة معلّقة بالغلط (خطأ برقم الطاولة أو إرسال مكرر) — تُحذف بدون تسجيل أي دفعة
export async function cancelTicket(ticketId: string) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin.from("billiards_tickets").delete().eq("id", ticketId);
  return { error: error ? "حدث خطأ أثناء إلغاء التذكرة" : null };
}

// حالة نادرة: زبون نزل مباشرة وحاسبه الكاشير بدون علم الموظف — المبلغ يبقى بحوزة
// الكاشير حتى يستلمه الموظف منه فعلياً ويؤكد ذلك بزر واحد (confirmCashierHandover)
export async function getCashierHandoverPending(): Promise<BilliardsTransactionRow[]> {
  requireBilliardsSession();
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("billiards_transactions")
    .select("*")
    .eq("collected_by", "cashier")
    .is("handed_over_at", null)
    .order("paid_at", { ascending: true });
  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []) as BilliardsTransactionRow[];
}

// الموظف يؤكد استلامه دفعة واحدة كل ما جمعه الكاشير من الزبائن الذين نزلوا مباشرة —
// تأكيد جماعي بضغطة واحدة (لا حاجة لتأكيد كل معاملة على حدة بما أنها حالة نادرة)
export async function confirmCashierHandover() {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin
    .from("billiards_transactions")
    .update({ handed_over_at: new Date().toISOString() })
    .eq("collected_by", "cashier")
    .is("handed_over_at", null);
  return { error: error ? "حدث خطأ أثناء تأكيد الاستلام" : null };
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
  perTable: { table_number: number; eight: number; nine: number }[];
  todayIncomeAmount: number;
}> {
  requireBilliardsSession();
  const empty = {
    today: { eight: 0, nine: 0 },
    week: { eight: 0, nine: 0 },
    month: { eight: 0, nine: 0 },
    perTable: [1, 2, 3].map((n) => ({ table_number: n, eight: 0, nine: 0 })),
    todayIncomeAmount: 0,
  };
  if (!supabaseAdmin) return empty;

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const fetchSince = new Date(now);
  fetchSince.setDate(fetchSince.getDate() - 35);

  const [tablesRes, ticketsRes, txRes] = await Promise.all([
    supabaseAdmin.from("billiards_tables").select("games_count, games_count_9ball"),
    supabaseAdmin
      .from("billiards_tickets")
      .select("games_count, games_count_9ball, created_at")
      .gte("created_at", startOfDay.toISOString()),
    supabaseAdmin
      .from("billiards_transactions")
      .select("table_number, games_count, games_count_9ball, paid_at, collected_by, amount")
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

  const todayTx = transactions.filter((t) => new Date(t.paid_at) >= startOfDay);
  const weekTx = transactions.filter((t) => new Date(t.paid_at) >= startOfWeek);
  const monthTx = transactions.filter((t) => new Date(t.paid_at) >= startOfMonth);

  const todayPaid = sumTx(todayTx);
  const weekPaid = sumTx(weekTx);
  const monthPaid = sumTx(monthTx);

  const perTable = [1, 2, 3].map((n) => {
    const tableTx = sumTx(monthTx.filter((t) => t.table_number === n));
    return { table_number: n, eight: tableTx.eight, nine: tableTx.nine };
  });

  // الدخل الذي حصّله الموظف بنفسه اليوم (استلمه فعلياً من الزبون عبر دفع فاتورة) —
  // يستثني ما حصّله الكاشير حتى لو استلمه الموظف منه لاحقاً، فذاك يظهر منفصلاً بالواجهة
  const todayIncomeAmount = todayTx
    .filter((t) => t.collected_by === "billiards")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    today: { eight: liveEight + ticketsEight + todayPaid.eight, nine: liveNine + ticketsNine + todayPaid.nine },
    week: { eight: weekPaid.eight, nine: weekPaid.nine },
    month: { eight: monthPaid.eight, nine: monthPaid.nine },
    perTable,
    todayIncomeAmount,
  };
}

export async function getNotes(): Promise<BilliardsNoteRow[]> {
  requireBilliardsSession();
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("billiards_notes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return (data ?? []) as BilliardsNoteRow[];
}

export async function addNote(text: string) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const trimmed = text.trim();
  if (!trimmed) return { error: null };
  const { error } = await supabaseAdmin.from("billiards_notes").insert({ text: trimmed });
  return { error: error ? "حدث خطأ أثناء إضافة الملاحظة" : null };
}

export async function deleteNote(noteId: string) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin.from("billiards_notes").delete().eq("id", noteId);
  return { error: error ? "حدث خطأ أثناء حذف الملاحظة" : null };
}
