import { getActiveTournament, getTournamentTeamCount } from "@/lib/tournaments-server";
import TournamentPageClient from "@/components/tournament/TournamentPage";
import { registerTeam } from "./actions";

// لا تُخزَّن الصفحة مؤقتاً: العدّاد وعدد الفرق المتبقية يجب أن يكونا صحيحين لحظة الفتح
export const dynamic = "force-dynamic";

export default async function TournamentPage() {
  const tournament = await getActiveTournament();
  const teamCount = tournament ? await getTournamentTeamCount(tournament.id) : 0;

  return (
    <TournamentPageClient
      tournament={tournament}
      teamCount={teamCount}
      registerTeam={registerTeam}
    />
  );
}
