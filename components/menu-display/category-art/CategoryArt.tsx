import Image from "next/image";
import type { MenuGroupKey } from "@/lib/menu-data";
import HotArt from "./HotArt";
import ColdArt from "./ColdArt";
import DessertsArt from "./DessertsArt";
import ShishaArt from "./ShishaArt";

type CategoryArtProps = {
  groupKey: MenuGroupKey;
  image?: string;
  size?: number;
  className?: string;
};

const ART_BY_GROUP: Record<MenuGroupKey, typeof HotArt> = {
  hot: HotArt,
  cold: ColdArt,
  desserts: DessertsArt,
  shisha: ShishaArt,
};

// طبقة المؤثر المتحركة فوق الرسمة — بخار للساخن، مكعب ثلج للبارد، دخان للأركيلة
function AnimatedOverlay({ groupKey }: { groupKey: MenuGroupKey }) {
  if (groupKey === "hot") {
    return (
      <>
        <span
          className="animate-steam-rise absolute start-[42%] top-[22%] h-3 w-1.5 rounded-full bg-current opacity-0"
          style={{ animationDelay: "0s" }}
        />
        <span
          className="animate-steam-rise absolute start-[54%] top-[26%] h-3 w-1.5 rounded-full bg-current opacity-0"
          style={{ animationDelay: "1.1s" }}
        />
      </>
    );
  }
  if (groupKey === "cold") {
    return (
      <span className="animate-ice-drift absolute end-[28%] top-[38%] h-2.5 w-2.5 rotate-45 rounded-[2px] bg-current opacity-40" />
    );
  }
  if (groupKey === "shisha") {
    return (
      <>
        <span
          className="animate-smoke-drift absolute start-[46%] top-[16%] h-4 w-4 rounded-full bg-current opacity-0"
          style={{ animationDelay: "0s" }}
        />
        <span
          className="animate-smoke-drift absolute start-[56%] top-[20%] h-3 w-3 rounded-full bg-current opacity-0"
          style={{ animationDelay: "1.4s" }}
        />
      </>
    );
  }
  return null;
}

export default function CategoryArt({ groupKey, image, size = 64, className = "" }: CategoryArtProps) {
  const Art = ART_BY_GROUP[groupKey];

  return (
    <div className={`relative flex items-center justify-center text-accent ${className}`}>
      {image ? (
        <Image src={image} alt="" width={size} height={size} className="object-contain" />
      ) : (
        <Art size={size} />
      )}
      <AnimatedOverlay groupKey={groupKey} />
    </div>
  );
}
