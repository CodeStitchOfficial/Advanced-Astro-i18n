import { locales, defaultLocale, type Locale } from "./i18nConfig";

/** Filter a content collection array to entries whose ID starts with the given locale prefix. */
export function filterCollectionByLanguage<T extends { id: string }>(
  collection: T[],
  locale: Locale,
): T[] {
  return collection.filter((entry) => entry.id.startsWith(`${locale}/`));
}

/** Extract locale from a URL pathname. Returns defaultLocale if no locale prefix found. */
export function getLocaleFromUrl(url: URL): Locale {
  const [, segment] = url.pathname.split("/");
  if (locales.includes(segment as Locale)) {
    return segment as Locale;
  }
  return defaultLocale;
}

/** Convert a BCP-47 hyphenated locale code (e.g. "en-US") to Open Graph's underscore format (e.g. "en_US"). */
export function toOgLocale(hreflang: string): string {
  return hreflang.replace("-", "_");
}
