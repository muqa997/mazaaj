import { getTranslations } from "next-intl/server";
import { CartProvider } from "@/lib/cart-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import OfflineBanner from "@/components/OfflineBanner";
import BackToTopButton from "@/components/BackToTopButton";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("common");

  return (
    <CartProvider>
      <Navbar />
      <OfflineBanner offlineText={t("offline")} backOnlineText={t("backOnline")} />
      <main className="flex-1 pt-[64px]">{children}</main>
      <Footer />
      <CartDrawer />
      <BackToTopButton />
    </CartProvider>
  );
}
