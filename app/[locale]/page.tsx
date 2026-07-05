import Hero from "@/components/Hero";
import MenuPreview from "@/components/sections/MenuPreview";
import GameLounge from "@/components/sections/GameLounge";
import DeliveryCTA from "@/components/sections/DeliveryCTA";
import ContactSocial from "@/components/sections/ContactSocial";

export default function Home() {
  return (
    <>
      <Hero />
      <MenuPreview />
      <GameLounge />
      <DeliveryCTA />
      <ContactSocial />
    </>
  );
}
