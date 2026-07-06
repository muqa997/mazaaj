"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";
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
      className="flex items-center justify-between rounded-2xl border border-primary/10 bg-background p-4 shadow-glass"
    >
      <div>
        <p className="font-semibold text-primary">{item.name[locale]}</p>
        <p className="text-sm text-primary/50">
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
          className="rounded-full bg-accent/15 px-4 py-2 text-xs font-semibold text-primary active:scale-95"
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
  const [selectedBase, setSelectedBase] = useState<ShishaBase>("wood");

  const cartId = `${item.id}-${selectedBase}`;
  const cartItem = items.find((i) => i.id === cartId);
  const price = item.basePrices[selectedBase];

  return (
    <motion.div
      layout
      className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-background p-4 shadow-glass"
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold text-primary">{item.name[locale]}</p>
        <p className="text-sm text-primary/50">
          {price.toLocaleString()} {t("currency")}
        </p>
      </div>

      <div className="flex gap-2">
        {SHISHA_BASES.map((base) => (
          <button
            key={base}
            type="button"
            onClick={() => setSelectedBase(base)}
            className={`flex-1 rounded-full px-2 py-2 text-xs font-semibold transition-colors ${
              selectedBase === base
                ? "bg-primary text-background"
                : "bg-primary/5 text-primary/60"
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
          className="rounded-full bg-accent/15 px-4 py-2 text-xs font-semibold text-primary active:scale-95"
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
        <h1 className="mb-2 text-3xl font-extrabold text-primary">{t("title")}</h1>
        <p className="mb-8 text-sm text-primary/50">{t("subtitle")}</p>

        <div className="mb-8 grid grid-cols-2 gap-3">
          {MENU_GROUPS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => selectGroup(key)}
              className={`flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 transition-colors ${
                activeGroupKey === key
                  ? "border-primary bg-primary text-background"
                  : "border-primary/10 bg-background text-primary"
              }`}
            >
              <Icon
                size={20}
                strokeWidth={1.8}
                className={activeGroupKey === key ? "text-background" : "text-accent"}
              />
              <span className="text-center text-xs font-semibold leading-tight">
                {tGroups(key)}
              </span>
            </button>
          ))}
        </div>

        <div className="mb-8 grid grid-flow-col grid-rows-2 gap-2 overflow-x-auto pb-2 [grid-auto-columns:max-content]">
          {activeGroup.categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                activeCategory === category
                  ? "bg-primary text-background"
                  : "bg-primary/5 text-primary/60"
              }`}
            >
              {t(`categories.${category}`)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visibleItems.map((item) =>
            item.category === "shisha" ? (
              <ShishaItemCard key={item.id} item={item} locale={locale} />
            ) : (
              <RegularItemCard key={item.id} item={item} locale={locale} />
            )
          )}
        </div>
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
