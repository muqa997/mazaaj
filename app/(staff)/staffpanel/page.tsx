import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { STAFF_COOKIE_NAME, verifyStaffSessionToken } from "@/lib/staff-session";
import StaffLoginForm from "@/components/staff/StaffLoginForm";
import StaffOrdersPage from "@/components/staff/StaffOrdersPage";
import {
  staffLogin,
  staffLogout,
  refreshStaffSession,
  getStaffOrders,
  updateStaffOrderStatus,
  deleteStaffOrder,
} from "./actions";

// هذي الصفحة ما توصلها مباشرة أبداً — فقط عبر التحويل اللي يسويه middleware.ts
// لما يزور أحد المسار السري الصحيح (متغير STAFF_ROUTE)، واللي يضبط كوكي تحقق
// بنفس القيمة. أي وصول مباشر لـ /staffpanel بدون هذا الكوكي يرجع 404.
// هذه الصفحة منفصلة تماماً عن لوحة التحكم: باسوورد مختلف، جلسة مختلفة،
// ولا تعرض شيء غير قسم الطلبات.
export default async function StaffPage() {
  const gateValue = cookies().get("mz_staff_gate")?.value;

  if (!process.env.STAFF_ROUTE || gateValue !== process.env.STAFF_ROUTE) {
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
    />
  );
}
