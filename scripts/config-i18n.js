import { promises as fs } from "fs";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import { removeObjectKey } from "./utils/transforms.js";
import { readI18nConfig } from "./utils/read-i18n-config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = process.env.SCRIPT_ROOT ?? join(__dirname, "..");

// ─── Guard ────────────────────────────────────────────────────────────────────

try {
	await fs.access(join(root, ".i18n-removed"));
	console.log("i18n support has already been removed from this project (.i18n-removed marker exists). Exiting.");
	process.exit(0);
} catch { /* proceed */ }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LOCALE_RE = /^[a-z]{2}(-[A-Z]{2})?$/;

function validateLocale(l) {
	return LOCALE_RE.test(l);
}

function localeToBCP47(locale) {
	const exceptions = { en: "en-US", zh: "zh-CN", pt: "pt-PT" };
	return exceptions[locale] ?? `${locale}-${locale.toUpperCase()}`;
}

function parseRecordEntries(content, varName) {
	const match = content.match(new RegExp(`${varName}[^=]*=\\s*\\{([^}]+)\\}`));
	if (!match) return {};
	const result = {};
	const re = /(\w+):\s*"([^"]+)"/g;
	let m;
	while ((m = re.exec(match[1])) !== null) {
		result[m[1]] = m[2];
	}
	return result;
}

function buildRecordString(locales, existingEntries, generator) {
	return "{ " + locales.map((l) => `${l}: "${existingEntries[l] ?? generator(l)}"`).join(", ") + " }";
}

// Extract the inner content of a named locale block (e.g. `en: { ... }`)
function extractLocaleBlockInner(content, locale) {
	const regex = new RegExp(`\\b${locale}:\\s*\\{`);
	const match = regex.exec(content);
	if (!match) return null;
	const braceOpen = content.indexOf("{", match.index + match[0].length - 1);
	let depth = 1;
	let i = braceOpen + 1;
	while (i < content.length && depth > 0) {
		if (content[i] === "{") depth++;
		else if (content[i] === "}") depth--;
		i++;
	}
	return content.slice(braceOpen + 1, i - 1);
}

// Insert a new locale block before the closing `};` of routeTranslations
function insertLocaleBlock(content, locale, innerContent) {
	const match = /export const routeTranslations[^=]*=\s*\{/.exec(content);
	if (!match) return content;
	const braceOpen = content.indexOf("{", match.index + match[0].length - 1);
	let depth = 1;
	let i = braceOpen + 1;
	while (i < content.length && depth > 0) {
		if (content[i] === "{") depth++;
		else if (content[i] === "}") depth--;
		i++;
	}
	const closingBrace = i - 1;
	let lineStart = closingBrace;
	while (lineStart > 0 && content[lineStart - 1] !== "\n") lineStart--;
	const newBlock = `  ${locale}: {${innerContent.trimEnd()}\n  },\n`;
	return content.slice(0, lineStart) + newBlock + content.slice(lineStart);
}

// Add/remove/rename locale entries inside the localizedCollections object
function modifyLocalizedCollections(content, operation, opts = {}) {
	const match = /export const localizedCollections\s*=\s*\{/.exec(content);
	if (!match) return content;
	const braceOpen = content.indexOf("{", match.index + match[0].length - 1);
	let depth = 1;
	let i = braceOpen + 1;
	while (i < content.length && depth > 0) {
		if (content[i] === "{") depth++;
		else if (content[i] === "}") depth--;
		i++;
	}
	const blockEnd = i;
	let block = content.slice(braceOpen, blockEnd);

	if (operation === "add") {
		const { locale, defaultLocale } = opts;
		block = block.replace(/\{([^{}]+)\}/g, (_, entries) => {
			const defMatch = new RegExp(`\\b${defaultLocale}:\\s*"([^"]+)"`).exec(entries);
			const val = defMatch?.[1] ?? locale;
			return `{ ${entries.trimEnd()}, ${locale}: "${val}" }`;
		});
	} else if (operation === "remove") {
		block = block.replace(new RegExp(`,?\\s*${opts.locale}:\\s*"[^"]*"`, "g"), "");
	} else if (operation === "rename") {
		block = block.replace(new RegExp(`\\b${opts.from}:`, "g"), `${opts.to}:`);
	}

	return content.slice(0, braceOpen) + block + content.slice(blockEnd);
}

// ─── Determine locale operations ──────────────────────────────────────────────

function determineOperations({ defaultLocale, currentLocales, newDefaultLocale, newLocales }) {
	let editOldDefaultToNewDefault;
	let localesToAdd, localesToRemove;

	if (currentLocales.includes(newDefaultLocale)) {
		// New default already exists as a current locale
		editOldDefaultToNewDefault = false;
		localesToAdd = newLocales.filter((l) => !currentLocales.includes(l));
		localesToRemove = currentLocales.filter((l) => !newLocales.includes(l));
	} else if (newLocales.includes(defaultLocale)) {
		// Old default is kept as a non-default locale
		editOldDefaultToNewDefault = false;
		localesToAdd = newLocales.filter((l) => !currentLocales.includes(l));
		localesToRemove = currentLocales.filter((l) => !newLocales.includes(l));
	} else {
		// Old default is gone entirely — rename it to the new default
		editOldDefaultToNewDefault = true;
		localesToAdd = newLocales.filter((l) => !currentLocales.includes(l) && l !== newDefaultLocale);
		localesToRemove = currentLocales.filter((l) => !newLocales.includes(l) && l !== defaultLocale);
	}

	return { localesToAdd, localesToRemove, editOldDefaultToNewDefault };
}

// ─── Phase A: astro.config.mjs ────────────────────────────────────────────────

async function patchAstroConfig({ defaultLocale, newDefaultLocale, newLocales, prefixDefaultLocale }) {
	const configPath = join(root, "astro.config.mjs");
	try {
		let content = await fs.readFile(configPath, "utf-8");
		const localesString = newLocales.map((l) => `"${l}"`).join(", ");
		content = content.replace(`defaultLocale: "${defaultLocale}"`, `defaultLocale: "${newDefaultLocale}"`);
		content = content.replace(/locales:\s*\[[^\]]+\]/, `locales: [${localesString}]`);
		content = content.replace(/prefixDefaultLocale:\s*(true|false)/, `prefixDefaultLocale: ${prefixDefaultLocale}`);
		await fs.writeFile(configPath, content, "utf-8");
		console.log("  Patched astro.config.mjs");
	} catch (err) {
		console.error(`  Error patching astro.config.mjs: ${err.message}`);
	}
}

// ─── Phase B: siteSettings.ts ─────────────────────────────────────────────────

async function patchSiteSettings({ defaultLocale, newDefaultLocale, newLocales }) {
	const settingsPath = join(root, "src", "config", "siteSettings.ts");
	try {
		let content = await fs.readFile(settingsPath, "utf-8");

		// locales array
		const localesString = newLocales.map((l) => `"${l}"`).join(", ");
		content = content.replace(/locales\s*=\s*\[[^\]]+\]/, `locales = [${localesString}]`);

		// defaultLocale value
		content = content.replace(
			/defaultLocale[^=]*=\s*["'][^"']+["']/,
			`defaultLocale: Locale = "${newDefaultLocale}"`,
		);

		// localeMap — parse existing values, rebuild (preserves known entries, generates defaults for new)
		const existingLocaleMap = parseRecordEntries(content, "localeMap");
		const newLocaleMapStr = buildRecordString(newLocales, existingLocaleMap, localeToBCP47);
		content = content.replace(
			/localeMap[^=]*=\s*\{[^}]+\}/,
			`localeMap: Record<Locale, string> = ${newLocaleMapStr}`,
		);

		// languageSwitcherMap — same pattern
		const existingLangMap = parseRecordEntries(content, "languageSwitcherMap");
		const newLangMapStr = buildRecordString(newLocales, existingLangMap, (l) => l.toUpperCase());
		content = content.replace(
			/languageSwitcherMap[^=]*=\s*\{[^}]+\}/,
			`languageSwitcherMap: Record<Locale, string> = ${newLangMapStr}`,
		);

		await fs.writeFile(settingsPath, content, "utf-8");
		console.log("  Patched src/config/siteSettings.ts");
	} catch (err) {
		console.error(`  Error patching siteSettings.ts: ${err.message}`);
	}
}

