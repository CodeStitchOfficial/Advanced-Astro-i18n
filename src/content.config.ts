// 1. Import utilities from `astro:content`
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

// 2. Define a `type` and `schema` for each collection
const blogsCollection = defineCollection({
	loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/blog" }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			permalink: z
				.string()
				.regex(
					/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
					"Permalink must be lowercase alphanumeric with hyphens only (e.g. my-post-title)",
				),
			description: z.string(),
			author: z.string(),
			date: z.date(),
			featured: z.boolean().optional(),
			image: image(),
			imageAlt: z.string(),
			mappingKey: z
				.string()
				.regex(
					/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
					"MappingKey must be lowercase alphanumeric with hyphens only (e.g. my-key)",
				),
		}),
});

// 3. Export a single `collections` object to register your collection(s)
// Note: You can use defineCollection() as many times as you want to create multiple schemas.
// All collections must be exported from inside the single collections object.
export const collections = {
	blog: blogsCollection,
};
