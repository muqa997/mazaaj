import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import { BILLIARDS_COOKIE_NAME, verifyBilliardsSessionToken } from "@/lib/billiards-session";
import { BILLIARDS_GATE_HEADER } from "@/lib/gate-headers";
import BilliardsLoginForm from "@/components/billiards/BilliardsLoginForm";
import BilliardsOperatorPage from "@/components/billiards/BilliardsOperatorPage";
import {
  billiardsLogin,
  billiardsLogout,
  refreshBilliardsSession,
  getBilliardsTables,
  setGameCount,
  updateCustomerRef,
  endSession,
  getPendingTickets,
  cancelTicket,
  getBilliardsOperatorStats,
  getNotes,
  addNote,
  deleteNote,
} from "./actions";

// هذي الصفحة ما توصلها مباشرة أبداً — فقط عبر rewrite يسويه middleware.ts لما يزور
// أحد المسار السري الصحيح (متغير BILLIARDS_ROUTE)، واللي يضبط ترويسة داخلية على نفس
// الطلب. أي وصول مباشر لـ /billiardspanel بدون هذه الترويسة يرجع 404.
// هذه الصفحة منفصلة تماماً عن لوحة التحكم وصفحة العاملين: باسوورد مختلف، جلسة
// مختلفة، ولا تعرض شيء غير طاولات البلياردو الثلاث.
export default async function BilliardsPage() {
  if (!process.env.BILLIARDS_ROUTE || headers().get(BILLIARDS_GATE_HEADER) !== "1") {
    notFound();
  }

  const token = cookies().get(BILLIARDS_COOKIE_NAME)?.value;
  const isAuthenticated = verifyBilliardsSessionToken(token);

  if (!isAuthenticated) {
    return <BilliardsLoginForm loginAction={billiardsLogin} />;
  }

  // تُجلب على الخادم وتصل مع HTML الصفحة: الطاولات تظهر لحظة الفتح حتى على اتصال
  // ضعيف، وبطلب واحد بدل خمسة. الإحصائيات وحدها تبقى على المتصفح لأنها تمسح ٣٥ يوماً
  const [initialTables, initialTickets, initialNotes] = await Promise.all([
    getBilliardsTables(),
    getPendingTickets(),
    getNotes(),
  ]);

  return (
    <BilliardsOperatorPage
      initialTables={initialTables ?? []}
      initialTickets={initialTickets ?? []}
      initialNotes={initialNotes ?? []}
      logoutAction={billiardsLogout}
      refreshSessionAction={refreshBilliardsSession}
      getTables={getBilliardsTables}
      setGameCount={setGameCount}
      updateCustomerRef={updateCustomerRef}
      endSession={endSession}
      getPendingTickets={getPendingTickets}
      cancelTicket={cancelTicket}
      getStats={getBilliardsOperatorStats}
      getNotes={getNotes}
      addNote={addNote}
      deleteNote={deleteNote}
    />
  );
}