// ─── Phase C: routeTranslations.ts ───────────────────────────────────────────

async function patchRouteTranslations({ defaultLocale, newDefaultLocale, localesToAdd, localesToRemove, editOldDefaultToNewDefault }) {
	const rtPath = join(root, "src", "config", "routeTranslations.ts");
	if (!existsSync(rtPath)) {
		console.log("  Skipped routeTranslations.ts — not found");
		return;
	}
	try {
		let content = await fs.readFile(rtPath, "utf-8");

		// Add new locale blocks — clone default locale's slugs as identity placeholders
		for (const locale of localesToAdd) {
			const defaultInner = extractLocaleBlockInner(content, defaultLocale);
			if (defaultInner !== null) {
				content = insertLocaleBlock(content, locale, defaultInner);
			}
			content = modifyLocalizedCollections(content, "add", { locale, defaultLocale });
		}

		// Remove locale blocks
		for (const locale of localesToRemove) {
			content = removeObjectKey(content, locale);
			content = modifyLocalizedCollections(content, "remove", { locale });
		}

		// Rename default locale key throughout
		if (editOldDefaultToNewDefault) {
			content = content.replace(
				new RegExp(`(\\b)${defaultLocale}(:\\s*\\{)`, "g"),
				`$1${newDefaultLocale}$2`,
			);
			content = modifyLocalizedCollections(content, "rename", { from: defaultLocale, to: newDefaultLocale });
		}

		content = content.replace(/\n{3,}/g, "\n\n");
		await fs.writeFile(rtPath, content, "utf-8");
		console.log("  Patched src/config/routeTranslations.ts");
	} catch (err) {
		console.error(`  Error patching routeTranslations.ts: ${err.message}`);
	}
}

// ─── Phase D: public/admin/config.yml ────────────────────────────────────────

async function patchDecapConfig({ newDefaultLocale, newLocales }) {
	const configPath = join(root, "public", "admin", "config.yml");
	if (!existsSync(configPath)) {
		console.log("  Skipped public/admin/config.yml — not found (Decap may have been removed)");
		return;
	}
	try {
		let content = await fs.readFile(configPath, "utf-8");
		content = content.replace(/locales:\s*\[.*?\]/, `locales: [${newLocales.join(", ")}]`);
		content = content.replace(/default_locale:\s*\S+/, `default_locale: ${newDefaultLocale}`);
		await fs.writeFile(configPath, content, "utf-8");
		console.log("  Patched public/admin/config.yml");
	} catch (err) {
		console.error(`  Error patching config.yml: ${err.message}`);
	}
}

// ─── Phase E: src/locales/ ────────────────────────────────────────────────────

async function patchLocalesFolders({ defaultLocale, newDefaultLocale, localesToAdd, localesToRemove, editOldDefaultToNewDefault }) {
	const localesDir = join(root, "src", "locales");
	if (!existsSync(localesDir)) {
		console.log("  Skipped src/locales/ — directory not found");
		return;
	}
	const deletedDir = join(root, "scripts", "deleted");

	// Add new locale folders (copy from default locale — JSON keys to translate)
	for (const locale of localesToAdd) {
		const src = join(localesDir, defaultLocale);
		const dest = join(localesDir, locale);
		if (existsSync(dest)) {
			console.log(`  Skipped src/locales/${locale}/ — already exists`);
			continue;
		}
		if (existsSync(src)) {
			await fs.cp(src, dest, { recursive: true });
			console.log(`  Created src/locales/${locale}/ (copied from src/locales/${defaultLocale}/)`);
		}
	}

	// Remove locale folders → move to scripts/deleted/
	for (const locale of localesToRemove) {
		const src = join(localesDir, locale);
		if (!existsSync(src)) continue;
		await fs.mkdir(deletedDir, { recursive: true });
		const dest = join(deletedDir, `locales-${locale}`);
		if (existsSync(dest)) await fs.rm(dest, { recursive: true });
		await fs.rename(src, dest);
		console.log(`  Moved src/locales/${locale}/ → scripts/deleted/locales-${locale}/`);
	}

	// Rename default locale folder
	if (editOldDefaultToNewDefault) {
		const src = join(localesDir, defaultLocale);
		const dest = join(localesDir, newDefaultLocale);
		if (existsSync(src)) {
			await fs.rename(src, dest);
			console.log(`  Renamed src/locales/${defaultLocale}/ → src/locales/${newDefaultLocale}/`);
		}
	}
}

