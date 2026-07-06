"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  STAFF_COOKIE_NAME,
  createStaffSessionToken,
  verifyStaffSessionToken,
} from "@/lib/staff-session";
import type { OrderRow, OrderStatus } from "@/lib/orders";

export type { OrderRow, OrderStatus };

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
