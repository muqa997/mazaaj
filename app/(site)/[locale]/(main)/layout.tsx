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
      <div className="fixed inset-x-0 top-0 z-50 pt-safe">
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
