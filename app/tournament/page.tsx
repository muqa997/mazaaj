import { getLiveTournaments, getTeamCounts } from "@/lib/tournaments-server";
import TournamentPageClient from "@/components/tournament/TournamentPage";
import TournamentList from "@/components/tournament/TournamentList";
import { registerTeam } from "./actions";

// لا تُخزَّن الصفحة مؤقتاً: العدّاد وعدد الفرق المتبقية يجب أن يكونا صحيحين لحظة الفتح
export const dynamic = "force-dynamic";

// ببطولة واحدة نفتحها مباشرة (بلا خطوة اختيار زائدة)، وبأكثر من واحدة نعرض قائمة
// البطاقات. الرابط القصير mazaajcafe.com/tournament يبقى هو نفسه بالحالتين
export default async function TournamentPage() {
  const tournaments = await getLiveTournaments();
  const teamCounts = await getTeamCounts(tournaments.map((t) => t.id));

  if (tournaments.length === 1) {
    return (
      <TournamentPageClient
        tournament={tournaments[0]}
        teamCount={teamCounts[tournaments[0].id] ?? 0}
        registerTeam={registerTeam}
      />
    );
  }

  if (tournaments.length === 0) {
    return <TournamentPageClient tournament={null} teamCount={0} registerTeam={registerTeam} />;
  }

  return <TournamentList tournaments={tournaments} teamCounts={teamCounts} />;
}
