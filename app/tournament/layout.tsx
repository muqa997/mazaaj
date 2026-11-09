import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "../globals.css";

// «القاهرة» كبقية الموقع. كان هنا «تجوال» ليتميّز، لكن حروفه أضيق وفتحاتها أصغر
// فتتلبّك الأسطر الصغيرة على الجوال — والوضوح أهم من التمييز بصفحة يفتحها الزبون
// مرة واحدة ليقرأ موعداً وسعراً
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "بطولة ورق مزاج",
  description: "سجّل فريقك ببطولة الورق في كافيه مزاج — سعر الطاولة للفريق والدفع في الكافيه",
};

// صفحة مستقلة برابط قصير يُرسل للمشتركين مباشرة (mazaajcafe.com/tournament) — خارج
// مسارات اللغة لأنها موجّهة لزبائن محليين بالعربية فقط، فلا تحتاج نسخة إنجليزية
export default function TournamentLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body
        className="min-h-screen bg-background text-primary antialiased"
        style={{ fontFamily: "var(--font-cairo), sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
