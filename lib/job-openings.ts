import { supabase } from "./supabase";

export type PositionKey =
  | "management"
  | "floorCaptain"
  | "barista"
  | "waiter"
  | "cashier"
  | "shishaMaster"
  | "billiardsStaff"
  | "cleaner"
  | "other";

export const POSITION_KEYS: PositionKey[] = [
  "management",
  "floorCaptain",
  "barista",
  "waiter",
  "cashier",
  "shishaMaster",
  "billiardsStaff",
  "cleaner",
  "other",
];

export type JobOpening = {
  id: string;
  positionKey: PositionKey;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
};

// تُستخدم لحد ما يتم ضبط جدول job_openings بـ Supabase (شوف PROJECT_PLAN.md)
// بعد الإعداد، تصير القائمة تُدار بالكامل من لوحة التحكم بدون أي تعديل بالكود
export const FALLBACK_JOB_OPENINGS: JobOpening[] = [
  {
    id: "billiards-staff-seed",
    positionKey: "billiardsStaff",
    title: { ar: "موظف صالة بلياردو", en: "Billiards Hall Staff" },
    description: {
      ar: "يجيد إدارة الطاولات وتنظيم الحجوزات، مع أسلوب لبق وحسن التعامل مع الزبائن. لديه معرفة تامة بقواعد لعبة البلياردو.",
      en: "Skilled in managing billiards tables and organizing reservations, with a polished manner and excellent customer service. Has thorough knowledge of the rules of billiards.",
    },
  },
];

export async function fetchJobOpenings(): Promise<JobOpening[]> {
  if (!supabase) return FALLBACK_JOB_OPENINGS;

  const { data, error } = await supabase
    .from("job_openings")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data) return FALLBACK_JOB_OPENINGS;

  return data.map((row) => ({
    id: row.id,
    positionKey: row.position_key,
    title: { ar: row.title_ar, en: row.title_en },
    description: { ar: row.description_ar, en: row.description_en },
  }));
}
