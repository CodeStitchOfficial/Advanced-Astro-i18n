// AFTER DELETING I18N THIS BECOMES THE MAIN getSiteContext FILE
import { getContent } from "./getContent";

export async function getSiteContext(url: URL) {
  const content = await getContent("en");

  return {
    locale: "en",
    lang: "en",
    content,
    alternates: [],
    currentHreflang: "en-US",
    ogLocale: "en_US",
  };
}
