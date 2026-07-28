import MenuDisplayPage from "@/components/menu-display/MenuDisplayPage";

// صفحة تصفح بصرية بحتة (بدون سلة أو أزرار شراء) — بيانات المنيو مصفوفة ثابتة
// في lib/menu-data.ts، فهذه الصفحة تُبنى ثابتة (SSG) وتُخدم من كاش Vercel CDN
// دون أي استدعاء لقاعدة البيانات وقت الطلب
export default function MenuPage() {
  return <MenuDisplayPage />;
}
