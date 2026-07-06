"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ADMIN_COOKIE_NAME, createSessionToken, verifySessionToken } from "@/lib/admin-session";

export async function login(code: string): Promise<{ success: boolean }> {
  const expected = process.env.ADMIN_ACCESS_CODE;
  if (!expected || code !== expected) {
    return { success: false };
  }

  const { value, maxAge } = createSessionToken();
  cookies().set(ADMIN_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  return { success: true };
}

export async function logout() {
  cookies().delete(ADMIN_COOKIE_NAME);
}

// يمدّد الجلسة 3 أيام إضافية من آخر استخدام فعلي للوحة (يُستدعى من الواجهة عند فتحها)
export async function refreshSession() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) return;

  const { value, maxAge } = createSessionToken();
  cookies().set(ADMIN_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

function requireSession() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!verifySessionToken(token)) {
    throw new Error("Unauthorized");
  }
}

// يحوّل رسالة خطأ Supabase الخام (بالإنجليزية) إلى رسالة عربية مفهومة —
// لوحة التحكم بالكامل بالعربية، فلا تظهر أي رسالة تقنية بالإنجليزية للمستخدم
function toArabicError(error: { message: string } | null): string | null {
  if (!error) return null;
  const msg = error.message.toLowerCase();

  if (msg.includes("could not find the table") || msg.includes("schema cache")) {
    return "الجدول غير موجود بعد بقاعدة البيانات. الرجاء تشغيل ملف supabase/schema.sql بمحرر SQL بمشروع Supabase.";
  }
  if (msg.includes("duplicate key") || msg.includes("already exists")) {
    return "هذا الرمز مستخدم مسبقاً، الرجاء اختيار رمز آخر.";
  }
  return "حدث خطأ أثناء الحفظ، الرجاء المحاولة مرة أخرى.";
}

export type OrderRow = {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  notes: string | null;
  items: { name: string; price: number; qty: number }[];
  total: number;
  status: string;
  created_at: string;
};

export async function getOrders(): Promise<OrderRow[]> {
  requireSession();
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

export type OrderStatus = "new" | "confirmed" | "delivered" | "cancelled";

export async function updateOrderStatus(id: string, status: OrderStatus) {
  requireSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin.from("orders").update({ status }).eq("id", id);
  return { error: toArabicError(error) };
}

export async function deleteOrder(id: string) {
  requireSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin.from("orders").delete().eq("id", id);
  return { error: toArabicError(error) };
}

export type ApplicantRow = {
  id: string;
  name: string;
  phone: string;
  position: string;
  notes: string | null;
  cv_url: string | null;
  created_at: string;
};

export async function getApplicants(): Promise<ApplicantRow[]> {
  requireSession();
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("job_applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

export type JobOpeningRow = {
  id: string;
  position_key: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  is_active: boolean;
  created_at: string;
};

export async function getAdminJobOpenings(): Promise<JobOpeningRow[]> {
  requireSession();
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("job_openings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

export type JobOpeningInput = {
  position_key: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
};

export async function createJobOpening(input: JobOpeningInput) {
  requireSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin.from("job_openings").insert(input);
  return { error: toArabicError(error) };
}

export async function updateJobOpening(
  id: string,
  patch: Partial<JobOpeningInput & { is_active: boolean }>
) {
  requireSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin.from("job_openings").update(patch).eq("id", id);
  return { error: toArabicError(error) };
}

export async function deleteJobOpening(id: string) {
  requireSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin.from("job_openings").delete().eq("id", id);
  return { error: toArabicError(error) };
}

export type SuggestionRow = {
  id: string;
  type: string;
  message: string;
  created_at: string;
};

export async function getSuggestions(): Promise<SuggestionRow[]> {
  requireSession();
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("suggestions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

export type CouponDiscountType = "fixed" | "percentage";

export type CouponRow = {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  created_at: string;
};

export type CouponInput = {
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
};

export async function getCoupons(): Promise<CouponRow[]> {
  requireSession();
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

// نطبّع رمز الكوبون بأحرف كبيرة دائماً، حتى يقبل الإدخال بأي حالة أحرف (كبيرة/صغيرة)
// ويبقى التحقق منه لاحقاً موحّداً بلا تكرار لنفس الرمز بحالات مختلفة
function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

export async function createCoupon(input: CouponInput) {
  requireSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin
    .from("coupons")
    .insert({ ...input, code: normalizeCouponCode(input.code) });
  return { error: toArabicError(error) };
}

export async function updateCoupon(id: string, input: CouponInput) {
  requireSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin
    .from("coupons")
    .update({ ...input, code: normalizeCouponCode(input.code) })
    .eq("id", id);
  return { error: toArabicError(error) };
}

export async function deleteCoupon(id: string) {
  requireSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin.from("coupons").delete().eq("id", id);
  return { error: toArabicError(error) };
}

export type AnnouncementRow = {
  id: string;
  position: number;
  text_ar: string;
  text_en: string;
};

export async function getAnnouncements(): Promise<AnnouncementRow[]> {
  requireSession();
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin
    .from("announcements")
    .select("id, position, text_ar, text_en")
    .order("position", { ascending: true });
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

export async function updateAnnouncement(
  id: string,
  input: { text_ar: string; text_en: string }
) {
  requireSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin.from("announcements").update(input).eq("id", id);
  return { error: toArabicError(error) };
}
