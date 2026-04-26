import { SITE, BUSINESS } from "@data/client";

export function getLocalBusinessSchema(origin) {
	const sameAs = [];
	if (BUSINESS.socials?.facebook) sameAs.push(BUSINESS.socials.facebook);
	if (BUSINESS.socials?.instagram) sameAs.push(BUSINESS.socials.instagram);

	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "WebSite",
				"@id": `${SITE.url}/#website`,
				name: SITE.title,
				url: SITE.url,
				description: SITE.description,
				inLanguage: SITE.locale,
				potentialAction: {
					"@type": "SearchAction",
					target: {
						"@type": "EntryPoint",
						urlTemplate: `${SITE.url}/?s={search_term_string}`,
					},
					"query-input": "required name=search_term_string",
				},
			},
			{
				"@type": "LocalBusiness",
				"@id": `${SITE.url}/#business`,
				name: BUSINESS.name,
				url: SITE.url,
				logo: {
					"@type": "ImageObject",
					"@id": `${SITE.url}/#logo`,
					url: origin + BUSINESS.logo,
					contentUrl: origin + BUSINESS.logo,
				},
				image: { "@id": `${SITE.url}/#logo` },
				email: BUSINESS.email,
				telephone: BUSINESS.phoneForTel,
				address: {
					"@type": "PostalAddress",
					streetAddress: `${BUSINESS.address.lineOne}, ${BUSINESS.address.lineTwo}`,
					addressLocality: BUSINESS.address.city,
					addressRegion: BUSINESS.address.state,
					postalCode: BUSINESS.address.zip,
				},
				sameAs: sameAs,
				inLanguage: SITE.locale,
			},
		],
	};
}
