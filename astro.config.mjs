import { defineConfig, fontProviders } from "astro/config";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";
import { defaultLocale as siteDefaultLocale, locales as siteLocales, localeMap } from "./src/config/siteSettings.ts";

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
			i18n: siteLocales.length > 1 ? {
				defaultLocale: siteDefaultLocale,
				locales: Object.fromEntries(siteLocales.map((l) => [l, localeMap[l]])),
			} : undefined,
		}),
	],
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: "Roboto",
			cssVariable: "--font-primary",
			fallbacks: ["Arial", "sans-serif"],
			weights: [400, 700, 900],
			styles: ["normal"],
		},
	],
});
