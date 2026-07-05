import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// عميل بصلاحيات كاملة (يتجاوز RLS) — يُستخدم فقط داخل Server Actions بلوحة التحكم
// "server-only" يمنع أي استيراد خاطئ لهذا الملف من كود يشتغل بالمتصفح
export const supabaseAdmin =
  url && serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false } })
    : null;
