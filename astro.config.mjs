import { defineConfig, fontProviders } from "astro/config";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
	site: "https://www.yourwebsite.com", // update me!
	i18n: {
		defaultLocale: "en",
		locales: ["en", "es"],
		routing: {
			prefixDefaultLocale: false,
		},
	},
	trailingSlash: "always",
	integrations: [
		icon(),
		sitemap({
			filter: (page) => !page.includes("/admin"),
			i18n: {
				defaultLocale: "en",
				locales: {
					en: "en-US",
					es: "es-ES",
				},
			},
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Inter",
			cssVariable: "--font-primary",
			fallbacks: ["Arial", "sans-serif"],
			weights: [400, 500, 600, 700],
			styles: ["normal"],
		},
		{
			provider: fontProviders.google(),
			name: "Plus Jakarta Sans",
			cssVariable: "--font-heading",
			fallbacks: ["Arial", "sans-serif"],
			weights: [600, 700, 800],
			styles: ["normal"],
		},
	],
});
