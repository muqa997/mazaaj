import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import OfflineBanner from "@/components/OfflineBanner";
import "../../globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "لوحة التحكم",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen bg-background text-primary antialiased">
        <OfflineBanner topOffset="env(safe-area-inset-top)" />
        {children}
      </body>
    </html>
  );
}
