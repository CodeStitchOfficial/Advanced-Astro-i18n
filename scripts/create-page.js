import { existsSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import { slugify, titleCase, insertIntoLocaleBlock } from "./utils/transforms.js";
import { readI18nConfig } from "./utils/read-i18n-config.js";
import { checkFeatureFlagBeforeRun } from "./utils/feature-flags.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = process.env.SCRIPT_ROOT ?? join(__dirname, "..");


const i18nDisabled = checkFeatureFlagBeforeRun(
	root,
	"i18n",
	"i18n"
);

const i18nEnabled = !i18nDisabled;

// ─── Client data ──────────────────────────────────────────────────────────────

function readClientData() {
	const clientPath = join(root, "src", "data", "client.ts");
	const siteConfigPath = join(root, "src", "data", "siteConfig.ts");
	const businessName = existsSync(clientPath)
		? readFileSync(clientPath, "utf8").match(/BUSINESS\s*=\s*\{[\s\S]*?name:\s*["']([^"']+)["']/)?.[1] ?? null
		: null;
	const siteTitle = existsSync(siteConfigPath)
		? readFileSync(siteConfigPath, "utf8").match(/SITE\s*=\s*\{[\s\S]*?title:\s*["']([^"']+)["']/)?.[1] ?? null
		: null;
	if (!businessName && !siteTitle) return null;
	return {
		businessName,
		siteTitle,
	};
}


function registerNavItem(slugMap, labels) {
	const navPath = join(
		root,
		"src",
		"data",
		"navData.json"
	);

	if (!existsSync(navPath)) {
		return "missing";
	}

	const nav = JSON.parse(
		readFileSync(navPath, "utf8")
	);

	if (nav.some(item => item.key === slugMap.en)) {
		return "skipped";
	}

	nav.push({
		key: slugMap.en,
		urls: Object.fromEntries(
			Object.entries(slugMap)
				.map(([locale, slug]) => [
					locale,
					`/${slug}`
				])
		),
		label: labels,
		children: []
	});


	writeFileSync(
		navPath,
		JSON.stringify(nav, null, "\t") + "\n",
		"utf8"
	);


	return "registered";
}

// ─── Locale detection ─────────────────────────────────────────────────────────

function detectSecondaryLocales(defaultLocale) {
	const pagesDir = join(root, "src", "pages");

	if (!existsSync(pagesDir)) return [];

	return readdirSync(pagesDir, { withFileTypes: true })
		.filter(
			(e) =>
				e.isDirectory() &&
				/^[a-z]{2}(-[a-z]{2})?$/i.test(e.name) &&
				e.name !== defaultLocale
		)
		.map((e) => e.name);
}

// ─── Route translations ────────────────────────────────────────────────────────

function registerInRouteTranslations(defaultSlug, slugMap) {
	const rtPath = join(
		root,
		"src",
		"features",
		"i18n",
		"routeTranslations.ts"
	);
	if (!existsSync(rtPath)) return "missing";

	let content = readFileSync(rtPath, "utf8");
	let anyInserted = false;

	for (const [locale, localeSlug] of Object.entries(slugMap)) {
		const updated = insertIntoLocaleBlock(content, locale, defaultSlug, localeSlug);
		if (updated !== null) {
			content = updated;
			anyInserted = true;
		}
	}

	if (!anyInserted) return "skipped";
	writeFileSync(rtPath, content, "utf8");
	return "registered";
}

// ─── Template helpers ─────────────────────────────────────────────────────────

function applyTemplate(template, title) {
	// Handles both the standard placeholder and the legacy French one
	return template.replaceAll("Page Title", title).replaceAll("Titre de la page", title);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
	const client = readClientData();
	if (client?.businessName) console.log(`Client: ${client.businessName}`);

	const input = process.argv[2];
	const secondaryInput = process.argv[3]; // optional fast-path for first secondary locale

	if (!input) {
		console.log(
			'Please provide page names. Example: npm run create-page -- "Contact, About, Services"',
		);
		process.exit(1);
	}

	// ── Locale config ─────────────────────────────────────────────────────────
	const i18nConfig = i18nEnabled
		? readI18nConfig(root)
		: null;
	const defaultLocale =
		i18nConfig?.defaultLocale ?? "en";
	const secondaryLocales = i18nEnabled
		? detectSecondaryLocales(defaultLocale)
		: [];

	// ── Templates ─────────────────────────────────────────────────────────────
	const defaultTemplatePath = join(root, "src", "pages", "_template.astro");
	if (!existsSync(defaultTemplatePath)) {
		console.log(`Template not found: src/pages/_template.astro`);
		process.exit(1);
	}
	const defaultTemplate = readFileSync(defaultTemplatePath, "utf8");

	const secondaryTemplates = {};
	for (const locale of secondaryLocales) {
		secondaryTemplates[locale] = readFileSync(
			join(root, "src", "pages", locale, "_template.astro"),
			"utf8",
		);
	}

	// ── Parse inputs ──────────────────────────────────────────────────────────
	const pages = input.split(",").map((p) => p.trim()).filter(Boolean);

	// Fast-path: secondary locale names supplied via argv[3] (one locale, backward-compat)
	const fastPathNames = secondaryInput
		? secondaryInput.split(",").map((p) => p.trim()).filter(Boolean)
		: null;

	// ── Readline (only opened when interactive prompts are needed) ────────────
	const needsPrompts = secondaryLocales.length > 0 && !fastPathNames && process.stdin.isTTY;
	let ask = null;
	let rl = null;

	if (needsPrompts) {
		rl = readline.createInterface({ input: process.stdin, output: process.stdout });
		const lineQueue = [];
		const waiters = [];
		rl.on("line", (line) => {
			if (waiters.length > 0) waiters.shift()(line);
			else lineQueue.push(line);
		});
		ask = (q) => {
			process.stdout.write(q);
			if (lineQueue.length > 0) return Promise.resolve(lineQueue.shift());
			return new Promise((resolve) => waiters.push(resolve));
		};
	}

	// ── Process pages ─────────────────────────────────────────────────────────
	for (let idx = 0; idx < pages.length; idx++) {
		const page = pages[idx];
		const defaultSlug = slugify(page);
		if (!defaultSlug) continue;

		const defaultTitle = titleCase(page);

		// Build slug/title map for all locales
		const slugMap = { [defaultLocale]: defaultSlug };
		const titleMap = { [defaultLocale]: defaultTitle };

		if (secondaryLocales.length > 0) {
			if (fastPathNames) {
				// argv[3] applies to the first secondary locale; rest default to same slug
				const [firstLocale, ...restLocales] = secondaryLocales;
				const secName = fastPathNames[idx] ?? page;
				slugMap[firstLocale] = slugify(secName) || defaultSlug;
				titleMap[firstLocale] = titleCase(secName);
				for (const locale of restLocales) {
					slugMap[locale] = defaultSlug;
					titleMap[locale] = defaultTitle;
				}
			} else if (ask) {
				// Interactive: prompt for each secondary locale
				console.log(`\nPage: "${page}" (${defaultLocale} slug: "${defaultSlug}")`);
				for (const locale of secondaryLocales) {
					const answer = (await ask(`  ${locale} name [${page}]: `)).trim();
					const secName = answer || page;
					slugMap[locale] = slugify(secName) || defaultSlug;
					titleMap[locale] = titleCase(secName);
				}
			} else {
				// Non-TTY with no argv[3]: use default for all secondary locales
				for (const locale of secondaryLocales) {
					slugMap[locale] = defaultSlug;
					titleMap[locale] = defaultTitle;
				}
			}
		}

		// Default locale page
		const defaultPagePath = join(root, "src", "pages", `${defaultSlug}.astro`);
		if (existsSync(defaultPagePath)) {
			console.log(`Skipped src/pages/${defaultSlug}.astro — already exists`);
		} else {
			writeFileSync(defaultPagePath, applyTemplate(defaultTemplate, defaultTitle), "utf8");
			console.log(`Created src/pages/${defaultSlug}.astro`);
		}

		// Secondary locale pages
		for (const locale of secondaryLocales) {
			const localeSlug = slugMap[locale];
			const localeTitle = titleMap[locale];
			const localePath = join(root, "src", "pages", locale, `${localeSlug}.astro`);
			if (existsSync(localePath)) {
				console.log(`Skipped src/pages/${locale}/${localeSlug}.astro — already exists`);
			} else {
				writeFileSync(localePath, applyTemplate(secondaryTemplates[locale], localeTitle), "utf8");
				console.log(`Created src/pages/${locale}/${localeSlug}.astro`);
			}
		}

		// ── navData.json ───────────────────────────────────────
		const navStatus = registerNavItem(slugMap, titleMap);

		if (navStatus === "registered") {
			console.log("Registered in navData.json");
		}
		// ── routeTranslations.ts ───────────────────────────────────────────────────
		if (i18nEnabled) {
			const rtStatus = registerInRouteTranslations(
				defaultSlug,
				slugMap
			);

			if (rtStatus === "registered") {
				console.log("Registered in routeTranslations.ts");
			} else if (rtStatus === "skipped") {
				console.log(
					`Skipped routeTranslations.ts — "${defaultSlug}" already registered`
				);
			}
		}
	}

	if (rl) rl.close();
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
