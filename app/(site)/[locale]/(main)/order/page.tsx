"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, type Variants } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { Plus, Minus, Flame, Snowflake, CakeSlice, Wind, type LucideIcon } from "lucide-react";
import {
  menuData,
  MENU_CATEGORIES,
  MENU_GROUPS as MENU_GROUP_CATEGORIES,
  getGroupKeyForCategory,
  type MenuCategory,
  type MenuGroupKey,
  type MenuItem,
  type ShishaBase,
} from "@/lib/menu-data";
import { useCart } from "@/lib/cart-context";

const SHISHA_BASES: ShishaBase[] = ["wood", "bubble", "natural"];

const GROUP_ICONS: Record<MenuGroupKey, LucideIcon> = {
  hot: Flame,
  cold: Snowflake,
  desserts: CakeSlice,
  shisha: Wind,
};

const MENU_GROUPS: { key: MenuGroupKey; icon: LucideIcon; categories: MenuCategory[] }[] =
  MENU_GROUP_CATEGORIES.map((g) => ({ ...g, icon: GROUP_ICONS[g.key] }));

// تجميع دخول متتابع (staggered) لبطاقات الأصناف — تُعاد كل مرة يتغيّر القسم
// النشط (بمفتاح key={activeCategory} على الحاوية) بدل ظهور القائمة دفعة واحدة بلا حركة
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

// لوحة ألوان صفحة الطلب فقط (تيراكوتا/زيتوني/فحمي فوق الخلفية الكريمية الحالية،
// "الاتجاه الأول" المعتمد) — لا تُستخدم بأي صفحة أخرى بالموقع. تسقط تلقائياً
// لألوان الموقع الأصلية بالوضع الداكن (dark:) لأن هذه الدرجات غامقة ولا تتباين
// مع خلفية الوضع الداكن الغامقة أصلاً
const ORDER_ACTIVE_FILL = "bg-[#8D321F] text-[#FAF7F2] dark:bg-primary dark:text-background";
const ORDER_BORDER = "border-[#3A4027]/30 dark:border-primary/10";
const ORDER_HEADING = "text-[#2B2D31] dark:text-primary";
const ORDER_MUTED = "text-[#2B2D31]/55 dark:text-primary/45";
const ORDER_PRICE = "text-[#8D321F] dark:text-primary/50";
const ORDER_SELECTED_OLIVE = "bg-[#3A4027] text-[#FAF7F2] dark:bg-primary dark:text-background";
const ORDER_UNSELECTED = "border-[#3A4027]/30 text-[#2B2D31]/65 dark:border-transparent dark:bg-primary/5 dark:text-primary/60";

function QtyControl({
  qty,
  onDecrease,
  onIncrease,
}: {
  qty: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onDecrease}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 active:scale-90"
      >
        <Minus size={14} className="text-primary/70" />
      </button>
      <span className="w-4 text-center text-sm font-semibold text-primary">{qty}</span>
      <button
        type="button"
        onClick={onIncrease}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/5 active:scale-90"
      >
        <Plus size={14} className="text-primary/70" />
      </button>
    </div>
  );
}

function RegularItemCard({
  item,
  locale,
}: {
  item: Extract<MenuItem, { price: number }>;
  locale: "ar" | "en";
}) {
  const t = useTranslations("menuPage");
  const { items, addItem, updateQty } = useCart();
  const cartItem = items.find((i) => i.id === item.id);

  return (
    <motion.div
      layout
      variants={fadeUp}
      className={`flex items-center justify-between rounded-2xl border bg-background p-4 shadow-glass ${ORDER_BORDER}`}
    >
      <div>
        <p className={`font-semibold ${ORDER_HEADING}`}>{item.name[locale]}</p>
        {item.description && <p className={`text-xs ${ORDER_MUTED}`}>{item.description[locale]}</p>}
        <p className={`text-sm font-bold ${ORDER_PRICE}`}>
          {item.price.toLocaleString()} {t("currency")}
        </p>
      </div>

      {cartItem ? (
        <QtyControl
          qty={cartItem.qty}
          onDecrease={() => updateQty(item.id, cartItem.qty - 1)}
          onIncrease={() => updateQty(item.id, cartItem.qty + 1)}
        />
      ) : (
        <button
          type="button"
          onClick={() =>
            addItem({ id: item.id, name: item.name[locale], price: item.price })
          }
          className={`rounded-full px-4 py-2 text-xs font-semibold active:scale-95 ${ORDER_ACTIVE_FILL}`}
        >
          {t("addToCart")}
        </button>
      )}
    </motion.div>
  );
}

