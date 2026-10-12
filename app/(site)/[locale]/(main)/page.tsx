import { getTranslations } from "next-intl/server";
import Hero from "@/components/Hero";
import PromoSection from "@/components/sections/PromoSection";
import GameLounge from "@/components/sections/GameLounge";
import DeliveryCTA from "@/components/sections/DeliveryCTA";
import Services from "@/components/sections/Services";
import ContactSocial from "@/components/sections/ContactSocial";
import TournamentBanner from "@/components/sections/TournamentBanner";
import { getHomePromos } from "@/lib/promos";
import { getActiveTournament } from "@/lib/tournaments-server";

// الصفحة الرئيسية مولّدة مسبقاً (static) لسرعتها، لكن محتواها يأتي من قاعدة البيانات
// (الرائج/العروض والبطولة) — فنعيد توليدها كل دقيقة حتى يظهر ما يغيّره المدير من
// لوحة التحكم بلا حاجة لإعادة نشر الموقع
export const revalidate = 60;

export default async function Home() {
  const { trending, offer } = await getHomePromos();
  const tournament = await getActiveTournament();
  const tTrending = await getTranslations("trendingSection");
  const tOffer = await getTranslations("offerSection");

  return (
    <>
      <Hero />
      {tournament && (
        <TournamentBanner
          title={tournament.title}
          category={tournament.category}
          startsAt={tournament.starts_at}
          entryFee={tournament.entry_fee}
          registrationOpen={new Date(tournament.registration_closes_at) > new Date()}
        />
      )}
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
      <Services />
      <ContactSocial />
    </>
  );
}
