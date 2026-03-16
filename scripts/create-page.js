import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { slugify, titleCase, insertIntoLocaleBlock } from "./utils/transforms.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = process.env.SCRIPT_ROOT ?? join(__dirname, "..");

// ─── Client data ──────────────────────────────────────────────────────────────

function readClientData() {
	const clientPath = join(root, "src", "data", "client.ts");
	if (!existsSync(clientPath)) return null;
	const content = readFileSync(clientPath, "utf8");
	const nameMatch = content.match(/BUSINESS\s*=\s*\{[\s\S]*?name:\s*["']([^"']+)["']/);
	const titleMatch = content.match(/SITE\s*=\s*\{[\s\S]*?title:\s*["']([^"']+)["']/);
	return {
		businessName: nameMatch?.[1] ?? null,
		siteTitle: titleMatch?.[1] ?? null,
	};
}

// ─── Route translations ────────────────────────────────────────────────────────

function registerInRouteTranslations(slug, frSlug) {
	const rtPath = join(root, "src", "config", "routeTranslations.ts");
	if (!existsSync(rtPath)) return "missing";

	let content = readFileSync(rtPath, "utf8");

	const enResult = insertIntoLocaleBlock(content, "en", slug, slug);
	const frResult = insertIntoLocaleBlock(
		enResult ?? content,
		"fr",
		slug,
		frSlug,
	);

	if (enResult === null && frResult === null) return "skipped";

	const updated = frResult ?? enResult ?? content;
	writeFileSync(rtPath, updated, "utf8");
	return "registered";
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
	const client = readClientData();
	if (client?.businessName) console.log(`Client: ${client.businessName}`);

	const input = process.argv[2];
	const frInput = process.argv[3];

	if (!input) {
		console.log(
			'Please provide page names. Example: npm run create-page -- "Contact, About, Services"',
		);
		process.exit(1);
	}

	const enTemplatePath = join(root, "src", "pages", "_template.astro");
	const frTemplatePath = join(root, "src", "pages", "fr", "_template.astro");

	if (!existsSync(enTemplatePath)) {
		console.log(`Template not found: ${enTemplatePath}`);
		process.exit(1);
	}

	const enTemplate = readFileSync(enTemplatePath, "utf8");
	const hasFr = existsSync(frTemplatePath);
	const frTemplate = hasFr ? readFileSync(frTemplatePath, "utf8") : null;

	const pages = input
		.split(",")
		.map((p) => p.trim())
		.filter(Boolean);

	const frNames = frInput
		? frInput.split(",").map((p) => p.trim()).filter(Boolean)
		: [];

	const frSlugs = frNames.map(slugify);

	for (let idx = 0; idx < pages.length; idx++) {
		const page = pages[idx];
		const slug = slugify(page);
		if (!slug) continue;

		const title = titleCase(page);
		const frName = frNames[idx] ?? page;
		const frTitle = titleCase(frName);
		const frSlug = frSlugs[idx] ?? slug;

		// EN page
		const enPath = join(root, "src", "pages", `${slug}.astro`);
		if (existsSync(enPath)) {
			console.log(`Skipped src/pages/${slug}.astro — already exists`);
		} else {
			const content = enTemplate.replaceAll("Page Title", title);
			writeFileSync(enPath, content, "utf8");
			console.log(`Created src/pages/${slug}.astro`);
		}

		// FR page (only if the fr/ directory and template exist)
		if (frTemplate) {
			const frPath = join(root, "src", "pages", "fr", `${frSlug}.astro`);
			if (existsSync(frPath)) {
				console.log(
					`Skipped src/pages/fr/${frSlug}.astro — already exists`,
				);
			} else {
				const content = frTemplate.replaceAll("Titre de la page", frTitle);
				writeFileSync(frPath, content, "utf8");
				console.log(`Created src/pages/fr/${frSlug}.astro`);
			}
		}

		// routeTranslations.ts
		const rtStatus = registerInRouteTranslations(slug, frSlug);
		if (rtStatus === "registered") {
			console.log(`Registered in routeTranslations.ts`);
		} else if (rtStatus === "skipped") {
			console.log(
				`Skipped routeTranslations.ts — "${slug}" already registered`,
			);
		}

	}
}

main();
