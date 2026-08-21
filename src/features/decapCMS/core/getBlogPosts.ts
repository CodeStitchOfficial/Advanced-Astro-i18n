import { getCollection } from "astro:content";
import { features } from "src/features/featuresFlags";
import { filterCollectionByLanguage } from "src/features/i18n/localeUtils";

export async function getBlogPosts(locale) {
  const allPosts = await getCollection("blog");

  if (!features.i18n) {
    return allPosts;
  }

  return filterCollectionByLanguage(allPosts, locale);
}
