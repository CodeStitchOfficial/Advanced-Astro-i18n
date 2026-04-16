import { defineConfig, fontProviders } from "astro/config";
import icon from "astro-icon";
import sitemap from "@astrojs/sitemap";

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
