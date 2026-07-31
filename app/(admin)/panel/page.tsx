import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/admin-session";
import { ADMIN_GATE_HEADER } from "@/lib/gate-headers";
import LoginForm from "@/components/admin/LoginForm";
import Dashboard from "@/components/admin/Dashboard";
import {
  login,
  logout,
  refreshSession,
  getOrders,
  updateOrderStatus,
  deleteOrder,
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getApplicants,
  getAdminJobOpenings,
  createJobOpening,
  updateJobOpening,
  deleteJobOpening,
  getSuggestions,
  getAnnouncements,
  updateAnnouncement,
  getHomePromos,
  updatePromoTarget,
  uploadPromoImage,
  getBilliardsTables,
  getBilliardsTransactions,
  settleBilliardsWithCashier,
  getBilliardsNotes,
  getCancelledBilliardsTickets,
} from "./actions";

// هذي الصفحة ما توصلها مباشرة أبداً — فقط عبر rewrite يسويه middleware.ts لما يزور
// أحد المسار السري الصحيح (متغير ADMIN_ROUTE)، واللي يضبط ترويسة داخلية على نفس الطلب.
// أي وصول مباشر لـ /panel بدون هذه الترويسة يرجع 404 (ومستحيل انتحالها من خارج
// السيرفر لأن middleware.ts يحذفها من أي طلب لا يطابق المسار السري أولاً).
export default async function AdminPage() {
  if (!process.env.ADMIN_ROUTE || headers().get(ADMIN_GATE_HEADER) !== "1") {
    notFound();
  }

  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const isAuthenticated = verifySessionToken(token);

  if (!isAuthenticated) {
    return <LoginForm loginAction={login} />;
  }

  return (
    <Dashboard
      logoutAction={logout}
      refreshSessionAction={refreshSession}
      getOrders={getOrders}
      updateOrderStatus={updateOrderStatus}
      deleteOrder={deleteOrder}
      getCoupons={getCoupons}
      createCoupon={createCoupon}
      updateCoupon={updateCoupon}
      deleteCoupon={deleteCoupon}
      getApplicants={getApplicants}
      getJobOpenings={getAdminJobOpenings}
      createJobOpening={createJobOpening}
      updateJobOpening={updateJobOpening}
      deleteJobOpening={deleteJobOpening}
      getSuggestions={getSuggestions}
      getAnnouncements={getAnnouncements}
      updateAnnouncement={updateAnnouncement}
      getHomePromos={getHomePromos}
      updatePromoTarget={updatePromoTarget}
      uploadPromoImage={uploadPromoImage}
      getBilliardsTables={getBilliardsTables}
      getBilliardsTransactions={getBilliardsTransactions}
      settleBilliardsWithCashier={settleBilliardsWithCashier}
      getBilliardsNotes={getBilliardsNotes}
      getCancelledBilliardsTickets={getCancelledBilliardsTickets}
    />
  );
}
