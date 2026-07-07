export const locales = ["en", "fr"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeMap = {
  en: "en-US",
  fr: "fr-FR",
};

export const languageSwitcherMap = {
  en: "EN",
  fr: "FR",
};

export const localizedCollections = {
  blog: { en: "blog", fr: "blog" },
} as const;
