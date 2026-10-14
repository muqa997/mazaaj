import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// عميل بصلاحيات كاملة (يتجاوز RLS) — يُستخدم فقط داخل كود الخادم
// "server-only" يمنع أي استيراد خاطئ لهذا الملف من كود يشتغل بالمتصفح
//
// cache: "no-store" إلزامي: Next يعترض دالة fetch ويُخزّن ردودها، ومكتبة Supabase
// تقرأ عبر fetch — فكانت الصفحات تُصيَّر ببيانات قديمة من ذاكرة Next لا من قاعدة
// البيانات (عدد فرق قديم، بل وبطولة محذوفة ما زالت تظهر). لوحة التحكم كانت سليمة
// لأن Server Actions لا تمرّ بذاكرة الـfetch أصلاً. لا يصحّ تخزين قراءات هذا العميل:
// كلها بيانات حيّة (طلبات، طاولات، مشتركون)
export const supabaseAdmin =
  url && serviceKey
    ? createClient(url, serviceKey, {
        auth: { persistSession: false },
        global: {
          fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
        },
      })
    : null;
