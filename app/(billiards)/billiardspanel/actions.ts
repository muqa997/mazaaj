"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  BILLIARDS_COOKIE_NAME,
  createBilliardsSessionToken,
  verifyBilliardsSessionToken,
} from "@/lib/billiards-session";
import { GAME_PRICE, type BilliardsTableRow } from "@/lib/billiards";

export type { BilliardsTableRow };

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

// مجموع ألعاب ومبالغ اليوم المُحصَّلة فعلياً (معاملات مدفوعة فقط) — تُجمع بالواجهة
// مع عدد الألعاب الحالي غير المدفوع بالطاولات الثلاث لعرض "مجموع الألعاب" الكامل
export async function getTodayPaidSummary(): Promise<{ games: number; amount: number }> {
  requireBilliardsSession();
  if (!supabaseAdmin) return { games: 0, amount: 0 };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabaseAdmin
    .from("billiards_transactions")
    .select("games_count, amount")
    .gte("paid_at", startOfDay.toISOString());
  if (error) {
    console.error(error);
    return { games: 0, amount: 0 };
  }

  return (data ?? []).reduce(
    (acc, row) => ({
      games: acc.games + row.games_count,
      amount: acc.amount + Number(row.amount),
    }),
    { games: 0, amount: 0 }
  );
}

export async function payAndReset(tableNumber: number) {
  requireBilliardsSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { data, error: fetchError } = await supabaseAdmin
    .from("billiards_tables")
    .select("games_count")
    .eq("table_number", tableNumber)
    .single();
  if (fetchError || !data) return { error: "تعذّر إيجاد الطاولة" };
  if (data.games_count === 0) return { error: null };

  const { error: txError } = await supabaseAdmin.from("billiards_transactions").insert({
    table_number: tableNumber,
    games_count: data.games_count,
    amount: data.games_count * GAME_PRICE,
  });
  if (txError) return { error: "حدث خطأ أثناء تسجيل الدفعة" };

  const { error } = await supabaseAdmin
    .from("billiards_tables")
    .update({ games_count: 0, updated_at: new Date().toISOString() })
    .eq("table_number", tableNumber);
  return { error: error ? "حدث خطأ أثناء التصفير" : null };
}