// ─── Phase F: src/pages/ ──────────────────────────────────────────────────────

const SWAP_TMP = "_locale_swap_tmp_";
const isLocaleDir = (name) => /^[a-z]{2}(-[a-z]{2})?$/i.test(name);

// Returns the subfolder name where a locale's pages live, or null for root.
function defaultPagesDir(prefix, locale) {
	return prefix ? locale : null;
}

async function patchPagesFolders({
	defaultLocale, newDefaultLocale, currentLocales,
	localesToAdd, localesToRemove, editOldDefaultToNewDefault,
	prefixDefaultLocale: newPrefixDefaultLocale,
	currentPrefixDefaultLocale,
}) {
	const pagesDir = join(root, "src", "pages");
	const deletedDir = join(root, "scripts", "deleted");
	const handledLocales = new Set();

	// ── Step 1: Handle default locale pages structure ─────────────────────────
	// null = pages live at src/pages/ root; string = pages live at src/pages/{locale}/
	const oldDefaultDir = defaultPagesDir(currentPrefixDefaultLocale, defaultLocale);
	const newDefaultTargetDir = defaultPagesDir(newPrefixDefaultLocale, newDefaultLocale);

	if (defaultLocale === newDefaultLocale) {
		// Locale unchanged — only prefix may have changed
		if (oldDefaultDir !== newDefaultTargetDir) {
			if (oldDefaultDir === null) {
				// false → true: move root pages into {locale}/
				const rootEntries = await fs.readdir(pagesDir, { withFileTypes: true });
				const rootItems = rootEntries.filter((e) => !isLocaleDir(e.name));
				const destDir = join(pagesDir, newDefaultTargetDir);
				await fs.mkdir(destDir, { recursive: true });
				for (const e of rootItems) {
					await fs.rename(join(pagesDir, e.name), join(destDir, e.name));
				}
				console.log(`  Moved root pages → src/pages/${newDefaultTargetDir}/ (prefixDefaultLocale: false → true)`);
			} else {
				// true → false: move {locale}/ contents to root
				const srcDir = join(pagesDir, oldDefaultDir);
				if (existsSync(srcDir)) {
					const srcEntries = await fs.readdir(srcDir, { withFileTypes: true });
					for (const e of srcEntries) {
						await fs.rename(join(srcDir, e.name), join(pagesDir, e.name));
					}
					await fs.rm(srcDir, { recursive: true, force: true });
					console.log(`  Moved src/pages/${oldDefaultDir}/ to root (prefixDefaultLocale: true → false)`);
				}
			}
			handledLocales.add(defaultLocale);
		}
		// else: nothing to do for default locale

	} else if (editOldDefaultToNewDefault) {
		// Old default locale is being renamed to new default — pages stay in place
		if (oldDefaultDir === null) {
			console.log(`  ℹ️  Root pages now represent "${newDefaultLocale}" — update page content manually`);
		} else {
			// prefix=true: rename {defaultLocale}/ → {newDefaultLocale}/
			const srcDir = join(pagesDir, defaultLocale);
			const destDir = join(pagesDir, newDefaultLocale);
			if (existsSync(srcDir)) {
				await fs.rename(srcDir, destDir);
				console.log(`  Renamed src/pages/${defaultLocale}/ → src/pages/${newDefaultLocale}/`);
			}
		}
		handledLocales.add(defaultLocale);
		handledLocales.add(newDefaultLocale);

	} else {
		// Locale changed and new default was previously a non-default locale
		// (its pages currently live in src/pages/{newDefaultLocale}/)
		const newDefaultCurrentPath = join(pagesDir, newDefaultLocale);

		if (newDefaultTargetDir === null && oldDefaultDir === null) {
			// false → false, locale change: swap subfolder ↔ root (needs temp dir)
			if (existsSync(newDefaultCurrentPath)) {
				const tempDir = join(pagesDir, SWAP_TMP);

				// 1a. Move new default subfolder → temp
				await fs.rename(newDefaultCurrentPath, tempDir);

				// 1b. Move old default root pages → subfolder or deleted
				const rootEntries = await fs.readdir(pagesDir, { withFileTypes: true });
				const rootItems = rootEntries.filter((e) => e.name !== SWAP_TMP && !isLocaleDir(e.name));

				if (localesToRemove.includes(defaultLocale)) {
					await fs.mkdir(deletedDir, { recursive: true });
					const dest = join(deletedDir, `pages-${defaultLocale}`);
					if (existsSync(dest)) await fs.rm(dest, { recursive: true });
					await fs.mkdir(dest);
					for (const e of rootItems) {
						await fs.rename(join(pagesDir, e.name), join(dest, e.name));
					}
					console.log(`  Moved root pages (${defaultLocale}) → scripts/deleted/pages-${defaultLocale}/`);
				} else {
					const oldDefaultPath = join(pagesDir, defaultLocale);
					await fs.mkdir(oldDefaultPath, { recursive: true });
					for (const e of rootItems) {
						await fs.rename(join(pagesDir, e.name), join(oldDefaultPath, e.name));
					}
					console.log(`  Created src/pages/${defaultLocale}/ (moved from root — was default locale)`);
				}
				handledLocales.add(defaultLocale);

				// 1c. Promote temp → root
				const tempEntries = await fs.readdir(tempDir, { withFileTypes: true });
				for (const e of tempEntries) {
					await fs.rename(join(tempDir, e.name), join(pagesDir, e.name));
				}
				await fs.rm(tempDir, { recursive: true, force: true });
				console.log(`  Promoted src/pages/${newDefaultLocale}/ to root (new default locale)`);
				handledLocales.add(newDefaultLocale);
			}

		} else if (newDefaultTargetDir === null && oldDefaultDir !== null) {
			// true → false, locale change: promote {newDefaultLocale}/ to root; old default stays as subfolder
			if (existsSync(newDefaultCurrentPath)) {
				const srcEntries = await fs.readdir(newDefaultCurrentPath, { withFileTypes: true });
				for (const e of srcEntries) {
					await fs.rename(join(newDefaultCurrentPath, e.name), join(pagesDir, e.name));
				}
				await fs.rm(newDefaultCurrentPath, { recursive: true, force: true });
				console.log(`  Promoted src/pages/${newDefaultLocale}/ to root (new default locale)`);
			}
			handledLocales.add(newDefaultLocale);
			// oldDefaultDir ({defaultLocale}/) stays in place as a non-default subfolder

		} else if (oldDefaultDir === null && newDefaultTargetDir !== null) {
			// false → true, locale change: move root → {defaultLocale}/; new default stays in {newDefaultLocale}/
			const rootEntries = await fs.readdir(pagesDir, { withFileTypes: true });
			const rootItems = rootEntries.filter((e) => !isLocaleDir(e.name));

			if (localesToRemove.includes(defaultLocale)) {
				await fs.mkdir(deletedDir, { recursive: true });
				const dest = join(deletedDir, `pages-${defaultLocale}`);
				if (existsSync(dest)) await fs.rm(dest, { recursive: true });
				await fs.mkdir(dest);
				for (const e of rootItems) {
					await fs.rename(join(pagesDir, e.name), join(dest, e.name));
				}
				console.log(`  Moved root pages (${defaultLocale}) → scripts/deleted/pages-${defaultLocale}/`);
			} else {
				const oldDefaultPath = join(pagesDir, defaultLocale);
				await fs.mkdir(oldDefaultPath, { recursive: true });
				for (const e of rootItems) {
					await fs.rename(join(pagesDir, e.name), join(oldDefaultPath, e.name));
				}
				console.log(`  Created src/pages/${defaultLocale}/ (moved from root — was default locale)`);
			}
			handledLocales.add(defaultLocale);
			// newDefaultLocale already at {newDefaultLocale}/ (its final location), no move needed
			handledLocales.add(newDefaultLocale);

		}
		// else: true → true, locale change: no page folder moves required (config only)
	}

	// ── Step 2: Remove non-default locale folders (skipping already-handled) ──
	for (const locale of localesToRemove) {
		if (handledLocales.has(locale)) continue;
		const src = join(pagesDir, locale);
		if (!existsSync(src)) continue;
		await fs.mkdir(deletedDir, { recursive: true });
		const dest = join(deletedDir, `pages-${locale}`);
		if (existsSync(dest)) await fs.rm(dest, { recursive: true });
		await fs.rename(src, dest);
		console.log(`  Moved src/pages/${locale}/ → scripts/deleted/pages-${locale}/`);
	}

	// ── Step 3: Add new non-default locale folders ────────────────────────────
	// Find a template locale (prefer a locale that was already non-default and stays non-default)
	let templateLocale = null;
	for (const locale of [...currentLocales, defaultLocale]) {
		if (locale === newDefaultLocale) continue;
		if (localesToRemove.includes(locale)) continue;
		if (existsSync(join(pagesDir, locale))) { templateLocale = locale; break; }
	}

	for (const locale of localesToAdd) {
		if (locale === newDefaultLocale) continue;
		const dest = join(pagesDir, locale);
		if (existsSync(dest)) {
			console.log(`  Skipped src/pages/${locale}/ — already exists`);
			continue;
		}
		if (templateLocale) {
			await fs.cp(join(pagesDir, templateLocale), dest, { recursive: true });
			console.log(`  Created src/pages/${locale}/ (copied from src/pages/${templateLocale}/)`);
			console.log(`  ⚠️  Content in src/pages/${locale}/ is in ${templateLocale} — translate manually`);
		} else {
			console.log(`  ⚠️  Could not scaffold src/pages/${locale}/ — no existing locale folder to copy from`);
		}
	}
}

