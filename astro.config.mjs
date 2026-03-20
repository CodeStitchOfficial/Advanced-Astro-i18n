import { defineConfig, fontProviders } from "astro/config";
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
	fonts: [
		// Install your custom font from https://fontsource.org/fonts/
		// and run the specific install command for that font
		// e.g. `npm install @fontsource-variable/roboto` 
		// then update the name below and the weights/styles as needed
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
