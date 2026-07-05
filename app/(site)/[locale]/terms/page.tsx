import { useTranslations } from "next-intl";
import LegalPage from "@/components/LegalPage";

export default function TermsPage() {
  const t = useTranslations("terms");
  const sections = t.raw("sections") as { heading: string; body: string }[];

  return (
    <LegalPage
      title={t("title")}
      lastUpdated={t("lastUpdated")}
      intro={t("intro")}
      sections={sections}
    />
  );
}
