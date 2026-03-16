import { promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import { collectFiles } from "./utils/collect-files.js";
import { removeObjectKey, humanizeKey, flattenIntoMap, lookupTranslation } from "./utils/transforms.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = process.env.SCRIPT_ROOT ?? join(__dirname, "..");

// ─── Guard ────────────────────────────────────────────────────────────────────
const markerPath = join(root, ".i18n-removed");
try {
	await fs.access(markerPath);
	console.log("i18n has already been removed (.i18n-removed marker exists). Exiting.");
	process.exit(0);
} catch {
	// Marker doesn't exist, proceed
}

// ─── Helpers: move files/dirs (same pattern as remove-decap.js) ───────────────

async function moveDir(sourcePath, destPath, label) {
	try {
		await fs.access(sourcePath);
		try {
			await fs.access(destPath);
			await fs.rm(destPath, { recursive: true, force: true });
			console.log(`Removed existing ${destPath}`);
		} catch {
			// Destination doesn't exist, which is fine
		}
		await fs.rename(sourcePath, destPath);
		console.log(`Moved ${sourcePath} to ${destPath}`);
	} catch (error) {
		if (error.code === "ENOENT") {
			console.log(`${label} not found at ${sourcePath}, skipping...`);
		} else {
			console.error(`Error moving ${label}: ${error.message}`);
		}
	}
}

async function moveFile(sourcePath, destPath, label) {
	try {
		await fs.access(sourcePath);
		try {
			await fs.access(destPath);
			await fs.rm(destPath, { force: true });
		} catch {
			// Destination doesn't exist, which is fine
		}
		await fs.rename(sourcePath, destPath);
		console.log(`Moved ${sourcePath} to ${destPath}`);
	} catch (error) {
		if (error.code === "ENOENT") {
			console.log(`${label} not found at ${sourcePath}, skipping...`);
		} else {
			console.error(`Error moving ${label}: ${error.message}`);
		}
	}
}

// ─── Phase A: build flat translation lookup map ───────────────────────────────

async function buildTranslationMap(defaultLocale) {
	const map = {};
	const localesDir = join(root, "src", "locales", defaultLocale);

	let files;
	try {
		files = await fs.readdir(localesDir);
	} catch {
		console.warn(`Warning: Could not read locale directory ${localesDir}`);
		return map;
	}

	for (const file of files) {
		if (!file.endsWith(".json")) continue;
		const namespace = file.replace(".json", "");
		try {
			const content = await fs.readFile(join(localesDir, file), "utf-8");
			const json = JSON.parse(content);
			flattenIntoMap(json, namespace, "", map);
		} catch {
			console.warn(`Warning: Could not parse ${file}`);
		}
	}

	return map;
}

// ─── Phase B: automated sweep ─────────────────────────────────────────────────

async function removeI18nFromFiles(translationMap) {
	const files = [];
	await collectFiles(files, join(root, "src"));

	let updatedCount = 0;

	for (const file of files) {
		let content;
		try {
			content = await fs.readFile(file, "utf-8");
		} catch {
			continue;
		}

		const original = content;

		// Pattern 1 — {t("key")} → actual English value (or humanized fallback)
		content = content.replace(
			/{\s*\w+\s*\(["']([\w:.\-]+)["']\)\s*}/g,
			(_, key) => lookupTranslation(key, translationMap)
		);

		// Pattern 2 — getLocalizedRoute(locale, "path") → "path"
		content = content.replace(
			/getLocalizedRoute\s*\(\s*\w+\s*,\s*(["'][^"']+["'])\s*\)/g,
			(_, path) => path
		);

		// Pattern 3 — remove useTranslations import from translationUtils
		content = content.replace(
			/import\s*\{[^}]*useTranslations[^}]*\}\s*from\s*['"]@js\/translationUtils['"]\s*;?\n?/g,
			""
		);

		// Pattern 4 — remove useTranslations const
		content = content.replace(
			/const\s+\w+\s*=\s*useTranslations\s*\([^)]*\)\s*;?\n?/g,
			""
		);

		// Pattern 5 — remove getLocaleFromUrl import from localeUtils
		content = content.replace(
			/import\s*\{[^}]*getLocaleFromUrl[^}]*\}\s*from\s*['"]@js\/localeUtils['"]\s*;?\n?/g,
			""
		);

		// Pattern 6 — remove getLocaleFromUrl const
		content = content.replace(
			/const\s+\w+\s*=\s*getLocaleFromUrl\s*\([^)]*\)\s*;?\n?/g,
			""
		);

		// Pattern 7 — remove any remaining @js/translationUtils imports
		content = content.replace(
			/import\s*\{[^}]*\}\s*from\s*['"]@js\/translationUtils['"]\s*;?\n?/g,
			""
		);

		// Pattern 8 — remove any remaining @js/localeUtils imports
		content = content.replace(
			/import\s*\{[^}]*\}\s*from\s*['"]@js\/localeUtils['"]\s*;?\n?/g,
			""
		);

		// Pattern 9 — remove @config/siteSettings imports containing i18n identifiers
		content = content.replace(
			/import\s*\{[^}]*(?:locales|localeMap|languageSwitcherMap)[^}]*\}\s*from\s*['"]@config\/siteSettings['"]\s*;?\n?/g,
			""
		);

		// Pattern 10 — remove @config/routeTranslations imports
		content = content.replace(
			/import\s*\{[^}]*\}\s*from\s*['"]@config\/routeTranslations['"]\s*;?\n?/g,
			""
		);

		// Clean up runs of 3+ blank lines
		content = content.replace(/\n{3,}/g, "\n\n");

		if (content !== original) {
			await fs.writeFile(file, content, "utf-8");
			updatedCount++;
			console.log(`  Updated ${file.replace(root + "\\", "").replace(root + "/", "")}`);
		}
	}

	console.log(`\nPhase B complete: ${updatedCount} file(s) updated.`);
}