// ─── Phase G: src/content/ ────────────────────────────────────────────────────

async function patchContentFolders({ defaultLocale, newDefaultLocale, localesToAdd, localesToRemove, editOldDefaultToNewDefault }) {
	const contentDir = join(root, "src", "content");
	if (!existsSync(contentDir)) return;

	const deletedDir = join(root, "scripts", "deleted");
	let collections;
	try {
		collections = await fs.readdir(contentDir, { withFileTypes: true });
	} catch { return; }

	for (const entry of collections) {
		if (!entry.isDirectory()) continue;
		const collectionDir = join(contentDir, entry.name);

		// Only touch collections that have locale subdirectories
		let subDirs;
		try {
			subDirs = await fs.readdir(collectionDir, { withFileTypes: true });
		} catch { continue; }

		const hasLocaleDirs = subDirs.some(
			(d) => d.isDirectory() && /^[a-z]{2}(-[a-z]{2})?$/i.test(d.name),
		);
		if (!hasLocaleDirs) continue;

		// Add: create empty locale folder (content is user's responsibility)
		for (const locale of localesToAdd) {
			const dest = join(collectionDir, locale);
			if (!existsSync(dest)) {
				await fs.mkdir(dest, { recursive: true });
				console.log(`  Created src/content/${entry.name}/${locale}/ (empty)`);
			}
		}

		// Remove → move to scripts/deleted/
		for (const locale of localesToRemove) {
			const src = join(collectionDir, locale);
			if (!existsSync(src)) continue;
			await fs.mkdir(deletedDir, { recursive: true });
			const dest = join(deletedDir, `content-${entry.name}-${locale}`);
			if (existsSync(dest)) await fs.rm(dest, { recursive: true });
			await fs.rename(src, dest);
			console.log(`  Moved src/content/${entry.name}/${locale}/ → scripts/deleted/content-${entry.name}-${locale}/`);
		}

		// Rename default locale folder
		if (editOldDefaultToNewDefault) {
			const src = join(collectionDir, defaultLocale);
			const dest = join(collectionDir, newDefaultLocale);
			if (existsSync(src)) {
				await fs.rename(src, dest);
				console.log(`  Renamed src/content/${entry.name}/${defaultLocale}/ → src/content/${entry.name}/${newDefaultLocale}/`);
			}
		}
	}
}

// ─── Phase H: src/components/ ────────────────────────────────────────────────

