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
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen bg-background text-primary antialiased">{children}</body>
    </html>
  );
}
