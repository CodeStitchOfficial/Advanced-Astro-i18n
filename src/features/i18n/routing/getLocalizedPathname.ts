import { getRelativeLocaleUrl } from "astro:i18n";
import type { Locale } from "../i18nConfig";
import { locales, defaultLocale } from "../i18nConfig";
import { generateDynamicRouteTranslations } from "../collections/generateDynamicRouteTranslations";

export async function getLocalizedPathname(locale: Locale, url: URL): Promise<string> {
  const allRoutes = await generateDynamicRouteTranslations();

  const pathname = url.pathname;
  const segments = pathname.split("/").filter(Boolean);

  let currentLocale: Locale = defaultLocale;
  let neutralSegments = segments;

  if (locales.includes(segments[0] as Locale)) {
    currentLocale = segments[0] as Locale;
    neutralSegments = segments.slice(1);
  }

  const currentRoutes = allRoutes[currentLocale] || {};
  const reverseMap: Record<string, string> = {};

  for (const [key, val] of Object.entries(currentRoutes)) {
    reverseMap[val] = key;
  }

  const targetRoutes = allRoutes[locale] || {};

  // Full-path lookup first — handles compound routes like blog/<slug>
  const neutralPath = neutralSegments.join("/");
  const fullKey = reverseMap[neutralPath];
  if (fullKey !== undefined && targetRoutes[fullKey] !== undefined) {
    return getRelativeLocaleUrl(locale, targetRoutes[fullKey]);
  }

  // Per-segment fallback for simple static routes
  const mapped = neutralSegments.map((seg) => targetRoutes[reverseMap[seg]] ?? seg);

  return getRelativeLocaleUrl(locale, mapped.join("/"));
}
