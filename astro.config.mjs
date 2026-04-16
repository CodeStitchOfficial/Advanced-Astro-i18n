import { defineConfig, fontProviders } from "astro/config";
import { execSync } from "child_process";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";

/**
 * Returns the last git commit date for a given file path.
 * Falls back to undefined if git is unavailable or the file has no history.
 */
function gitLastmod(filePath) {
	try {
		const log = execSync(`git log -1 --format="%cI" -- "${filePath}"`, {
			encoding: "utf-8",
		}).trim();
		return log ? new Date(log) : undefined;
	} catch {
		return undefined;
	}
}

export default defineConfig({
	site: "https://www.yourwebsite.com", // update me!
	i18n: {
		defaultLocale: "nl",
		locales: ["nl"],
		routing: {
			prefixDefaultLocale: false,
		},
	},
	trailingSlash: "always",
	integrations: [
		icon(),
		sitemap({
			filter: (page) => !page.includes("/admin"),
			serialize(item) {
				// Derive a relative file path from the page URL to look up git history.
				// Pages without a matching file simply get no lastmod.
				try {
					const url = new URL(item.url);
					let pathname = url.pathname.replace(/\/$/, "") || "/index";
					const candidates = [
						`src/pages${pathname}.astro`,
						`src/pages${pathname}/index.astro`,
					];
					for (const candidate of candidates) {
						const lastmod = gitLastmod(candidate);
						if (lastmod) {
							return { ...item, lastmod };
						}
					}
				} catch {
					// ignore
				}
				return item;
			},
		}),
	],
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: "Inter",
			cssVariable: "--font-inter",
			options: {
				variants: [
					{
						src: ["./src/assets/fonts/inter-v20-latin-regular.woff2"],
						weight: "400",
						style: "normal",
					},
					{
						src: ["./src/assets/fonts/inter-v20-latin-italic.woff2"],
						weight: "400",
						style: "italic",
					},
					{
						src: ["./src/assets/fonts/inter-v20-latin-500.woff2"],
						weight: "500",
						style: "normal",
					},
					{
						src: ["./src/assets/fonts/inter-v20-latin-700.woff2"],
						weight: "700",
						style: "normal",
					},
				],
			},
		},
		{
			provider: fontProviders.fontsource(),
			name: "Cal Sans",
			cssVariable: "--font-cal-sans",
			options: {
				variants: [
					{
						src: ["./src/assets/fonts/cal-sans-v2-latin-regular.woff2"],
						weight: "400",
						style: "normal",
					},
				],
			},
		},
		{
			provider: fontProviders.fontsource(),
			name: "Funnel Display",
			cssVariable: "--font-funnel-display",
			options: {
				variants: [
					{
						src: ["./src/assets/fonts/funnel-display-v3-latin-700.woff2"],
						weight: "700",
						style: "normal",
					},
				],
			},
		},
	],
});
