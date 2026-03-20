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
		// Option 1: Fontsource (uncomment this and comment out Option 1 to use)
		// You must visit https://fontsource.org/fonts/roboto/install
		// and run the specific install command - no need to change anything else
		// {
		// 	provider: fontProviders.fontsource(),
		// 	name: "Roboto",
		// 	cssVariable: "--font-primary",
		// 	fallbacks: ["Arial", "sans-serif"],
		// 	weights: [400, 700, 900],
		// 	styles: ["normal"],
		// },
		// Option 2: local files /src/assets/fonts (uncomment this and comment out Option 1 to use)
		{
			provider: fontProviders.local(),
			name: "Roboto",
			cssVariable: "--font-primary",
			fallbacks: ["Arial", "sans-serif"],
			formats: ["woff2", "woff"],
			options: {
				variants: [
					{
						src: [
							"./src/assets/fonts/roboto-v29-latin-regular.woff2",
							"./src/assets/fonts/roboto-v29-latin-regular.woff",
						],
						weight: 400,
						style: "normal",
					},
					{
						src: [
							"./src/assets/fonts/roboto-v29-latin-700.woff2",
							"./src/assets/fonts/roboto-v29-latin-700.woff",
						],
						weight: 700,
						style: "normal",
					},
					{
						src: [
							"./src/assets/fonts/roboto-v29-latin-900.woff2",
							"./src/assets/fonts/roboto-v29-latin-900.woff",
						],
						weight: 900,
						style: "normal",
					},
				],
			},
		},

	],
});
