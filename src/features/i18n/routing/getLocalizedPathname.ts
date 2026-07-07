import { getRelativeLocaleUrl } from "astro:i18n";
import type { Locale } from "../i18nConfig";
import { locales } from "../i18nConfig";
import { defaultLocale } from "../i18nConfig";
import { routeTranslations } from "../routeTranslations";

export async function getLocalizedPathname(
  locale: Locale,
  url: URL,
): Promise<string> {
  const pathname = url.pathname;
  const segments = pathname.split("/").filter(Boolean);

  let currentLocale: Locale = defaultLocale;
  let neutralSegments = segments;

  if (locales.includes(segments[0] as Locale)) {
    currentLocale = segments[0] as Locale;
    neutralSegments = segments.slice(1);
  }

  const currentRoutes = routeTranslations[currentLocale] || {};
  const reverseMap: Record<string, string> = {};

  for (const [key, val] of Object.entries(currentRoutes)) {
    reverseMap[val] = key;
  }

  const targetRoutes = routeTranslations[locale] || {};

  const mapped = neutralSegments.map(
    (seg) => targetRoutes[reverseMap[seg]] ?? seg,
  );

  return getRelativeLocaleUrl(locale, mapped.join("/"));
}
