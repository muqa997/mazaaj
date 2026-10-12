import { supabaseAdmin } from "@/lib/supabase-admin";
import type { TournamentRow } from "@/lib/tournaments";

// قراءات البطولة من جهة الخادم فقط. جدولا البطولة محميان بـ RLS بلا سياسات عامة (لأن
// فيهما أرقام هواتف المشتركين)، فلا يصلهما مفتاح anon إطلاقاً — كل القراءات هنا تمرّ
// بمفتاح الخدمة من مكوّنات خادمية (الصفحة الرئيسية وصفحة البطولة)

// البطولة المعروضة حالياً: المفعّلة الأقرب موعداً. لو فعّل المدير أكثر من واحدة سهواً
// نعرض الأحدث إنشاءً، فلا تختفي الصفحة ولا تعرض بطولة قديمة
export async function getActiveTournament(): Promise<TournamentRow | null> {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from("card_tournaments")
    .select("*")
    .eq("is_active", true)
    .order("starts_at", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error(error);
    return null;
  }
  return (data?.[0] as TournamentRow) ?? null;
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
