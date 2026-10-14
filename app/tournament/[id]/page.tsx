import { notFound } from "next/navigation";
import { getTeamCounts, getTournamentById } from "@/lib/tournaments-server";
import TournamentPageClient from "@/components/tournament/TournamentPage";
import { registerTeam } from "../actions";

// لا تُخزَّن الصفحة مؤقتاً: العدّاد وعدد الفرق المتبقية يجب أن يكونا صحيحين لحظة الفتح
export const dynamic = "force-dynamic";

// صفحة بطولة بعينها — إليها تُشير بطاقات القائمة حين تكون هناك أكثر من بطولة معلنة،
// وهي أيضاً رابط قابل للمشاركة لبطولة محددة
export default async function SingleTournamentPage({ params }: { params: { id: string } }) {
  const tournament = await getTournamentById(params.id);
  if (!tournament) notFound();

  const counts = await getTeamCounts([tournament.id]);

  return (
    <TournamentPageClient
      tournament={tournament}
      teamCount={counts[tournament.id] ?? 0}
      registerTeam={registerTeam}
      backHref="/tournament"
    />
  );
}
