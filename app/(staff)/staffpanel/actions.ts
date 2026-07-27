"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  STAFF_COOKIE_NAME,
  createStaffSessionToken,
  verifyStaffSessionToken,
} from "@/lib/staff-session";
import type { OrderRow, OrderStatus } from "@/lib/orders";
import type { BilliardsTableRow, BilliardsTicketRow } from "@/lib/billiards";

export type { OrderRow, OrderStatus };
export type { BilliardsTableRow, BilliardsTicketRow };

export async function staffLogin(code: string): Promise<{ success: boolean }> {
  const expected = process.env.STAFF_ACCESS_CODE;
  if (!expected || code !== expected) {
    return { success: false };
  }

  const { value, maxAge } = createStaffSessionToken();
  cookies().set(STAFF_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  return { success: true };
}

export async function staffLogout() {
  cookies().delete(STAFF_COOKIE_NAME);
}

// يمدّد الجلسة 3 أيام إضافية من آخر استخدام فعلي للصفحة (يُستدعى من الواجهة عند فتحها)
export async function refreshStaffSession() {
  const token = cookies().get(STAFF_COOKIE_NAME)?.value;
  if (!verifyStaffSessionToken(token)) return;

  const { value, maxAge } = createStaffSessionToken();
  cookies().set(STAFF_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

function requireStaffSession() {
  const token = cookies().get(STAFF_COOKIE_NAME)?.value;
  if (!verifyStaffSessionToken(token)) {
    throw new Error("Unauthorized");
  }
}

function toArabicError(error: { message: string } | null): string | null {
  if (!error) return null;
  const msg = error.message.toLowerCase();

  if (msg.includes("could not find the table") || msg.includes("schema cache")) {
    return "الجدول غير موجود بعد بقاعدة البيانات.";
  }
  return "حدث خطأ أثناء الحفظ، الرجاء المحاولة مرة أخرى.";
}

export async function getStaffOrders(): Promise<OrderRow[]> {
  requireStaffSession();
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

export async function updateStaffOrderStatus(id: string, status: OrderStatus) {
  requireStaffSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin.from("orders").update({ status }).eq("id", id);
  return { error: toArabicError(error) };
}

export async function deleteStaffOrder(id: string) {
  requireStaffSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin.from("orders").delete().eq("id", id);
  return { error: toArabicError(error) };
}

// يعرض حساب طاولات البلياردو الحي للكاشير — للعلم فقط، بدون أي إمكانية تعديل أو دفع
// من هنا (الطاولة الحية تخص موظف البلياردو فقط؛ الدفع يتم حصراً عبر التذاكر أدناه)
export async function getStaffBilliardsTables(): Promise<BilliardsTableRow[]> {
  requireStaffSession();
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

// التذاكر المعلّقة التي أرسلها موظف البلياردو (بعد إنهاء جلسة زبون) بانتظار الدفع —
// هذا هو المكان الوحيد الذي يتم فيه تحصيل مبلغ البلياردو فعلياً
export async function getStaffPendingTickets(): Promise<BilliardsTicketRow[]> {
  requireStaffSession();
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

export async function payTicket(ticketId: string) {
  requireStaffSession();
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
    amount: ticket.amount,
    collected_by: "cashier",
    customer_ref: ticket.customer_ref,
    session_ended_at: ticket.created_at,
  });
  if (txError) return { error: "حدث خطأ أثناء تسجيل الدفعة" };

  const { error } = await supabaseAdmin.from("billiards_tickets").delete().eq("id", ticketId);
  return { error: error ? "حدث خطأ أثناء إزالة التذكرة" : null };
}

// إلغاء تذكرة معلّقة بالغلط (خطأ برقم الطاولة أو إرسال مكرر) — تُحذف بدون تسجيل أي دفعة
export async function cancelTicket(ticketId: string) {
  requireStaffSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin.from("billiards_tickets").delete().eq("id", ticketId);
  return { error: error ? "حدث خطأ أثناء إلغاء التذكرة" : null };
}

// مجموع ما حصّله الكاشير نفسه اليوم من حسابات البلياردو (بدون ما حصّله موظف البلياردو
// مباشرة) — يظهر بصفحة الكاشير كإحصائية مستقلة عن جلسة موظف البلياردو
export async function getStaffBilliardsTodayTotal(): Promise<{ games: number; amount: number }> {
  requireStaffSession();
  if (!supabaseAdmin) return { games: 0, amount: 0 };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await supabaseAdmin
    .from("billiards_transactions")
    .select("games_count, amount")
    .eq("collected_by", "cashier")
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
