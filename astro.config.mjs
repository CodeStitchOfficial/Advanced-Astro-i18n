import { defineConfig } from "astro/config";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
	site: "https://www.yourwebsite.com", // update me!
	i18n: {
		defaultLocale: "en",
		locales: ["en", "fr"],
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
					fr: "fr-FR",
				},
			},
		}),
	],
});
