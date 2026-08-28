import slugify from "slugify";

/** Get the URL slug for a blog post. Uses the frontmatter permalink if set, otherwise auto-generates from the title. */
export function getPostSlug(post: {
  data: { permalink?: string; title: string };
}): string {
  return (
    post.data.permalink ??
    slugify(post.data.title, { lower: true, strict: true })
  );
}
