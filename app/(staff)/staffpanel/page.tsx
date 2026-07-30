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
  getStaffCashierHandoverPending,
  getStaffBilliardsTodayTotal,
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

  return (
    <StaffOrdersPage
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
      getCashierHandoverPending={getStaffCashierHandoverPending}
      getBilliardsTodayTotal={getStaffBilliardsTodayTotal}
    />
  );
}
