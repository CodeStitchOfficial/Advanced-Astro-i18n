import { getCollection } from "astro:content";

export async function getBlogPosts(locale) {
  const allPosts = await getCollection("blog");

  return allPosts;
}
