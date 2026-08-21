import { getCollection } from "astro:content";
import type { Locale } from "../i18nConfig";
import { locales, defaultLocale } from "../i18nConfig";
import { localizedCollections } from "../i18nConfig";
import { getPostSlug } from "../../decapCMS/core/blogUtils";
import { routeTranslations } from "../routeTranslations";

let cache: Record<string, Record<string, string>> | null = null;

export async function generateDynamicRouteTranslations() {
  if (cache) return cache;

  const merged: Record<string, Record<string, string>> = {};

  for (const locale of locales) {
    merged[locale] = { ...routeTranslations[locale] };
  }

  for (const [collectionName, collectionLocales] of Object.entries(localizedCollections)) {
    const entries = await getCollection(collectionName as "blog");

    const groups: Record<string, Record<Locale, string>> = {};

    for (const entry of entries) {
      const mappingKey = (entry.data as any).mappingKey;
      if (!mappingKey) continue;

      const locale = entry.id.split("/")[0] as Locale;
      if (!locales.includes(locale)) continue;

      const slug = getPostSlug(entry as any);

      groups[mappingKey] ??= {} as any;
      groups[mappingKey][locale] = slug;
    }

    for (const group of Object.values(groups)) {
      const defaultSlug = group[defaultLocale];
      if (!defaultSlug) continue;

      for (const locale of locales) {
        const localized = group[locale];
        if (!localized) continue;

        const base = localizedCollections.blog[defaultLocale];
        const target = localizedCollections.blog[locale];

        const key = `${base}/${defaultSlug}`;
        merged[locale][key] = `${target}/${localized}`;
      }
    }
  }

  cache = merged;
  return merged;
}
