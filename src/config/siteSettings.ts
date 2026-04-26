export const locales = ["nl"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "nl";
export const localeMap: Record<Locale, string> = { nl: "nl-NL" };
export const languageSwitcherMap: Record<Locale, string> = { nl: "NL" };