// ─── Phase C: targeted specific-file edits ────────────────────────────────────

async function patchSpecificFiles(defaultLocale) {
	// ── astro.config.mjs ──────────────────────────────────────────────────────
	const astroConfigPath = join(root, "astro.config.mjs");
	try {
		let content = await fs.readFile(astroConfigPath, "utf-8");
		// Remove top-level i18n block, then sitemap's i18n block (now the only one left)
		content = removeObjectKey(content, "i18n");
		content = removeObjectKey(content, "i18n");
		content = content.replace(/\n{3,}/g, "\n\n");
		await fs.writeFile(astroConfigPath, content, "utf-8");
		console.log("  Patched astro.config.mjs (removed i18n blocks)");
	} catch (err) {
		console.error(`  Error patching astro.config.mjs: ${err.message}`);
	}

	// ── src/layouts/BaseLayout.astro ──────────────────────────────────────────
	const baseLayoutPath = join(root, "src", "layouts", "BaseLayout.astro");
	try {
		let content = await fs.readFile(baseLayoutPath, "utf-8");
		content = content.replace(/<html lang=\{locale\}>/, `<html lang="${defaultLocale}">`);
		await fs.writeFile(baseLayoutPath, content, "utf-8");
		console.log(`  Patched BaseLayout.astro (<html lang="${defaultLocale}">)`);
	} catch (err) {
		console.error(`  Error patching BaseLayout.astro: ${err.message}`);
	}

	// ── src/components/Meta/Meta.astro ────────────────────────────────────────
	const metaPath = join(root, "src", "components", "Meta", "Meta.astro");
	try {
		let content = await fs.readFile(metaPath, "utf-8");

		// Replace isLandingPage line (the one that references the locale variable)
		content = content.replace(
			/const isLandingPage = [^\n]*\n/,
			`const isLandingPage = Astro.url.pathname === "/";\n`
		);

		// Remove the hrefLangLinks comment + Promise.all block
		content = content.replace(
			/\/\/ Generate hreflang[^\n]*\n[\s\S]*?const hrefLangLinks[\s\S]*?\);\n/,
			""
		);

		// Remove hreflang HTML output (comment + map + x-default link)
		content = content.replace(
			/<!-- Hreflang[^\n]*-->\n\{hrefLangLinks[\s\S]*?\}\n<link rel="alternate" hreflang="x-default"[^\n]*\n/,
			""
		);

		content = content.replace(/\n{3,}/g, "\n\n");
		await fs.writeFile(metaPath, content, "utf-8");
		console.log("  Patched Meta.astro (removed hreflang logic)");
	} catch (err) {
		console.error(`  Error patching Meta.astro: ${err.message}`);
	}
}

