import { supabaseAdmin } from "@/lib/supabase-admin";
import { pickLiveTournament, type TournamentRow } from "@/lib/tournaments";

// قراءات البطولة من جهة الخادم فقط. جدولا البطولة محميان بـ RLS بلا سياسات عامة (لأن
// فيهما أرقام هواتف المشتركين)، فلا يصلهما مفتاح anon إطلاقاً — كل القراءات هنا تمرّ
// بمفتاح الخدمة من مكوّنات خادمية (الصفحة الرئيسية وصفحة البطولة)

// نجلب كل البطولات (عددها بالعشرات على الأكثر) ثم نختار بـ pickLiveTournament — وهي
// نفس الدالة التي تستخدمها لوحة التحكم لتحديد "المعروضة الآن". الفرز بـSQL كان يضمن
// اختلافاً صامتاً بين ما يعرضه الموقع وما تظنه اللوحة
export async function getActiveTournament(): Promise<TournamentRow | null> {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin.from("card_tournaments").select("*");

  if (error) {
    console.error(error);
    return null;
  }
  return pickLiveTournament((data ?? []) as TournamentRow[]);
}

export async function getTournamentTeamCount(tournamentId: string): Promise<number> {
  if (!supabaseAdmin) return 0;

  const { count, error } = await supabaseAdmin
    .from("card_tournament_teams")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);

  if (error) {
    console.error(error);
    return 0;
  }
  return count ?? 0;
}
