import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "../globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "كافيه مزاج",
  description: "المنيو، الواي فاي، وكل روابط كافيه مزاج بمكان واحد",
};

export default function QrMazaajLayout({ children }: { children: React.ReactNode }) {
  return (
    // هذه الصفحة بلا مبدّل وضع داكن/فاتح — نفرض لوحة الألوان الداكنة دائماً (بدل الاعتماد
    // على الوضع الافتراضي الفاتح) لأن الخلفية المتدرجة الغامقة تصميم مقصود ثابت لهذه
    // الصفحة تحديداً، وليس تفضيلاً يبدّله الزائر
    <html lang="ar" dir="rtl" className={`${cairo.variable} dark`}>
      <body
        className="min-h-screen text-primary antialiased"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% -10%, rgba(214, 178, 122, 0.18), transparent 45%), linear-gradient(180deg, #241811 0%, #150e0a 60%, #0f0906 100%)",
          backgroundAttachment: "fixed",
        }}
      >
        {children}
      </body>
    </html>
  );
}
