import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PHONE_DISPLAY, PHONE_TEL, CONTACT_EMAIL } from "@/lib/config";
import LanguageSwitcher from "./LanguageSwitcher";
import DarkModeToggle from "./DarkModeToggle";
import SuggestionModal from "./SuggestionModal";

export default function Footer() {
  const t = useTranslations("footer");
  const tContact = useTranslations("contact");
  const tAbout = useTranslations("about");
  const tCareers = useTranslations("careers");
  const tPrivacy = useTranslations("privacy");
  const tTerms = useTranslations("terms");
  const tSuggestions = useTranslations("suggestions");

  const links = [
    { href: "/careers", label: tCareers("navLabel") },
    { href: "/privacy", label: tPrivacy("navLabel") },
    { href: "/terms", label: tTerms("navLabel") },
  ];

  return (
    <footer className="border-t border-primary/10 bg-primary/[0.03] px-6 pb-safe pt-14">
      <div id="about" className="mx-auto flex max-w-lg scroll-mt-20 flex-col items-center text-center">
        <div className="mb-6 h-20 w-20 overflow-hidden rounded-full shadow-glass-lg">
          <Image
            src="/logo.png"
            alt="mazaaj"
            width={80}
            height={80}
            className="h-full w-full object-cover"
          />
        </div>
        <p className="text-base leading-loose text-primary/60">{tAbout("description")}</p>
      </div>

      <div className="mx-auto mt-14 flex max-w-5xl flex-col gap-10 border-t border-primary/10 pt-10 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-primary">{t("quickLinksTitle")}</h3>
          <ul className="flex flex-col gap-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-primary/60 transition-colors hover:text-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <SuggestionModal label={tSuggestions("footerLabel")} />
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-primary">{t("contactTitle")}</h3>
          <p className="text-sm text-primary/60">{tContact("address")}</p>
          <p className="text-sm text-primary/60">
            {t("contactPhoneLabel")}:{" "}
            <a href={`tel:${PHONE_TEL}`} className="font-semibold text-primary hover:text-accent">
              {PHONE_DISPLAY}
            </a>
          </p>
          <p className="text-sm text-primary/60">
            {tContact("emailLabel")}:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              dir="ltr"
              className="font-semibold text-primary hover:text-accent"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold text-primary">{t("settingsTitle")}</h3>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <DarkModeToggle />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-5xl border-t border-primary/10 py-5 text-center text-xs text-primary/40">
        <p>
          © {new Date().getFullYear()} mazaaj — {t("rights")}
        </p>
        <p className="mt-1">{t("certificate")}</p>
      </div>
    </footer>
  );
}
