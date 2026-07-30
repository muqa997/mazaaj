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
  collectPayment,
  endSession,
  getPendingTickets,
  getMyPendingHandovers,
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

  return (
    <BilliardsOperatorPage
      logoutAction={billiardsLogout}
      refreshSessionAction={refreshBilliardsSession}
      getTables={getBilliardsTables}
      setGameCount={setGameCount}
      updateCustomerRef={updateCustomerRef}
      collectPayment={collectPayment}
      endSession={endSession}
      getPendingTickets={getPendingTickets}
      getMyPendingHandovers={getMyPendingHandovers}
      getStats={getBilliardsOperatorStats}
      getNotes={getNotes}
      addNote={addNote}
      deleteNote={deleteNote}
    />
  );
}
