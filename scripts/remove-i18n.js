/**
 * remove-i18n.js
 *
 * Removes multi-language (i18n) support from the Advanced Astro i18n kit,
 * keeping only the default locale. This script:
 *   - Removes the LanguageSwitch component directory
 *   - Removes BrowserLanguageRedirect from the home page
 *   - Removes the language switcher from the Settings component
 *   - Removes hreflang alternate links from Meta
 *   - Simplifies astro.config.mjs, siteSettings.ts, and routeTranslations.ts
 *   - Moves non-default locale pages, locales, and content to scripts/deleted/
 *   - Moves localePreference.ts to scripts/deleted/
 *
 * Run with: npm run remove-i18n
 */

import { promises as fs } from "fs";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import { readI18nConfig } from "./utils/read-i18n-config.js";
import { removeObjectKey } from "./utils/transforms.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = process.env.SCRIPT_ROOT ?? join(__dirname, "..");

// ─── Guard ────────────────────────────────────────────────────────────────────

const markerPath = join(root, ".i18n-removed");
if (existsSync(markerPath)) {
	console.log("i18n support has already been removed (.i18n-removed marker exists).");
	process.exit(0);
}

// ─── Confirmation prompt ──────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question(
	"\n⚠️  This will permanently remove multi-language (i18n) support from the project.\n" +
	"   Non-default locale files will be moved to scripts/deleted/ for safekeeping.\n\n" +
	"Proceed? (y/n): ",
	(answer) => {
		rl.close();
		if (answer.trim().toLowerCase() !== "y") {
			console.log("Aborted. No files were changed.");
			process.exit(0);
		}
		runRemoval().catch((err) => {
			console.error("Fatal error:", err);
			process.exit(1);
		});
	},
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function read(relPath) {
	const abs = join(root, relPath);
	if (!existsSync(abs)) return null;
	return readFileSync(abs, "utf8");
}

function write(relPath, content) {
	writeFileSync(join(root, relPath), content, "utf8");
	console.log(`  updated  ${relPath}`);
}

function replaceInFile(relPath, from, to) {
	const content = read(relPath);
	if (content === null) return;
	const updated = typeof from === "string" ? content.replaceAll(from, to) : content.replace(from, to);
	if (updated !== content) write(relPath, updated);
}

