import { getLocale } from "next-intl/server";
import { supabase } from "@/lib/supabase";

export default async function AnnouncementBar() {
  const locale = (await getLocale()) as "ar" | "en";

  let texts: string[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("announcements")
      .select("text_ar, text_en")
      .order("position", { ascending: true });
    texts = (data ?? []).map((a) => (locale === "ar" ? a.text_ar : a.text_en));
  }

  if (texts.length === 0) return null;

  const directionClass = locale === "ar" ? "animate-marquee-forward" : "animate-marquee-backward";

  return (
    <div className="h-8 overflow-hidden bg-primary text-background">
      <div
        className={`flex h-full w-max items-center whitespace-nowrap ${directionClass}`}
      >
        {[...texts, ...texts].map((text, i) => (
          <span key={i} className="flex items-center gap-3 px-6 text-xs font-semibold">
            {text}
            <span aria-hidden className="text-accent">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
