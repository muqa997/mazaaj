import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/admin-session";
import LoginForm from "@/components/admin/LoginForm";
import Dashboard from "@/components/admin/Dashboard";
import {
  login,
  logout,
  refreshSession,
  getOrders,
  getApplicants,
  getAdminJobOpenings,
  createJobOpening,
  updateJobOpening,
  deleteJobOpening,
  getSuggestions,
} from "./actions";

// هذي الصفحة ما توصلها مباشرة أبداً — فقط عبر التحويل اللي يسويه middleware.ts
// لما يزور أحد المسار السري الصحيح (متغير ADMIN_ROUTE)، واللي يضبط كوكي تحقق
// بنفس القيمة. أي وصول مباشر لـ /panel بدون هذا الكوكي يرجع 404.
export default async function AdminPage() {
  const gateValue = cookies().get("mz_admin_gate")?.value;

  if (!process.env.ADMIN_ROUTE || gateValue !== process.env.ADMIN_ROUTE) {
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
      getApplicants={getApplicants}
      getJobOpenings={getAdminJobOpenings}
      createJobOpening={createJobOpening}
      updateJobOpening={updateJobOpening}
      deleteJobOpening={deleteJobOpening}
      getSuggestions={getSuggestions}
    />
  );
}