function ShishaItemCard({
  item,
  locale,
}: {
  item: Extract<MenuItem, { category: "shisha" }>;
  locale: "ar" | "en";
}) {
  const t = useTranslations("menuPage");
  const tBase = useTranslations("shishaBase");
  const { items, addItem, updateQty } = useCart();
  const availableBases = SHISHA_BASES.filter((base) => item.basePrices[base] !== undefined);
  const [selectedBase, setSelectedBase] = useState<ShishaBase>(availableBases[0]);

  const cartId = `${item.id}-${selectedBase}`;
  const cartItem = items.find((i) => i.id === cartId);
  const price = item.basePrices[selectedBase]!;

  return (
    <motion.div
      layout
      variants={fadeUp}
      className={`flex flex-col gap-3 rounded-2xl border bg-background p-4 shadow-glass ${ORDER_BORDER}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`font-semibold ${ORDER_HEADING}`}>{item.name[locale]}</p>
          {item.description && <p className={`text-xs ${ORDER_MUTED}`}>{item.description[locale]}</p>}
        </div>
        <p className={`text-sm font-bold ${ORDER_PRICE}`}>
          {price.toLocaleString()} {t("currency")}
        </p>
      </div>

      <div className="flex gap-2">
        {availableBases.map((base) => (
          <button
            key={base}
            type="button"
            onClick={() => setSelectedBase(base)}
            className={`flex-1 rounded-full border px-2 py-2 text-xs font-semibold transition-colors ${
              selectedBase === base ? ORDER_SELECTED_OLIVE : ORDER_UNSELECTED
            }`}
          >
            {tBase(base)}
          </button>
        ))}
      </div>

      {cartItem ? (
        <div className="flex justify-center">
          <QtyControl
            qty={cartItem.qty}
            onDecrease={() => updateQty(cartId, cartItem.qty - 1)}
            onIncrease={() => updateQty(cartId, cartItem.qty + 1)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() =>
            addItem({
              id: cartId,
              name: `${item.name[locale]} (${tBase(selectedBase)})`,
              price,
            })
          }
          className={`rounded-full px-4 py-2 text-xs font-semibold active:scale-95 ${ORDER_ACTIVE_FILL}`}
        >
          {t("addToCart")}
        </button>
      )}
    </motion.div>
  );
}

// يقرأ باراميتر ?category= بالرابط (مصدره أزرار "اطلب الآن"/"اطلب العرض" بالصفحة
// الرئيسية) ليحدد المجموعة والقسم الابتدائيين بدل الافتراضي، إن كان القسم صالحاً
function useInitialCategory(): MenuCategory | null {
  const searchParams = useSearchParams();
  const requested = searchParams.get("category");
  if (requested && (MENU_CATEGORIES as string[]).includes(requested)) {
    return requested as MenuCategory;
  }
  return null;
}

function OrderMenuPageContent() {
  const t = useTranslations("menuPage");
  const tGroups = useTranslations("menuPage.groups");
  const locale = useLocale() as "ar" | "en";

  const initialCategory = useInitialCategory();
  const initialGroupKey = initialCategory
    ? getGroupKeyForCategory(initialCategory)
    : MENU_GROUPS[0].key;

  const [activeGroupKey, setActiveGroupKey] = useState(initialGroupKey);
  const activeGroup = MENU_GROUPS.find((g) => g.key === activeGroupKey)!;

  const [activeCategory, setActiveCategory] = useState<MenuCategory>(
    initialCategory ?? activeGroup.categories[0]
  );

  const selectGroup = (key: MenuGroupKey) => {
    setActiveGroupKey(key);
    const group = MENU_GROUPS.find((g) => g.key === key)!;
    setActiveCategory(group.categories[0]);
  };

  const visibleItems = menuData.filter((item) => item.category === activeCategory);

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`mb-2 text-3xl font-extrabold ${ORDER_HEADING}`}
        >
          {t("title")}
        </motion.h1>
        <p className={`mb-8 text-sm ${ORDER_MUTED}`}>{t("subtitle")}</p>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mb-8 grid grid-cols-2 gap-3"
        >
          {MENU_GROUPS.map(({ key, icon: Icon }) => (
            <motion.button
              key={key}
              variants={fadeUp}
              type="button"
              onClick={() => selectGroup(key)}
              whileTap={{ scale: 0.95 }}
              className={`flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 transition-colors ${
                activeGroupKey === key
                  ? `${ORDER_ACTIVE_FILL} border-transparent`
                  : `bg-background ${ORDER_BORDER} ${ORDER_HEADING}`
              }`}
            >
              <Icon
                size={20}
                strokeWidth={1.8}
                className={
                  activeGroupKey === key ? "text-[#FAF7F2] dark:text-background" : "text-[#3A4027] dark:text-accent"
                }
              />
              <span className="text-center text-xs font-semibold leading-tight">
                {tGroups(key)}
              </span>
            </motion.button>
          ))}
        </motion.div>

        <div className="mb-8 grid grid-flow-col grid-rows-2 gap-2 overflow-x-auto pb-2 [grid-auto-columns:max-content]">
          {activeGroup.categories.map((category) => (
            <motion.button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              whileTap={{ scale: 0.94 }}
              className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
                activeCategory === category ? `${ORDER_ACTIVE_FILL} border-transparent` : ORDER_UNSELECTED
              }`}
            >
              {t(`categories.${category}`)}
            </motion.button>
          ))}
        </div>

        <motion.div
          key={activeCategory}
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {visibleItems.map((item) =>
            item.category === "shisha" ? (
              <ShishaItemCard key={item.id} item={item} locale={locale} />
            ) : (
              <RegularItemCard key={item.id} item={item} locale={locale} />
            )
          )}
        </motion.div>
      </div>
    </div>
  );
}

// useSearchParams يتطلب حدود Suspense وإلا يفشل بناء الموقع (next build)
export default function OrderMenuPage() {
  return (
    <Suspense>
      <OrderMenuPageContent />
    </Suspense>
  );
}
