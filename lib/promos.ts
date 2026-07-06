import { supabase } from "@/lib/supabase";
import type { MenuCategory } from "@/lib/menu-data";

export type PromoKey = "trending" | "offer";

export type PromoRow = {
  key: PromoKey;
  image_url: string | null;
  target_category: MenuCategory | null;
};

export async function getHomePromos(): Promise<Record<PromoKey, PromoRow | null>> {
  if (!supabase) return { trending: null, offer: null };

  const { data, error } = await supabase
    .from("home_promos")
    .select("key, image_url, target_category");

  if (error) {
    console.error(error);
    return { trending: null, offer: null };
  }

  const rows = (data ?? []) as PromoRow[];
  return {
    trending: rows.find((r) => r.key === "trending") ?? null,
    offer: rows.find((r) => r.key === "offer") ?? null,
  };
}
