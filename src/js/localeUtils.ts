import { locales, defaultLocale, type Locale } from "@config/siteSettings";
import slugify from "slugify";

/** Resolve a nav label that may be a plain string or a locale-keyed record. */
export function resolveNavLabel(
	label: string | Partial<Record<Locale, string>>,
	locale: Locale,
): string {
	if (typeof label === "string") return label;
	return label[locale] ?? label[defaultLocale] ?? Object.values(label)[0] ?? "";
}

/** Extract locale from a URL pathname. Returns defaultLocale if no locale prefix found. */
export function getLocaleFromUrl(url: URL): Locale {
	const [, segment] = url.pathname.split("/");
	if (locales.includes(segment as Locale)) {
		return segment as Locale;
	}
	return defaultLocale;
}

/** Filter a content collection array to entries whose ID starts with the given locale prefix. */
export function filterCollectionByLanguage<T extends { id: string }>(
	collection: T[],
	locale: Locale,
): T[] {
	return collection.filter((entry) => entry.id.startsWith(`${locale}/`));
}

/** Get the URL slug for a blog post. Uses the frontmatter permalink if set, otherwise auto-generates from the title. */
export function getPostSlug(post: {
	data: { permalink?: string; title: string };
}): string {
	return (
		post.data.permalink ??
		slugify(post.data.title, { lower: true, strict: true })
	);
}
