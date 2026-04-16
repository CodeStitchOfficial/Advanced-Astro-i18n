import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
	const siteUrl = site ? site.href.replace(/\/$/, "") : "https://www.yourwebsite.com";
	return new Response(
		[
			"User-agent: *",
			"Allow: /",
			"Disallow: /admin/",
			"",
			`Sitemap: ${siteUrl}/sitemap-index.xml`,
		].join("\n"),
		{
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		},
	);
};
