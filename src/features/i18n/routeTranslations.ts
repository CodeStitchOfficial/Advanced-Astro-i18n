import navData from "@data/navData.json";
import type { Locale } from "./i18nConfig.ts";

type NavItem = {
  key: string;
  urls: Record<string, string>;
  children?: NavItem[];
};

function buildRoutes(
  items: NavItem[],
  result: Record<string, Record<string, string>> = {},
) {
  for (const item of items) {
    for (const [locale, url] of Object.entries(item.urls)) {
      result[locale] ??= {};

      result[locale][item.key] = url.replace(/^\//, "");
    }

    if (item.children?.length) {
      buildRoutes(item.children, result);
    }
  }

  return result;
}

export const routeTranslations: Record<
  Locale,
  Record<string, string>
> = buildRoutes(navData as NavItem[]);
