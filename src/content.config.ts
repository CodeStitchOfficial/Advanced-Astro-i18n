// 1. Import utilities from `astro:content`
import { z, defineCollection, reference } from "astro:content";
import { glob } from 'astro/loaders';

// 2. Define a `type` and `schema` for each collection
const blogsCollection = defineCollection({
		loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/blog" }),	
		schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			author: z.string(),
			date: z.date(),
			tags: z.array(z.string()),
			image: image(),
			imageAlt: z.string(),
			defaultLocaleVersion: reference("blog").optional(),
		}),
});

// 3. Export a single `collections` object to register your collection(s)
// Note: You can use defineCollection() as many times as you want to create multiple schemas. 
// All collections must be exported from inside the single collections object.
export const collections = {
	blog: blogsCollection,
};