// ─── Phase D: move i18n infrastructure to scripts/deleted/ ───────────────────

async function moveI18nFiles(defaultLocale) {
	const deletedDir = join(root, "scripts", "deleted");

	// Ensure destination directory exists
	await fs.access(deletedDir).catch(async () => {
		await fs.mkdir(deletedDir, { recursive: true });
		console.log(`  Created directory ${deletedDir}`);
	});

	// src/locales/ → scripts/deleted/locales/
	await moveDir(join(root, "src", "locales"), join(deletedDir, "locales"), "Locales directory");

	// src/js/localeUtils.ts → scripts/deleted/localeUtils.ts
	await moveFile(join(root, "src", "js", "localeUtils.ts"), join(deletedDir, "localeUtils.ts"), "localeUtils.ts");

	// src/js/translationUtils.ts → scripts/deleted/translationUtils.ts
	await moveFile(join(root, "src", "js", "translationUtils.ts"), join(deletedDir, "translationUtils.ts"), "translationUtils.ts");

	// src/config/siteSettings.ts → scripts/deleted/siteSettings.ts
	await moveFile(join(root, "src", "config", "siteSettings.ts"), join(deletedDir, "siteSettings.ts"), "siteSettings.ts");

	// src/config/routeTranslations.ts → scripts/deleted/routeTranslations.ts
	await moveFile(join(root, "src", "config", "routeTranslations.ts"), join(deletedDir, "routeTranslations.ts"), "routeTranslations.ts");

	// src/components/LanguageSwitch/ → scripts/deleted/LanguageSwitch/
	await moveDir(join(root, "src", "components", "LanguageSwitch"), join(deletedDir, "LanguageSwitch"), "LanguageSwitch component");

	// Move non-default locale page subdirectories (e.g. src/pages/fr/)
	const pagesDir = join(root, "src", "pages");
	try {
		const entries = await fs.readdir(pagesDir, { withFileTypes: true });
		for (const entry of entries) {
			if (!entry.isDirectory()) continue;
			if (!/^[a-z]{2}(-[a-z]{2})?$/i.test(entry.name)) continue;
			if (entry.name === defaultLocale) continue;
			const src = join(pagesDir, entry.name);
			const dest = join(deletedDir, `pages-${entry.name}`);
			await moveDir(src, dest, `src/pages/${entry.name}`);
		}
	} catch (err) {
		console.error(`  Error scanning pages directory: ${err.message}`);
	}
}

// ─── Phase E: scan for remaining i18n references ──────────────────────────────

