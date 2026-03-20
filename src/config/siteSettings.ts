export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const localeMap: Record<Locale, string> = { en: "en-US", fr: "fr-FR" };
export const languageSwitcherMap: Record<Locale, string> = { en: "EN", fr: "FR" };
