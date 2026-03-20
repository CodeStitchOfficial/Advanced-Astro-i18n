import { SITE, BUSINESS, OG } from "@data/client";

/**
 * Generates a BlogPosting JSON-LD schema object for a blog post.
 * @param {object} post - The Astro content collection entry
 * @param {string} locale - The locale string (e.g. "en", "fr")
 * @param {string} postUrl - The full URL of the post
 */
export function getBlogPostingSchema(post, locale, postUrl) {
	const { title, description, date, author, image } = post.data;

	return {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		mainEntityOfPage: {
			"@type": "WebPage",
			"@id": postUrl,
		},
		headline: title,
		description: description ?? SITE.description,
		image: image ? `${SITE.url}${image.src}` : `${SITE.url}${OG.image}`,
		author: {
			"@type": "Person",
			name: author ?? BUSINESS.name,
		},
		publisher: {
			"@type": "Organization",
			name: BUSINESS.name,
			logo: {
				"@type": "ImageObject",
				url: `${SITE.url}${BUSINESS.logo}`,
			},
		},
		datePublished: date ? new Date(date).toISOString() : undefined,
		inLanguage: locale,
		url: postUrl,
	};
}
