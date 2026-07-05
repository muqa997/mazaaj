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
  return { error: error?.message ?? null };
}

export async function updateJobOpening(
  id: string,
  patch: Partial<JobOpeningInput & { is_active: boolean }>
) {
  requireSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin.from("job_openings").update(patch).eq("id", id);
  return { error: error?.message ?? null };
}

export async function deleteJobOpening(id: string) {
  requireSession();
  if (!supabaseAdmin) return { error: "Supabase غير مربوط بعد" };
  const { error } = await supabaseAdmin.from("job_openings").delete().eq("id", id);
  return { error: error?.message ?? null };
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
