import { supabaseAdmin } from "@/lib/supabase-admin";
import { listLiveTournaments, type TournamentRow } from "@/lib/tournaments";

// قراءات البطولة من جهة الخادم فقط. جدولا البطولة محميان بـ RLS بلا سياسات عامة (لأن
// فيهما أرقام هواتف المشتركين)، فلا يصلهما مفتاح anon إطلاقاً — كل القراءات هنا تمرّ
// بمفتاح الخدمة من مكوّنات خادمية (الصفحة الرئيسية وصفحة البطولة)

// نجلب كل البطولات (عددها بالعشرات على الأكثر) ثم نُرشّح بـ listLiveTournaments — وهي
// نفس الدالة التي تستخدمها لوحة التحكم. الفرز بـSQL كان يُنتج اختلافاً صامتاً بين ما
// يعرضه الموقع وما تظنه اللوحة
export async function getLiveTournaments(): Promise<TournamentRow[]> {
  if (!supabaseAdmin) return [];

  const { data, error } = await supabaseAdmin.from("card_tournaments").select("*");

  if (error) {
    console.error(error);
    return [];
  }
  return listLiveTournaments((data ?? []) as TournamentRow[]);
}

export async function getTournamentById(id: string): Promise<TournamentRow | null> {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from("card_tournaments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }
  return (data as TournamentRow) ?? null;
}

/** عدد الفرق لكل بطولة بطلب واحد، فلا نضرب قاعدة البيانات مرة لكل بطولة */
export async function getTeamCounts(tournamentIds: string[]): Promise<Record<string, number>> {
  if (!supabaseAdmin || tournamentIds.length === 0) return {};

  const { data, error } = await supabaseAdmin
    .from("card_tournament_teams")
    .select("tournament_id")
    .in("tournament_id", tournamentIds);

  if (error) {
    console.error(error);
    return {};
  }

  const counts: Record<string, number> = Object.fromEntries(tournamentIds.map((id) => [id, 0]));
  for (const row of data ?? []) {
    counts[(row as { tournament_id: string }).tournament_id] += 1;
  }
  return counts;
}
