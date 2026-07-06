import { getTranslations } from "next-intl/server";
import Hero from "@/components/Hero";
import PromoSection from "@/components/sections/PromoSection";
import GameLounge from "@/components/sections/GameLounge";
import DeliveryCTA from "@/components/sections/DeliveryCTA";
import ContactSocial from "@/components/sections/ContactSocial";
import { getHomePromos } from "@/lib/promos";

export default async function Home() {
  const { trending, offer } = await getHomePromos();
  const tTrending = await getTranslations("trendingSection");
  const tOffer = await getTranslations("offerSection");

  return (
    <>
      <Hero />
      <PromoSection
        sectionId="trending"
        eyebrow={tTrending("eyebrow")}
        title={tTrending("title")}
        description={tTrending("description")}
        ctaLabel={tTrending("cta")}
        imageUrl={trending?.image_url ?? null}
        targetCategory={trending?.target_category ?? null}
      />
      <PromoSection
        sectionId="offers"
        eyebrow={tOffer("eyebrow")}
        title={tOffer("title")}
        description={tOffer("description")}
        ctaLabel={tOffer("cta")}
        imageUrl={offer?.image_url ?? null}
        targetCategory={offer?.target_category ?? null}
      />
      <GameLounge />
      <DeliveryCTA />
      <ContactSocial />
    </>
  );
}