async function patchComponents({ localesToRemove, editOldDefaultToNewDefault, defaultLocale, newDefaultLocale }) {
	const componentsDir = join(root, "src", "components");
	if (!existsSync(componentsDir)) {
		console.log("  Skipped src/components/ — directory not found");
		return;
	}

	// Recursively find component files that may contain locale-specific imports
	async function findComponentFiles(dir) {
		const entries = await fs.readdir(dir, { withFileTypes: true });
		const files = [];
		for (const e of entries) {
			const full = join(dir, e.name);
			if (e.isDirectory()) files.push(...await findComponentFiles(full));
			else if (/\.(astro|ts|tsx|js|jsx)$/.test(e.name)) files.push(full);
		}
		return files;
	}

	const files = await findComponentFiles(componentsDir);
	let patchedCount = 0;

	for (const filePath of files) {
		let content = await fs.readFile(filePath, "utf-8");
		if (!content.includes("@locales/")) continue;

		let changed = false;

		// Handle removed locales
		for (const locale of localesToRemove) {
			if (!content.includes(`@locales/${locale}/`)) continue;

			// Capture variable names used in this locale's imports
			const captureRe = new RegExp(`import (\\w+) from ["']@locales\\/${locale}\\/[^"']+["']`, "g");
			const removedVarNames = [];
			let m;
			while ((m = captureRe.exec(content)) !== null) {
				removedVarNames.push(m[1]);
			}
			if (removedVarNames.length === 0) continue;

			// Remove entire import lines for this locale
			content = content.replace(
				new RegExp(`[ \\t]*import \\w+ from ["']@locales\\/${locale}\\/[^"']+["'];?[ \\t]*(?:\\r?\\n)?`, "g"),
				"",
			);
			changed = true;

			// Simplify ternary assignments that reference the removed variable
			for (const removedVar of removedVarNames) {
				// `= locale === "fr" ? frVar : enVar`  →  `= enVar`
				content = content.replace(
					new RegExp(`= locale === ["']${locale}["'] \\? ${removedVar} : (\\w+)`, "g"),
					"= $1",
				);
				// `= locale === "fr" ? enVar : frVar`  →  `= enVar`
				content = content.replace(
					new RegExp(`= locale === ["']${locale}["'] \\? (\\w+) : ${removedVar}`, "g"),
					"= $1",
				);
				// `= locale !== "fr" ? enVar : frVar`  →  `= enVar`
				content = content.replace(
					new RegExp(`= locale !== ["']${locale}["'] \\? (\\w+) : ${removedVar}`, "g"),
					"= $1",
				);
			}
		}

		// Handle locale rename: update @locales/{old}/ → @locales/{new}/ in import paths
		if (editOldDefaultToNewDefault && content.includes(`@locales/${defaultLocale}/`)) {
			content = content.replace(
				new RegExp(`@locales\\/${defaultLocale}\\/`, "g"),
				`@locales/${newDefaultLocale}/`,
			);
			changed = true;
		}

		if (changed) {
			// Clean up any double-blank lines left behind after import removal
			content = content.replace(/\n{3,}/g, "\n\n");
			await fs.writeFile(filePath, content, "utf-8");
			const rel = filePath.replace(root + "/", "");
			console.log(`  Patched ${rel}`);
			patchedCount++;
		}
	}

	if (patchedCount === 0) {
		console.log("  No component files needed patching");
	}
}

// ─── Phase I: single-language strip ──────────────────────────────────────────

/** Load all translation messages for a locale into a flat "namespace:key.path" → value map.
 * Keys without a colon in t() calls default to the "common" namespace (mirrors translationUtils.ts). */
async function loadLocaleMessages(locale) {
	const localeDir = join(root, "src", "locales", locale);
	const messages = {};

	let files;
	try {
		files = await fs.readdir(localeDir);
	} catch {
		console.warn(`  Warning: Could not read locale directory: ${localeDir}`);
		return messages;
	}

	for (const file of files) {
		if (!file.endsWith(".json")) continue;
		const namespace = file.slice(0, -5);
		let data;
		try {
			data = JSON.parse(await fs.readFile(join(localeDir, file), "utf-8"));
		} catch (e) {
			console.warn(`  Warning: Could not parse ${file}: ${e.message}`);
			continue;
		}

		function flattenInto(obj, prefix) {
			for (const [k, v] of Object.entries(obj)) {
				const keyPath = prefix ? `${prefix}.${k}` : k;
				messages[`${namespace}:${keyPath}`] = v;
				if (v && typeof v === "object" && !Array.isArray(v)) {
					flattenInto(v, keyPath);
				}
			}
		}
		flattenInto(data, "");
	}

	return messages;
}

/** Recursively collect .astro/.ts/.tsx/.js files under dir, skipping paths that contain any entry in skipPaths. */
async function walkSrc(dir, skipPaths = []) {
	const results = [];
	let entries;
	try {
		entries = await fs.readdir(dir, { withFileTypes: true });
	} catch {
		return results;
	}
	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		const normalized = fullPath.replace(/\\/g, "/");
		if (entry.isDirectory()) {
			if (!skipPaths.some((s) => normalized === s || normalized.endsWith("/" + s) || normalized.includes("/" + s + "/"))) {
				results.push(...(await walkSrc(fullPath, skipPaths)));
			}
		} else if (/\.(astro|ts|tsx|js)$/.test(entry.name)) {
			results.push(fullPath);
		}
	}
	return results;
}

/** Remove unused named imports from a specific import path.
 * Removes the entire import statement if all named imports become unused. */
function pruneNamedImport(content, fromPath, namesToCheck) {
	const escaped = fromPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const importRe = new RegExp(`^import\\s+\\{([^}]*)\\}\\s+from\\s+["']${escaped}["'];?`, "m");
	const match = importRe.exec(content);
	if (!match) return content;

	const importedNames = match[1].split(",").map((n) => n.trim()).filter(Boolean);
	const contentWithoutImport = content.slice(0, match.index) + content.slice(match.index + match[0].length);

	const remaining = importedNames.filter((name) => {
		if (!namesToCheck.includes(name)) return true;
		return new RegExp(`\\b${name}\\b`).test(contentWithoutImport);
	});

	if (remaining.length === 0) {
		return content.replace(match[0] + "\n", "").replace(match[0], "");
	}
	if (remaining.length < importedNames.length) {
		return content.replace(match[0], `import { ${remaining.join(", ")} } from "${fromPath}";`);
	}
	return content;
}

