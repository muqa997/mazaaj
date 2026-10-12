"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeIraqiPhone, type TeamInput } from "@/lib/tournaments";

// تسجيل فريق ببطولة — متاح للعموم بلا تسجيل دخول، لذلك كل التحققات هنا بجهة الخادم
// ولا يُعتمد على أي تحقق بالواجهة (المهلة، الحد الأقصى، صحة الرقم) لأنها قابلة للتجاوز
export async function registerTeam(
  tournamentId: string,
  input: TeamInput
): Promise<{ error: string | null }> {
  if (!supabaseAdmin) return { error: "التسجيل غير متاح حالياً، حاول لاحقاً" };

  const player1 = input.player1_name.trim();
  const player2 = input.player2_name.trim();

  if (!player1 || !player2) {
    return { error: "الرجاء كتابة اسمي اللاعبين" };
  }

  const phone = normalizeIraqiPhone(input.phone);
  if (!phone) {
    return { error: "رقم الموبايل غير صحيح — اكتبه بصيغة 07XXXXXXXXX" };
  }

  const { data: tournament, error: tournamentError } = await supabaseAdmin
    .from("card_tournaments")
    .select("id, registration_closes_at, max_teams, is_active")
    .eq("id", tournamentId)
    .single();

  if (tournamentError || !tournament) return { error: "البطولة غير موجودة" };
  if (!tournament.is_active) return { error: "التسجيل مغلق بهذه البطولة" };
  if (new Date(tournament.registration_closes_at) <= new Date()) {
    return { error: "انتهى وقت التسجيل بهذه البطولة" };
  }

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("card_tournament_teams")
    .select("id, phone")
    .eq("tournament_id", tournamentId);

  if (existingError) {
    console.error(existingError);
    return { error: "حدث خطأ أثناء التسجيل، حاول مرة أخرى" };
  }

  const teams = existing ?? [];
  if (tournament.max_teams !== null && teams.length >= tournament.max_teams) {
    return { error: "اكتمل عدد الفرق المسموح بهذه البطولة" };
  }
  // يمنع التسجيل المكرر بالخطأ (ضغط مزدوج على الزر أو إعادة إرسال النموذج)
  if (teams.some((team) => team.phone === phone)) {
    return { error: "هذا الرقم مسجَّل مسبقاً بهذه البطولة" };
  }

  const { error } = await supabaseAdmin.from("card_tournament_teams").insert({
    tournament_id: tournamentId,
    player1_name: player1,
    player2_name: player2,
    phone,
  });

  if (error) {
    console.error(error);
    return { error: "حدث خطأ أثناء التسجيل، حاول مرة أخرى" };
  }

  return { error: null };
}
