// بيانات مبدئية للعرض فقط — يتم استبدالها بالمنيو الفعلي لاحقاً
export type MenuItem = {
  id: string;
  category: "coffee" | "desserts" | "shisha";
  name: { ar: string; en: string };
  price: number;
};

export const placeholderMenu: MenuItem[] = [
  { id: "c1", category: "coffee", name: { ar: "إسبريسو", en: "Espresso" }, price: 3000 },
  { id: "c2", category: "coffee", name: { ar: "لاتيه", en: "Latte" }, price: 4500 },
  { id: "c3", category: "coffee", name: { ar: "كابتشينو", en: "Cappuccino" }, price: 4500 },
  { id: "c4", category: "coffee", name: { ar: "قهوة تركية", en: "Turkish Coffee" }, price: 3500 },

  { id: "d1", category: "desserts", name: { ar: "تشيز كيك", en: "Cheesecake" }, price: 6000 },
  { id: "d2", category: "desserts", name: { ar: "كنافة", en: "Kunafa" }, price: 5500 },
  { id: "d3", category: "desserts", name: { ar: "براونيز", en: "Brownie" }, price: 5000 },

  { id: "s1", category: "shisha", name: { ar: "أرجيلة تفاح", en: "Apple Shisha" }, price: 8000 },
  { id: "s2", category: "shisha", name: { ar: "أرجيلة نعناع", en: "Mint Shisha" }, price: 8000 },
  { id: "s3", category: "shisha", name: { ar: "أرجيلة عنب", en: "Grape Shisha" }, price: 8000 },
];
