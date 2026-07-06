import { getTranslations } from "next-intl/server";
import { CartProvider } from "@/lib/cart-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import OfflineBanner from "@/components/OfflineBanner";
import BackToTopButton from "@/components/BackToTopButton";
import AnnouncementBar from "@/components/AnnouncementBar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("common");

  return (
    <CartProvider>
      {/* transform/will-change يجبران المتصفح على طبقة تركيب منفصلة لهذا الشريط —
          بدونها، بعض متصفحات الجوال (خصوصاً مع تأثير backdrop-blur بالهيدر) تُظهر
          الشريط الثابت وكأنه يتحرك مع الصفحة أثناء التمرير قبل أن "يقفز" لمكانه الصحيح */}
      <div
        className="fixed inset-x-0 top-0 z-50 pt-safe will-change-transform"
        style={{ transform: "translateZ(0)" }}
      >
        <Navbar />
        <AnnouncementBar />
      </div>
      <OfflineBanner
        offlineText={t("offline")}
        backOnlineText={t("backOnline")}
        topOffset="calc(96px + env(safe-area-inset-top))"
      />
      <main className="flex-1 pt-[96px]">{children}</main>
      <Footer />
      <CartDrawer />
      <BackToTopButton />
    </CartProvider>
  );
}
