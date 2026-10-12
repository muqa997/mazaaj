import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "../globals.css";

// خط مختلف عن بقية الموقع عمداً: «تجوال» هندسي حديث وأوزانه تصل 900، فيعطي عناوين
// عريضة قوية بأسلوب مينمال — وعائلة واحدة فقط لتبقى الصفحة خفيفة على الجوال
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "بطولة ورق مزاج",
  description: "سجّل فريقك ببطولة الورق في كافيه مزاج — الاشتراك للفريق والدفع في الكافيه",
};

// صفحة مستقلة برابط قصير يُرسل للمشتركين مباشرة (mazaajcafe.com/tournament) — خارج
// مسارات اللغة لأنها موجّهة لزبائن محليين بالعربية فقط، فلا تحتاج نسخة إنجليزية
export default function TournamentLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body
        className="min-h-screen bg-background text-primary antialiased"
        style={{ fontFamily: "var(--font-tajawal), sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
