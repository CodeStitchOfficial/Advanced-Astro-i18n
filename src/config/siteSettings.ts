export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const localeMap: Record<Locale, string> = { en: "en-US", es: "es-ES" };
export const languageSwitcherMap: Record<Locale, string> = { en: "EN", es: "ES" };
