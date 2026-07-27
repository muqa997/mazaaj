"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  BILLIARDS_COOKIE_NAME,
  createBilliardsSessionToken,
  verifyBilliardsSessionToken,
} from "@/lib/billiards-session";
import { GAME_PRICE, type BilliardsTableRow, type BilliardsTicketRow } from "@/lib/billiards";

export type { BilliardsTableRow, BilliardsTicketRow };

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

export async function addGame(tableNumber: number) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { data, error: fetchError } = await supabaseAdmin
    .from("billiards_tables")
    .select("games_count")
    .eq("table_number", tableNumber)
    .single();
  if (fetchError || !data) return { error: "تعذّر إيجاد الطاولة" };

  const { error } = await supabaseAdmin
    .from("billiards_tables")
    .update({ games_count: data.games_count + 1, updated_at: new Date().toISOString() })
    .eq("table_number", tableNumber);
  return { error: error ? "حدث خطأ أثناء الحفظ" : null };
}

export async function removeGame(tableNumber: number) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { data, error: fetchError } = await supabaseAdmin
    .from("billiards_tables")
    .select("games_count")
    .eq("table_number", tableNumber)
    .single();
  if (fetchError || !data) return { error: "تعذّر إيجاد الطاولة" };

  const newCount = Math.max(0, data.games_count - 1);
  const { error } = await supabaseAdmin
    .from("billiards_tables")
    .update({ games_count: newCount, updated_at: new Date().toISOString() })
    .eq("table_number", tableNumber);
  return { error: error ? "حدث خطأ أثناء الحفظ" : null };
}

// مجموع كيمات ومبالغ اليوم المُحصَّلة فعلياً (معاملات مدفوعة فقط)، مقسّمة حسب من حصّلها —
// موظف البلياردو مباشرة أم الكاشير — حتى يعرف موظف البلياردو أن زبوناً حاسب عند الكاشير
export async function getTodayPaidSummary(): Promise<{
  billiards: { games: number; amount: number };
  cashier: { games: number; amount: number };
}> {
  requireBilliardsSession();
  const empty = { billiards: { games: 0, amount: 0 }, cashier: { games: 0, amount: 0 } };
  if (!supabaseAdmin) return empty;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabaseAdmin
    .from("billiards_transactions")
    .select("games_count, amount, collected_by")
    .gte("paid_at", startOfDay.toISOString());
  if (error) {
    console.error(error);
    return empty;
  }

  return (data ?? []).reduce((acc, row) => {
    const bucket = row.collected_by === "cashier" ? "cashier" : "billiards";
    acc[bucket].games += row.games_count;
    acc[bucket].amount += Number(row.amount);
    return acc;
  }, empty);
}

// إنهاء جلسة زبون: يفصل كيماته الحالية عن عداد الطاولة الحي في "تذكرة" مستقلة بانتظار
// الدفع عند الكاشير حصراً — وتُصفَّر الطاولة فوراً لتصبح جاهزة لزبون جديد بدون انتظار
// الدفع، حتى لو الزبون السابق ما غادر الطابق فعلياً بعد (يمنع تداخل كيمات زبونين بنفس
// الطاولة). مرجع الزبون (اسم أو رقم طاولة الجلوس) اختياري ليعرف الكاشير لمن تعود التذكرة
export async function endSession(tableNumber: number, customerRef: string) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { data, error: fetchError } = await supabaseAdmin
    .from("billiards_tables")
    .select("games_count")
    .eq("table_number", tableNumber)
    .single();
  if (fetchError || !data) return { error: "تعذّر إيجاد الطاولة" };
  if (data.games_count === 0) return { error: null };

  const { error: ticketError } = await supabaseAdmin.from("billiards_tickets").insert({
    table_number: tableNumber,
    games_count: data.games_count,
    amount: data.games_count * GAME_PRICE,
    customer_ref: customerRef.trim() || null,
  });
  if (ticketError) return { error: "حدث خطأ أثناء إنشاء التذكرة" };

  const { error } = await supabaseAdmin
    .from("billiards_tables")
    .update({ games_count: 0, updated_at: new Date().toISOString() })
    .eq("table_number", tableNumber);
  return { error: error ? "حدث خطأ أثناء التصفير" : null };
}

// التذاكر المعلّقة التي أرسلها موظف البلياردو ولم يدفعها الكاشير بعد — يعرضها موظف
// البلياردو كمرجع لمعرفة ما هو بانتظار الدفع فعلاً
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