async function moveToDeleted(relSrc, deletedName) {
	const abs = join(root, relSrc);
	if (!existsSync(abs)) return;
	const deletedDir = join(root, "scripts", "deleted");
	await fs.mkdir(deletedDir, { recursive: true });
	const dest = join(deletedDir, deletedName);
	if (existsSync(dest)) await fs.rm(dest, { recursive: true, force: true });
	await fs.rename(abs, dest);
	console.log(`  moved    ${relSrc} → scripts/deleted/${deletedName}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function runRemoval() {
	// Read current i18n config to know which locales to remove
	const i18n = readI18nConfig(root);
	if (!i18n) {
		console.error("Could not read i18n config from src/config/siteSettings.ts. Exiting.");
		process.exit(1);
	}
	const { defaultLocale, locales } = i18n;
	const nonDefaultLocales = locales.filter((l) => l !== defaultLocale);

	let astroConfig;
	try {
		astroConfig = readFileSync(join(root, "astro.config.mjs"), "utf-8");
	} catch { astroConfig = null; }
	const prefixDefaultLocale = astroConfig
		? astroConfig.match(/prefixDefaultLocale:\s*(true|false)/)?.[1] === "true"
		: false;

	console.log(`\nDefault locale: ${defaultLocale}`);
	if (nonDefaultLocales.length > 0) {
		console.log(`Removing locales: ${nonDefaultLocales.join(", ")}`);
	}
	console.log();

	// ── Phase A: Remove LanguageSwitch components ──────────────────────────────
	console.log("Phase A: Removing LanguageSwitch components...");
	await moveToDeleted("src/components/LanguageSwitch", "LanguageSwitch");

	// ── Phase B: Remove localePreference.ts ───────────────────────────────────
	console.log("\nPhase B: Removing localePreference.ts...");
	await moveToDeleted("src/js/localePreference.ts", "localePreference.ts");

	// ── Phase C: Settings.astro — remove language switcher ────────────────────
	console.log("\nPhase C: Updating Settings.astro...");
	replaceInFile(
		"src/components/Settings/Settings.astro",
		/import TwoLocalesSelect from "@components\/LanguageSwitch\/TwoLocalesSelect\.astro";\r?\n/,
		"",
	);
	replaceInFile(
		"src/components/Settings/Settings.astro",
		/\t<TwoLocalesSelect \/>\r?\n/,
		"",
	);

	// ── Phase D: index.astro — remove BrowserLanguageRedirect ─────────────────
	console.log("\nPhase D: Updating src/pages/index.astro...");
	replaceInFile(
		"src/pages/index.astro",
		/import BrowserLanguageRedirect from "@components\/LanguageSwitch\/BrowserLanguageRedirect\.astro";\r?\n/,
		"",
	);
	replaceInFile(
		"src/pages/index.astro",
		/\n?<BrowserLanguageRedirect \/>\r?\n/,
		"\n",
	);

	// ── Phase E: astro.config.mjs — remove i18n section ──────────────────────
	console.log("\nPhase E: Updating astro.config.mjs...");
	if (astroConfig !== null) {
		let updated = astroConfig;

		// Remove top-level i18n block
		updated = updated.replace(/\n\ti18n:\s*\{[^}]+\{[^}]*\}[^}]*\},?\n/s, "\n");

		// Remove sitemap i18n property (the i18n: { defaultLocale, locales: {...} } block inside sitemap())
		updated = updated.replace(/,\s*\n\t\t\ti18n:\s*\{[^}]+\{[^}]*\}[^}]*\}/s, "");

		// Remove trailing comma if left before closing brace of sitemap call
		updated = updated.replace(/(filter:[^\n]+),(\s*\))/g, "$1$2");

		if (updated !== astroConfig) write("astro.config.mjs", updated);
	}

	// ── Phase F: siteSettings.ts — simplify to single locale ─────────────────
	console.log("\nPhase F: Updating src/config/siteSettings.ts...");
	const newSettings = `export const locales = ["${defaultLocale}"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "${defaultLocale}";
export const localeMap: Record<Locale, string> = { ${defaultLocale}: "${defaultLocale.toLowerCase()}-${defaultLocale.toUpperCase()}" };
export const languageSwitcherMap: Record<Locale, string> = { ${defaultLocale}: "${defaultLocale.toUpperCase()}" };
`;
	write("src/config/siteSettings.ts", newSettings);

	// ── Phase G: routeTranslations.ts — keep only default locale ──────────────
	console.log("\nPhase G: Updating src/config/routeTranslations.ts...");
	const rtPath = "src/config/routeTranslations.ts";
	let rtContent = read(rtPath);
	if (rtContent !== null) {
		// Remove non-default locale blocks from routeTranslations
		for (const locale of nonDefaultLocales) {
			rtContent = removeObjectKey(rtContent, locale);
		}

		// Remove non-default locale entries from localizedCollections inline values
		// e.g. `{ en: "blog", fr: "blog" }` → `{ en: "blog" }`
		for (const locale of nonDefaultLocales) {
			rtContent = rtContent.replace(
				new RegExp(`,\\s*${locale}:\\s*"[^"]*"`, "g"),
				"",
			);
		}

		// Fix any missing newline left by removeObjectKey (e.g. `},};` → `},\n};`)
		rtContent = rtContent.replace(/,([ \t]*)(}[;\s])/g, ",\n$1$2");

		// Clean up extra blank lines
		rtContent = rtContent.replace(/\n{3,}/g, "\n\n");
		write(rtPath, rtContent);
	}

	// ── Phase H: Meta.astro — remove hreflang links ───────────────────────────
	console.log("\nPhase H: Updating src/components/Meta/Meta.astro...");
	const metaPath = "src/components/Meta/Meta.astro";
	const metaContent = read(metaPath);
	if (metaContent !== null) {
		let updated = metaContent;

		// Remove standalone getLocalizedPathname import line
		updated = updated.replace(/^import \{ getLocalizedPathname \} from "@js\/translationUtils";\r?\n/m, "");

		// Remove locales + localeMap import from siteSettings (entire line — both are only used for hreflang)
		updated = updated.replace(/^import \{ locales, localeMap \} from "@config\/siteSettings";\r?\n/m, "");

		// Remove the hrefLangLinks JS generation block
		updated = updated.replace(
			/\n\/\/ Generate hreflang alternate links\nconst hrefLangLinks[\s\S]*?\);\n/,
			"\n",
		);

		// Remove hreflang HTML comment + link tags
		updated = updated.replace(
			/\n<!-- Hreflang alternate links for SEO -->[\s\S]*?hreflang="x-default"[^\n]*\n/,
			"\n",
		);

		if (updated !== metaContent) write(metaPath, updated);
	}

	// ── Phase I: Non-default locale pages ─────────────────────────────────────
	console.log("\nPhase I: Removing non-default locale pages...");
	const pagesDir = join(root, "src", "pages");

	// If prefixDefaultLocale was true, default pages live in src/pages/{defaultLocale}/
	// Move them to root first
	if (prefixDefaultLocale && existsSync(join(pagesDir, defaultLocale))) {
		const srcDir = join(pagesDir, defaultLocale);
		const entries = await fs.readdir(srcDir, { withFileTypes: true });
		for (const e of entries) {
			await fs.rename(join(srcDir, e.name), join(pagesDir, e.name));
		}
		await fs.rm(srcDir, { recursive: true, force: true });
		console.log(`  promoted src/pages/${defaultLocale}/ to root (prefixDefaultLocale was true)`);
	}

	for (const locale of nonDefaultLocales) {
		await moveToDeleted(`src/pages/${locale}`, `pages-${locale}`);
	}

	// ── Phase J: Non-default locale files ─────────────────────────────────────
	console.log("\nPhase J: Removing non-default locale files...");
	for (const locale of nonDefaultLocales) {
		await moveToDeleted(`src/locales/${locale}`, `locales-${locale}`);
	}

	// ── Phase K: Non-default content ──────────────────────────────────────────
	console.log("\nPhase K: Removing non-default locale content...");
	const contentDir = join(root, "src", "content");
	if (existsSync(contentDir)) {
		let collections;
		try { collections = await fs.readdir(contentDir, { withFileTypes: true }); } catch { collections = []; }
		for (const entry of collections) {
			if (!entry.isDirectory()) continue;
			for (const locale of nonDefaultLocales) {
				const src = join(contentDir, entry.name, locale);
				if (existsSync(src)) {
					await moveToDeleted(`src/content/${entry.name}/${locale}`, `content-${entry.name}-${locale}`);
				}
			}
		}
	}

	// ── Phase L: public/admin/config.yml — update if present ──────────────────
	const decapConfigPath = "public/admin/config.yml";
	const decapContent = read(decapConfigPath);
	if (decapContent !== null) {
		console.log("\nPhase L: Updating public/admin/config.yml...");
		let updated = decapContent;
		updated = updated.replace(/locales:\s*\[.*?\]/, `locales: [${defaultLocale}]`);
		updated = updated.replace(/default_locale:\s*\S+/, `default_locale: ${defaultLocale}`);
		if (updated !== decapContent) write(decapConfigPath, updated);
	}

	// ── Create .i18n-removed marker ───────────────────────────────────────────
	writeFileSync(markerPath, JSON.stringify({ timestamp: new Date().toISOString(), defaultLocale }, null, 2) + "\n", "utf8");

	// ── Summary ───────────────────────────────────────────────────────────────
	console.log("\n...done!\n");
	console.log("=====================================");
	console.log(" i18n support removed");
	console.log("=====================================\n");
	console.log("Next steps:");
	console.log("1. Review src/components/Meta/Meta.astro for any remaining locale references");
	console.log("2. Review src/layouts/BaseLayout.astro — locale detection still works but is now a no-op");
	console.log("3. Run `npm run dev` to verify the site loads correctly");
	console.log("4. Non-default locale files have been moved to scripts/deleted/ for safekeeping");
	console.log();
}
