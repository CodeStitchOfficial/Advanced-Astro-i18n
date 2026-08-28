import { getContent } from "./getContent";
import { getHrefLangLinks } from "../features/i18n/getHrefLangLinks";
import { getLocaleFromUrl, toOgLocale } from "../features/i18n/localeUtils";
import { localeMap } from "../features/i18n/i18nConfig";

export async function getSiteContext(url: URL) {
  const locale = getLocaleFromUrl(url);

  const [content, alternates] = await Promise.all([
    getContent(locale),
    getHrefLangLinks(url),
  ]);

  const currentHreflang = localeMap[locale];
  const ogLocale = toOgLocale(currentHreflang ?? "en-US");

  return {
    locale,
    lang: locale,
    content,
    alternates,
    currentHreflang,
    ogLocale,
  };
}