async function stripMetaHreflang() {
	const metaPath = join(root, "src", "components", "Meta", "Meta.astro");
	if (!existsSync(metaPath)) return;

	let content = await fs.readFile(metaPath, "utf-8");
	const original = content;

	// Remove frontmatter hrefLangLinks block
	content = content.replace(
		/\n\/\/ Generate hreflang alternate links\nconst hrefLangLinks = await Promise\.all\([\s\S]*?\n\);\n/,
		"\n",
	);

	// Remove template hreflang comment + map expression + x-default link
	content = content.replace(
		/\n<!-- Hreflang alternate links for SEO -->\n\{hrefLangLinks\.map[\s\S]*?\)}\n<link rel="alternate" hreflang="x-default"[^\n]*\n/,
		"\n",
	);

	// Remove now-unused imports
	content = pruneNamedImport(content, "@js/translationUtils", ["getLocalizedPathname"]);
	content = pruneNamedImport(content, "@config/siteSettings", ["locales", "localeMap"]);
	content = content.replace(/\n{3,}/g, "\n\n");

	if (content !== original) {
		await fs.writeFile(metaPath, content, "utf-8");
		console.log("  patched: src/components/Meta/Meta.astro (removed hreflang)");
	}
}

async function stripSettingsLanguageSwitcher() {
	const settingsPath = join(root, "src", "components", "Settings", "Settings.astro");
	if (!existsSync(settingsPath)) return;

	let content = await fs.readFile(settingsPath, "utf-8");
	const original = content;

	content = content.replace(/^import TwoLocalesSelect from ["'][^"']+["'];?\r?\n?/m, "");
	content = content.replace(/^\t*<TwoLocalesSelect \/>\r?\n?/m, "");
	content = content.replace(/\n{3,}/g, "\n\n");

	if (content !== original) {
		await fs.writeFile(settingsPath, content, "utf-8");
		console.log("  patched: src/components/Settings/Settings.astro (removed language switcher)");
	}
}

async function stripIndexBrowserRedirect() {
	const indexPath = join(root, "src", "pages", "index.astro");
	if (!existsSync(indexPath)) return;

	let content = await fs.readFile(indexPath, "utf-8");
	const original = content;

	content = content.replace(/^import BrowserLanguageRedirect from ["'][^"']+["'];?\r?\n?/m, "");
	content = content.replace(/^\r?\n?<BrowserLanguageRedirect \/>\r?\n?/m, "");
	content = content.replace(/\n{3,}/g, "\n\n");

	if (content !== original) {
		await fs.writeFile(indexPath, content, "utf-8");
		console.log("  patched: src/pages/index.astro (removed BrowserLanguageRedirect)");
	}
}

/** Strip all i18n artefacts from src/ for a single-language project.
 * Returns true if the strip ran, false if the user skipped it. */
