import { locales, defaultLocale, type Locale } from "@config/siteSettings";

/** Extract locale from a URL pathname. Returns defaultLocale if no locale prefix found. */
export function getLocaleFromUrl(url: URL): Locale {
  const [, segment] = url.pathname.split("/");
  if (locales.includes(segment as Locale)) {
    return segment as Locale;
  }
  return defaultLocale;
}

/** Filter a content collection array to entries whose ID starts with the given locale prefix. */
export function filterCollectionByLanguage<T extends { id: string }>(
  collection: T[],
  locale: Locale,
): T[] {
  return collection.filter((entry) => entry.id.startsWith(`${locale}/`));
}

/** Remove the locale prefix (e.g. "en/") from a collection entry ID to get a clean slug. */
export function removeLocaleFromSlug(id: string): string {
  const parts = id.split("/");
  // Remove the first segment if it's a known locale
  if (locales.includes(parts[0] as Locale)) {
    parts.shift();
  }
  // Remove file extension from last part
  const last = parts[parts.length - 1];
  parts[parts.length - 1] = last.replace(/\.\w+$/, "");
  return parts.join("/");
}
