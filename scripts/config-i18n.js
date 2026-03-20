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

	// ── Prompt 1: multiple languages? ─────────────────────────────────────────
	const multiAnswer = (await ask("Do you plan to use multiple languages? (y/n): ")).trim().toLowerCase();
	if (multiAnswer !== "y") {
		rl.close();
		console.log("\nExiting. No changes made.\n");
		process.exit(0);
	}

	// ── Prompt 2: new default locale ──────────────────────────────────────────
	let newDefaultLocale;
	while (true) {
		const answer = (await ask(`\nDefault locale? [${defaultLocale}]: `)).trim();
		const val = answer === "" ? defaultLocale : answer.toLowerCase();
		if (validateLocale(val)) { newDefaultLocale = val; break; }
		console.log('  Invalid locale. Use a 2-letter code like "en", "fr", or "de".');
	}

	// ── Prompt 3: additional locales ──────────────────────────────────────────
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
	const newLocales = [...new Set([newDefaultLocale, ...additionalLocales])];

	// ── Prompt 4: prefixDefaultLocale ─────────────────────────────────────────
	const prefixPromptDefault = currentPrefixDefaultLocale ? "y" : "n";
	const prefixAnswer = (await ask(`\nPrefix default locale in URLs? (/en/about vs /about) (y/n) [${prefixPromptDefault}]: `)).trim().toLowerCase();
	const prefixDefaultLocale = prefixAnswer === "" ? currentPrefixDefaultLocale : prefixAnswer === "y";

	// ── Confirm ───────────────────────────────────────────────────────────────
	console.log(`\nNew config:`);
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

	// ── Summary ───────────────────────────────────────────────────────────────
	console.log("\n...done!\n");
	console.log("=====================================");
	console.log(" i18n configuration updated");
	console.log("=====================================\n");

	console.log("Next steps:");
	let step = 1;
	if (localesToAdd.length > 0) {
		console.log(`${step++}. Translate strings in src/locales/${localesToAdd.join("/ and src/locales/")}/`);
		console.log(`${step++}. Update route slugs in src/config/routeTranslations.ts`);
		console.log(`${step++}. Review auto-generated localeMap values in src/config/siteSettings.ts`);
	}
	console.log(`${step++}. Run \`npm run dev\` to verify the site loads`);
	console.log();
}

configI18n().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