async function stripSingleLanguage(locale) {
	console.log("\n⚠  Single-language strip will:");
	console.log("     • replace all t() calls with literal content from your locale JSON files");
	console.log("     • remove locale routing helpers from every page");
	console.log("     • delete the language switcher components");
	console.log("     • remove hreflang tags from Meta.astro");
	console.log("\n   This cannot be automatically reversed. Use git if you need to go back.");

	const warnRl = readline.createInterface({ input: process.stdin, output: process.stdout });
	const warnAsk = (q) => new Promise((resolve) => warnRl.question(q, resolve));
	const proceed = (await warnAsk("   Proceed? (y/n): ")).trim().toLowerCase();
	warnRl.close();

	if (proceed !== "y") {
		console.log("   Skipping Phase I. i18n artefacts remain in source files.");
		return false;
	}

	if (!existsSync(join(root, ".demo-removed"))) {
		console.warn("\n  ⚠  Consider running `npm run remove-demo` first for a cleaner result.");
	}

	console.log("\nPhase I: stripping i18n artefacts...\n");

	// I-A: Load locale messages
	const messages = await loadLocaleMessages(locale);
	console.log(`  Loaded ${Object.keys(messages).length} translation keys from src/locales/${locale}/\n`);

	// I-B: Walk src/ files, skipping src/js/ (leave utility files untouched)
	const srcDir = join(root, "src");
	const skipJs = join(root, "src", "js").replace(/\\/g, "/");
	const files = await walkSrc(srcDir, [skipJs]);

	for (const filePath of files) {
		let content = await fs.readFile(filePath, "utf-8");
		const original = content;
		const rel = filePath.replace(root, "").replace(/\\/g, "/");

		const neededJsonImports = new Set();

		// 1. Replace getLocalizedRoute(locale, X) → X
		content = content.replace(
			/getLocalizedRoute\(\s*locale\s*,\s*([^)]+?)\s*\)/g,
			(_, path) => path.trim(),
		);

		// 2. Replace resolveNavLabel(X, locale) → X
		content = content.replace(
			/resolveNavLabel\(\s*([^,]+?)\s*,\s*locale\s*\)/g,
			(_, label) => label.trim(),
		);

		// 3. Replace t("key") — string values inlined, arrays/objects → JSON import reference
		content = content.replace(
			/\bt(?:<(?:[^<>]|<[^<>]*>)*>)?\("([^"]+)"\)/g,
			(match, rawKey) => {
				// Mirror translationUtils.ts: no colon → "common" namespace
				let namespace = "common";
				let keyPath = rawKey;
				const colonIdx = rawKey.indexOf(":");
				if (colonIdx !== -1) {
					namespace = rawKey.slice(0, colonIdx);
					keyPath = rawKey.slice(colonIdx + 1);
				}

				const value = messages[`${namespace}:${keyPath}`];
				if (value === undefined) {
					console.warn(`  Warning: missing key "${rawKey}" in ${rel}`);
					return match;
				}
				if (typeof value === "string") {
					return JSON.stringify(value);
				}
				// Complex value: reference JSON file directly
				neededJsonImports.add(namespace);
				const bracketPath = keyPath.split(".").map((k) => `["${k}"]`).join("");
				return `${namespace}Json${bracketPath}`;
			},
		);

		// 4. Inject JSON imports for complex values into frontmatter (or top of TS/JS file)
		if (neededJsonImports.size > 0) {
			const importLines = [...neededJsonImports]
				.map((ns) => `import ${ns}Json from "@locales/${locale}/${ns}.json";`)
				.join("\n");
			if (content.startsWith("---")) {
				const fmClose = content.indexOf("\n---", 3);
				if (fmClose !== -1) content = content.slice(0, fmClose) + "\n" + importLines + content.slice(fmClose);
			} else {
				content = importLines + "\n" + content;
			}
		}

		// 5. Remove `const t = useTranslations(locale)` if no t() calls remain
		if (!/\bt(?:<[^>]*>)?\s*\(/.test(content)) {
			content = content.replace(/^\s*const t = useTranslations\(locale\);?\r?\n?/m, "");
		}

		// 6. Remove `const locale = getLocaleFromUrl(Astro.url)` if locale is no longer referenced
		const withoutLocaleDecl = content.replace(
			/^\s*const locale = getLocaleFromUrl\(Astro\.url\);?\r?\n?/m,
			"",
		);
		if (!/\blocale\b/.test(withoutLocaleDecl)) content = withoutLocaleDecl;

		// 7. Prune orphaned i18n imports
		content = pruneNamedImport(content, "@js/localeUtils", ["getLocaleFromUrl", "resolveNavLabel", "getLocalizedPathname"]);
		content = pruneNamedImport(content, "@js/translationUtils", ["useTranslations", "getLocalizedRoute", "getLocalizedPathname"]);

		// 8. Simplify attr={"string"} → attr="string"
		content = content.replace(/=\{("(?:[^"\\]|\\.)*")\}/g, "=$1");

		// 9. Collapse 3+ blank lines → 2
		content = content.replace(/\n{3,}/g, "\n\n");

		if (content !== original) {
			await fs.writeFile(filePath, content, "utf-8");
			console.log(`  patched: ${rel}`);
		}
	}

	// I-C: Targeted edits for known files whose structure is stable
	await stripMetaHreflang();
	await stripSettingsLanguageSwitcher();
	await stripIndexBrowserRedirect();

	// I-D: Delete now-unused files
	const langSwitchDir = join(root, "src", "components", "LanguageSwitch");
	if (existsSync(langSwitchDir)) {
		await fs.rm(langSwitchDir, { recursive: true, force: true });
		console.log("  deleted: src/components/LanguageSwitch/");
	}
	const localePreferencePath = join(root, "src", "js", "localePreference.ts");
	if (existsSync(localePreferencePath)) {
		await fs.unlink(localePreferencePath);
		console.log("  deleted: src/js/localePreference.ts");
	}

	// I-E: Update marker with strip timestamp
	try {
		await fs.writeFile(
			join(root, ".i18n-single-language"),
			JSON.stringify({ locale, strippedAt: new Date().toISOString(), version: "1" }, null, 2) + "\n",
		);
	} catch { /* ignore */ }

	console.log("\n  Phase I complete.");
	return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function configI18n() {
	// ── Readline setup (queue-based to avoid stdin race with async/await) ──────
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

	// ── Reconfiguration guard ─────────────────────────────────────────────────
	let wasAlreadyConfigured = false;
	try {
		await fs.access(join(root, ".i18n-configured"));
		wasAlreadyConfigured = true;
	} catch { /* first run */ }

	if (wasAlreadyConfigured) {
		const answer = (await ask("i18n was already configured (.i18n-configured exists). Reconfigure? (y/n) [n]: ")).trim().toLowerCase();
		if (answer !== "y") {
			console.log("Aborted. No files were changed.");
			rl.close();
			process.exit(0);
		}
	}

	// ── Read current config ───────────────────────────────────────────────────
	const current = readI18nConfig(root);
	if (!current) {
		console.error("Could not read i18n config from src/config/siteSettings.ts. Exiting.");
		rl.close();
		process.exit(1);
	}
	const { defaultLocale, locales: currentLocales } = current;

	// Read current prefixDefaultLocale from astro.config.mjs
	let currentPrefixDefaultLocale = false;
	try {
		const astroConfig = await fs.readFile(join(root, "astro.config.mjs"), "utf-8");
		const m = astroConfig.match(/prefixDefaultLocale:\s*(true|false)/);
		currentPrefixDefaultLocale = m?.[1] === "true";
	} catch { /* keep false */ }

	console.log(`\nCurrent config: defaultLocale="${defaultLocale}", locales=[${currentLocales.join(", ")}], prefixDefaultLocale=${currentPrefixDefaultLocale}\n`);
	console.log("NOTE: locale examples at https://github.com/cospired/i18n-iso-languages\n");

	// ── Prompt 1: single language or multi? ──────────────────────────────────────
	const singleLangAnswer = (await ask("Is this a single-language project? (y/n) [n]: ")).trim().toLowerCase();
	const isSingleLanguage = singleLangAnswer === "y";

	let newDefaultLocale;
	let newLocales;
	let prefixDefaultLocale;

	if (isSingleLanguage) {
		// ── Single-language mode ──────────────────────────────────────────────
		// Prompt for single language
		while (true) {
			const answer = (await ask(`\nSingle language code? [${defaultLocale}]: `)).trim();
			const val = answer === "" ? defaultLocale : answer.toLowerCase();
			if (validateLocale(val)) { newDefaultLocale = val; break; }
			console.log('  Invalid locale. Use a 2-letter code like "en", "fr", or "de".');
		}
		newLocales = [newDefaultLocale];

		// Single-language projects typically don't prefix the locale in URLs
		prefixDefaultLocale = false;
	} else {
		// ── Multi-language mode ───────────────────────────────────────────────
		// Prompt 2: new default locale
		while (true) {
			const answer = (await ask(`\nDefault locale? [${defaultLocale}]: `)).trim();
			const val = answer === "" ? defaultLocale : answer.toLowerCase();
			if (validateLocale(val)) { newDefaultLocale = val; break; }
			console.log('  Invalid locale. Use a 2-letter code like "en", "fr", or "de".');
		}

		// Prompt 3: additional locales
		let additionalLocales;
		while (true) {
			const answer = (await ask("Additional locales (comma-separated, e.g. fr, de): ")).trim();
			if (!answer) { console.log("  Please enter at least one additional locale."); continue; }
			const parsed = answer.split(",").map((l) => l.trim().toLowerCase()).filter(Boolean);
			const invalid = parsed.filter((l) => !validateLocale(l));
			if (invalid.length > 0) { console.log(`  Invalid: ${invalid.join(", ")}. Use 2-letter codes.`); continue; }
			additionalLocales = parsed;
			break;
		}

		// Build final locales list (default first, deduplicated)
		newLocales = [...new Set([newDefaultLocale, ...additionalLocales])];

		// Prompt 4: prefixDefaultLocale
		const prefixPromptDefault = currentPrefixDefaultLocale ? "y" : "n";
		const prefixAnswer = (await ask(`\nPrefix default locale in URLs? (/en/about vs /about) (y/n) [${prefixPromptDefault}]: `)).trim().toLowerCase();
		prefixDefaultLocale = prefixAnswer === "" ? currentPrefixDefaultLocale : prefixAnswer === "y";
	}

	// ── Confirm ───────────────────────────────────────────────────────────────
	console.log(`\nNew config:`);
	if (isSingleLanguage) {
		console.log(`  Mode:                 Single-language`);
	} else {
		console.log(`  Mode:                 Multi-language`);
	}
	console.log(`  defaultLocale:        "${newDefaultLocale}"`);
	console.log(`  locales:              [${newLocales.join(", ")}]`);
	console.log(`  prefixDefaultLocale:  ${prefixDefaultLocale}`);

	const confirm = (await ask("\nProceed? (y/n): ")).trim().toLowerCase();
	rl.close();

	if (confirm !== "y") {
		console.log("Aborted. No files were changed.");
		return;
	}

	console.log();

	// ── Create single-language marker if needed ───────────────────────────────
	if (isSingleLanguage) {
		try {
			await fs.writeFile(join(root, ".i18n-single-language"), JSON.stringify({ locale: newDefaultLocale, version: "1" }, null, 2));
		} catch (err) {
			console.warn(`  Warning: Could not write .i18n-single-language marker: ${err.message}`);
		}
	}

	// ── Determine operations ──────────────────────────────────────────────────
	const { localesToAdd, localesToRemove, editOldDefaultToNewDefault } = determineOperations({
		defaultLocale,
		currentLocales,
		newDefaultLocale,
		newLocales,
	});

	if (localesToAdd.length === 0 && localesToRemove.length === 0 && defaultLocale === newDefaultLocale && prefixDefaultLocale === currentPrefixDefaultLocale) {
		console.log("No changes needed — config already matches.\n");
		return;
	}

	if (localesToAdd.length > 0) console.log(`Adding:   ${localesToAdd.join(", ")}`);
	if (localesToRemove.length > 0) console.log(`Removing: ${localesToRemove.join(", ")}`);
	if (editOldDefaultToNewDefault) console.log(`Renaming default: ${defaultLocale} → ${newDefaultLocale}`);
	if (prefixDefaultLocale !== currentPrefixDefaultLocale) console.log(`prefixDefaultLocale: ${currentPrefixDefaultLocale} → ${prefixDefaultLocale}`);
	console.log();

	const ops = { defaultLocale, newDefaultLocale, currentLocales, newLocales, localesToAdd, localesToRemove, editOldDefaultToNewDefault, prefixDefaultLocale, currentPrefixDefaultLocale };

	// ── Phase A ───────────────────────────────────────────────────────────────
	console.log("Phase A: astro.config.mjs...");
	await patchAstroConfig(ops);

	// ── Phase B ───────────────────────────────────────────────────────────────
	console.log("\nPhase B: siteSettings.ts...");
	await patchSiteSettings(ops);

	// ── Phase C ───────────────────────────────────────────────────────────────
	console.log("\nPhase C: routeTranslations.ts...");
	await patchRouteTranslations(ops);

	// ── Phase D ───────────────────────────────────────────────────────────────
	console.log("\nPhase D: Decap config...");
	await patchDecapConfig(ops);

	// ── Phase E ───────────────────────────────────────────────────────────────
	console.log("\nPhase E: src/locales/...");
	await patchLocalesFolders(ops);

	// ── Phase F ───────────────────────────────────────────────────────────────
	console.log("\nPhase F: src/pages/...");
	await patchPagesFolders(ops);

	// ── Phase G ───────────────────────────────────────────────────────────────
	console.log("\nPhase G: src/content/...");
	await patchContentFolders(ops);

	// ── Phase H ───────────────────────────────────────────────────────────────
	console.log("\nPhase H: src/components/...");
	await patchComponents(ops);

	// ── Phase I (single-language only) ────────────────────────────────────────
	let phaseIStripped = false;
	if (isSingleLanguage) {
		phaseIStripped = await stripSingleLanguage(newDefaultLocale);
	}

	// ── Create .i18n-configured marker ───────────────────────────────────────
	try {
		await fs.writeFile(
			join(root, ".i18n-configured"),
			JSON.stringify({ timestamp: new Date().toISOString(), locale: newDefaultLocale, locales: newLocales, version: "1" }, null, 2) + "\n",
			"utf-8",
		);
	} catch (err) {
		console.warn(`  Warning: Could not write .i18n-configured marker: ${err.message}`);
	}

	// ── Summary ───────────────────────────────────────────────────────────────
	console.log("\n...done!\n");
	console.log("=====================================");
	console.log(" i18n configuration updated");
	console.log("=====================================\n");

	console.log("Next steps:");
	let step = 1;

	if (isSingleLanguage) {
		if (phaseIStripped) {
			console.log(`${step++}. All i18n artefacts have been stripped from src/ (Phase I).`);
			console.log(`${step++}. Update content in src/locales/${newDefaultLocale}/ to customise your text.`);
			console.log(`${step++}. Check src/data/navData.json — use plain string labels (not locale objects).`);
			console.log(`   Note: src/js/localeUtils.ts and src/js/translationUtils.ts remain as unused`);
			console.log(`   utilities. Delete them once you\'re satisfied everything works.`);
		} else {
			console.log(`${step++}. i18n artefacts were NOT stripped (Phase I skipped).`);
			console.log(`   Run npm run config-i18n again and confirm the strip if you want a clean setup.`);
		}
	} else {
		if (localesToAdd.length > 0) {
			console.log(`${step++}. Translate strings in src/locales/${localesToAdd.join("/ and src/locales/")}/`);
			console.log(`${step++}. Update route slugs in src/config/routeTranslations.ts`);
			console.log(`${step++}. Review auto-generated localeMap values in src/config/siteSettings.ts`);
		}
	}
	console.log(`${step++}. Run \`npm run dev\` to verify the site loads`);
	console.log();
}

configI18n().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
