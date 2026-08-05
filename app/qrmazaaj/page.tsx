import QRCode from "qrcode";
import { MapPin, Facebook, Instagram, UtensilsCrossed } from "lucide-react";
import WifiCard from "@/components/qr/WifiCard";
import ReviewCard from "@/components/qr/ReviewCard";
import {
  SOCIAL_LINKS,
  MAP_DIRECTIONS_URL,
  WIFI_SSID,
  WIFI_PASSWORD,
  GOOGLE_REVIEW_URL,
} from "@/lib/config";

// أحرف مضمون وجودها بمعيار WIFI: تحتاج هروباً بشرطة مائلة قبلها داخل القيمة —
// لا توجد حالياً بالاسم/كلمة المرور الفعليين، لكن هذا يمنع كسر الرمز لو تغيّرا لاحقاً
function escapeWifiField(value: string) {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

async function buildWifiQrDataUrl() {
  const wifiUri = `WIFI:T:WPA;S:${escapeWifiField(WIFI_SSID)};P:${escapeWifiField(WIFI_PASSWORD)};;`;
  return QRCode.toDataURL(wifiUri, { width: 300, margin: 1 });
}

const SOCIAL_ICONS = [
  { href: SOCIAL_LINKS.facebook, label: "فيسبوك", icon: Facebook },
  { href: SOCIAL_LINKS.instagram, label: "انستكرام", icon: Instagram },
  { href: SOCIAL_LINKS.tiktok, label: "تيكتوك", icon: TikTokIcon },
] as const;

// lucide-react لا يوفر أيقونة تيكتوك رسمية — رمز بسيط بنفس أسلوب بقية الأيقونات
function TikTokIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
    >
      <path d="M16.6 5.82c-.9-.98-1.4-2.26-1.4-3.6h-3.16v13.44c0 1.6-1.3 2.9-2.9 2.9a2.9 2.9 0 0 1 0-5.8c.26 0 .52.03.76.1V9.7a6.1 6.1 0 0 0-.76-.05 6.06 6.06 0 1 0 6.06 6.06V8.8a8.24 8.24 0 0 0 4.83 1.55V7.19a4.85 4.85 0 0 1-3.43-1.37z" />
    </svg>
  );
}

export default async function QrMazaajPage() {
  const wifiQrDataUrl = await buildWifiQrDataUrl();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-5 py-8">
      <div className="mb-7 flex flex-col items-center gap-1.5 text-center">
        <span className="text-4xl">☕</span>
        <h1 className="text-2xl font-extrabold text-primary">كافيه مزاج</h1>
        <p className="text-xs text-primary/50">كل شيء تحتاجه بمكان واحد</p>
      </div>

      <div className="flex w-full flex-col gap-3.5">
        <a
          href="/ar/menu"
          className="flex items-center justify-between gap-3 rounded-3xl border border-accent/25 bg-accent/10 px-6 py-7 backdrop-blur-xl shadow-glass-lg"
        >
          <div>
            <p className="text-xl font-extrabold text-primary">المنيو</p>
            <p className="text-xs text-primary/60">شاهد كل الأصناف والأسعار</p>
          </div>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
            <UtensilsCrossed size={26} className="text-accent" />
          </span>
        </a>

        <div className="grid grid-cols-2 items-start gap-3.5">
          <WifiCard ssid={WIFI_SSID} password={WIFI_PASSWORD} qrDataUrl={wifiQrDataUrl} />
          <ReviewCard reviewUrl={GOOGLE_REVIEW_URL} />
        </div>

        <a
          href={MAP_DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-3xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-xl shadow-glass-lg"
        >
          <div>
            <p className="text-sm font-extrabold text-primary">موقعنا على الخرائط</p>
            <p className="text-[11px] text-primary/50">احصل على الاتجاهات مباشرة</p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
            <MapPin size={20} className="text-primary" />
          </span>
        </a>

        <div className="mt-2 flex flex-col items-center gap-3">
          <p className="text-xs font-semibold text-primary/50">تابعنا</p>
          <div className="flex items-center gap-3.5">
            {SOCIAL_ICONS.map(({ href, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/10 text-primary backdrop-blur-xl shadow-glass-lg"
              >
                <Icon size={22} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-10 text-[11px] text-primary/30">© كافيه مزاج</p>
    </main>
  );
}
