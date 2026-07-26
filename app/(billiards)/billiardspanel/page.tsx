import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { BILLIARDS_COOKIE_NAME, verifyBilliardsSessionToken } from "@/lib/billiards-session";
import BilliardsLoginForm from "@/components/billiards/BilliardsLoginForm";
import BilliardsOperatorPage from "@/components/billiards/BilliardsOperatorPage";
import {
  billiardsLogin,
  billiardsLogout,
  refreshBilliardsSession,
  getBilliardsTables,
  addGame,
  removeGame,
  payAndReset,
  getTodayPaidSummary,
} from "./actions";

// هذي الصفحة ما توصلها مباشرة أبداً — فقط عبر التحويل اللي يسويه middleware.ts
// لما يزور أحد المسار السري الصحيح (متغير BILLIARDS_ROUTE)، واللي يضبط كوكي تحقق
// بنفس القيمة. أي وصول مباشر لـ /billiardspanel بدون هذا الكوكي يرجع 404.
// هذه الصفحة منفصلة تماماً عن لوحة التحكم وصفحة العاملين: باسوورد مختلف، جلسة
// مختلفة، ولا تعرض شيء غير طاولات البلياردو الثلاث.
export default async function BilliardsPage() {
  const gateValue = cookies().get("mz_billiards_gate")?.value;

  if (!process.env.BILLIARDS_ROUTE || gateValue !== process.env.BILLIARDS_ROUTE) {
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
      addGame={addGame}
      removeGame={removeGame}
      payAndReset={payAndReset}
      getTodayPaidSummary={getTodayPaidSummary}
    />
  );
}
