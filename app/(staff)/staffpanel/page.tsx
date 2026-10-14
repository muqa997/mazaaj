import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import { STAFF_COOKIE_NAME, verifyStaffSessionToken } from "@/lib/staff-session";
import { STAFF_GATE_HEADER } from "@/lib/gate-headers";
import StaffLoginForm from "@/components/staff/StaffLoginForm";
import StaffOrdersPage from "@/components/staff/StaffOrdersPage";
import {
  staffLogin,
  staffLogout,
  refreshStaffSession,
  getStaffOrders,
  updateStaffOrderStatus,
  deleteStaffOrder,
  getStaffBilliardsTables,
  getStaffPendingTickets,
  payTicket,
  cancelTicket,
  payTableDirect,
  getStaffBilliardsTodayTotal,
  getStaffBilliardsOverdueTotal,
  getStaffBilliardsYesterdaySummary,
} from "./actions";

// هذي الصفحة ما توصلها مباشرة أبداً — فقط عبر rewrite يسويه middleware.ts لما يزور
// أحد المسار السري الصحيح (متغير STAFF_ROUTE)، واللي يضبط ترويسة داخلية على نفس الطلب.
// أي وصول مباشر لـ /staffpanel بدون هذه الترويسة يرجع 404.
// هذه الصفحة منفصلة تماماً عن لوحة التحكم: باسوورد مختلف، جلسة مختلفة،
// ولا تعرض شيء غير قسم الطلبات.
export default async function StaffPage() {
  if (!process.env.STAFF_ROUTE || headers().get(STAFF_GATE_HEADER) !== "1") {
    notFound();
  }

  const token = cookies().get(STAFF_COOKIE_NAME)?.value;
  const isAuthenticated = verifyStaffSessionToken(token);

  if (!isAuthenticated) {
    return <StaffLoginForm loginAction={staffLogin} />;
  }

  // كل ما تعرضه الصفحة يُجلب على الخادم ويصل مع HTML: ضغطة F5 واحدة تكفي لرؤية
  // الكيمات الحية والجلسات المرحّلة والطلبات، بطلب واحد بدل ستة
  const [
    initialOrders,
    initialTables,
    initialTickets,
    initialTodayTotal,
    initialOverdueTotal,
    initialYesterday,
  ] = await Promise.all([
    getStaffOrders(),
    getStaffBilliardsTables(),
    getStaffPendingTickets(),
    getStaffBilliardsTodayTotal(),
    getStaffBilliardsOverdueTotal(),
    getStaffBilliardsYesterdaySummary(),
  ]);

  return (
    <StaffOrdersPage
      initialOrders={initialOrders ?? []}
      initialBilliards={{
        tables: initialTables ?? [],
        tickets: initialTickets ?? [],
        todayTotal: initialTodayTotal ?? { games: 0, amount: 0 },
        overdueTotal: initialOverdueTotal ?? { amount: 0, count: 0 },
        yesterday: initialYesterday ?? { amount: 0, count: 0, unsettledCount: 0 },
      }}
      logoutAction={staffLogout}
      refreshSessionAction={refreshStaffSession}
      getOrders={getStaffOrders}
      updateOrderStatus={updateStaffOrderStatus}
      deleteOrder={deleteStaffOrder}
      getBilliardsTables={getStaffBilliardsTables}
      getPendingTickets={getStaffPendingTickets}
      payTicket={payTicket}
      cancelTicket={cancelTicket}
      payTableDirect={payTableDirect}
      getBilliardsTodayTotal={getStaffBilliardsTodayTotal}
      getBilliardsOverdueTotal={getStaffBilliardsOverdueTotal}
      getBilliardsYesterdaySummary={getStaffBilliardsYesterdaySummary}
    />
  );
}