async function scanForReferences() {
	console.log("\nScanning for remaining i18n references...");

	const files = [];
	try {
		await collectFiles(files, join(root, "src"));
	} catch (err) {
		console.error(`Error collecting files: ${err.message}`);
		return [];
	}

	const patternRegex =
		/localeUtils|translationUtils|siteSettings|routeTranslations|getLocaleFromUrl|useTranslations|getLocalizedRoute|getLocalizedPathname|filterCollectionByLanguage|BrowserLanguageRedirect/;

	const found = [];
	for (const file of files) {
		try {
			const content = await fs.readFile(file, "utf-8");
			if (patternRegex.test(content)) {
				found.push(file);
			}
		} catch {
			continue;
		}
	}

	if (found.length > 0) {
		console.log(`\n⚠️  Found ${found.length} file(s) with remaining i18n references:`);
		found.forEach((f) => console.log(`   - ${f.replace(root + "\\", ".\\").replace(root + "/", "./")}`));
	} else {
		console.log("✓ No remaining i18n references found in src/.");
	}

	return found;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function removeI18n() {
	console.log(
		"\n⚠️  Script ordering note: If you haven't run 'remove-demo' yet, run it first.\n" +
			"   Running 'remove-demo' AFTER 'remove-i18n' is not recommended — it would\n" +
			"   write src/pages/fr/index.astro into a folder that no longer exists.\n"
	);

	// Queue-based readline: buffers lines so piped stdin doesn't race with async/await.
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	const lineQueue = [];
	const waiters = [];
	rl.on("line", (line) => {
		if (waiters.length > 0) waiters.shift()(line);
		else lineQueue.push(line);
	});
	const ask = (q) => {
		process.stdout.write(q);
		if (lineQueue.length > 0) return Promise.resolve(lineQueue.shift());
		return new Promise((resolve) => waiters.push(resolve));
	};

	// Prompt 1: default locale (with validation + re-prompt)
	let defaultLocale = "en";
	while (true) {
		const answer = (await ask("What is your default locale? (e.g. en, fr, de) [en]: ")).trim();
		if (answer === "") {
			defaultLocale = "en";
			break;
		} else if (/^[a-z]{2}(-[A-Z]{2})?$/.test(answer)) {
			defaultLocale = answer;
			break;
		} else {
			console.log('  Invalid locale. Use a 2-letter code like "en", "fr", or "de".');
		}
	}

	// Prompt 2: confirmation
	const confirm = (await ask(`\nType 'yes' to confirm removing i18n support: `)).trim();
	rl.close();

	if (confirm.toLowerCase() !== "yes") {
		console.log("Aborted. No files were changed.");
		return;
	}

	console.log();

	// ── Phase A ──────────────────────────────────────────────────────────────
	console.log("Phase A: Building translation map...");
	const translationMap = await buildTranslationMap(defaultLocale);
	console.log(`  Built map with ${Object.keys(translationMap).length} keys from src/locales/${defaultLocale}/`);

	// ── Phase B ──────────────────────────────────────────────────────────────
	console.log("\nPhase B: Automated file sweep...");
	await removeI18nFromFiles(translationMap);

	// ── Phase C ──────────────────────────────────────────────────────────────
	console.log("\nPhase C: Patching specific files...");
	await patchSpecificFiles(defaultLocale);

	// ── Phase D ──────────────────────────────────────────────────────────────
	console.log("\nPhase D: Moving i18n infrastructure to scripts/deleted/...");
	await moveI18nFiles(defaultLocale);

	// ── Phase E ──────────────────────────────────────────────────────────────
	const remaining = await scanForReferences();

	// ── Phase F ──────────────────────────────────────────────────────────────
	await fs.writeFile(markerPath, new Date().toISOString(), "utf-8");

	console.log("\n...done!\n");
	console.log("===================================================");
	console.log(" Successfully removed i18n support from the project");
	console.log("===================================================\n");

	console.log("Next steps:");
	console.log("1. Run `npm run dev` to verify the site loads");
	if (remaining.length > 0) {
		console.log("2. Manually clean up the files listed above with remaining i18n references");
		console.log("3. Remove any locale-specific CSS blocks in custom components");
		console.log("4. All removed files are in scripts/deleted/ if you need to restore them\n");
	} else {
		console.log("2. Remove any locale-specific CSS blocks in custom components");
		console.log("3. All removed files are in scripts/deleted/ if you need to restore them\n");
	}
}

removeI18n().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
