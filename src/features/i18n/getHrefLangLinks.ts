import { locales, localeMap } from "./i18nConfig";
import { getLocalizedPathname } from "./routing/getLocalizedPathname";

export async function getHrefLangLinks(url: URL) {
  return Promise.all(
    locales.map(async (locale) => ({
      hreflang: localeMap[locale],
      href: new URL(await getLocalizedPathname(locale, url), url.origin).href,
    })),
  );
}
