import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function titleCase(name) {
	return name
		.split(/\s+/)
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
		.join(" ");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
	const input = process.argv[2];

	if (!input) {
		console.log('Please provide page names. Example: npm run create-page -- "Contact, About, Services"');
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

	for (const page of pages) {
		const slug = slugify(page);
		if (!slug) continue;

		const title = titleCase(page);

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
			const frPath = join(root, "src", "pages", "fr", `${slug}.astro`);
			if (existsSync(frPath)) {
				console.log(`Skipped src/pages/fr/${slug}.astro — already exists`);
			} else {
				const content = frTemplate.replaceAll("Titre de la page", title);
				writeFileSync(frPath, content, "utf8");
				console.log(`Created src/pages/fr/${slug}.astro`);
			}
		}
	}
}

main();
