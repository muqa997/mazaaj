import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
  // العربية دائماً هي اللغة الافتراضية بغض النظر عن لغة متصفح الزائر
  localeDetection: false,
});
