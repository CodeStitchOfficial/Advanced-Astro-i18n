import type { Locale } from "../i18nConfig";
import { defaultLocale } from "../i18nConfig";
import { routeTranslations } from "../routeTranslations";

export function getLocalizedRoute(locale: Locale, baseRoute: string): string {
  const trimmed = baseRoute.replace(/^\/|\/$/g, "");

  if (trimmed === "") {
    return locale === defaultLocale ? "/" : `/${locale}/`;
  }

  const segments = trimmed.split("/");
  const localeRoutes = routeTranslations[locale] || {};

  const translated = segments.map((seg) => localeRoutes[seg] || seg);
  const path = translated.join("/");

  return locale === defaultLocale ? `/${path}/` : `/${locale}/${path}/`;
}
