import { readFileSync, promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import { collectFiles } from "./utils/collect-files.js";
import { readI18nConfig } from "./utils/read-i18n-config.js";
import {
	checkFeatureFlagBeforeRun,
	disableFeatureFlag,
} from "./utils/feature-flags.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = process.env.SCRIPT_ROOT ?? join(__dirname, "..");


if (checkFeatureFlagBeforeRun(root, "cms", "Decap CMS")) {
	process.exit(0);
}


// Decap CMS file and directory paths
const astroConfigPath = join(root, "astro.config.ts");
const adminSourcePath = join(root, "public", "admin");
const adminPagePath = join(root, "src", "pages", "admin.astro");
const destinationDir = join(root, "scripts", "deleted");

// Features / Component locations based on your tree
const decapCMSFeaturePath = join(root, "src", "features", "decapCMS");
const blogContentPath = join(root, "src", "content", "blog");

// Blog Locales (JSON files matching your localization folders)
const blogLocaleEn = join(root, "src", "locales", "en", "blog.json");
const blogLocaleFr = join(root, "src", "locales", "fr", "blog.json");






// Dynamic blog routing locations based on your i18n structure
function resolveBlogPagesPaths() {
	const i18n = readI18nConfig(root);
	let prefixDefaultLocale = false;
	try {
		const astroConfig = readFileSync(astroConfigPath, "utf-8");
		const m = astroConfig.match(/prefixDefaultLocale:\s*(true|false)/);
		prefixDefaultLocale = m?.[1] === "true";
	} catch { /* keep false */ }

	const defaultBlogDir = prefixDefaultLocale && i18n
		? join(root, "src", "pages", i18n.defaultLocale, "blog")
		: join(root, "src", "pages", "blog");

	const nonDefaultBlogDirs = i18n
		? i18n.locales
			.filter((localeItem) => localeItem !== i18n.defaultLocale)
			.map((localeItem) => ({ locale: localeItem, path: join(root, "src", "pages", localeItem, "blog") }))
		: [{ locale: "fr", path: join(root, "src", "pages", "fr", "blog") }]; // Fixed: explicitly used "fr" string literal here

	return { defaultBlogDir, nonDefaultBlogDirs };
}

/**
 * Move helper with source check and target cleanup
 */
async function moveItem(sourcePath, destPath, label) {
	try {
		await fs.access(sourcePath);
		await fs.mkdir(dirname(destPath), { recursive: true });

		try {
			await fs.access(destPath);
			await fs.rm(destPath, { recursive: true, force: true });
		} catch { }

		await fs.rename(sourcePath, destPath);
	} catch (error) {
		if (error.code === "ENOENT") {
			// not found — skip silently
		} else {
			console.error(`❌ Error moving ${label}: ${error.message}`);
		}
	}
}

/**
 * Swaps a blog-aware i18n file for its no-blog fallback, if one is shipped.
 * Silently skips if the fallback isn't present (e.g. i18n was already removed).
 */
async function replaceNoBlog(relativeFilePath) {
	const noBlogPath = join(root, `${relativeFilePath}.no-blog.ts`);
	const targetPath = join(root, `${relativeFilePath}.ts`);

	try {
		await fs.access(noBlogPath);
	} catch {
		return;
	}

	await moveItem(targetPath, join(destinationDir, `${relativeFilePath}.ts`), "Blog-aware getLocalizedPathname (dynamic)");
	await fs.rename(noBlogPath, targetPath);
}

/**
 * Sweeps all files looking for imports pointing to features/decapCMS or blog routing
 */
async function scanForReferences(removedBlogContent) {
	console.log("\n🔍 Scanning for remaining references across /src...");
	const files = [];
	const srcDir = join(root, "src");

	try {
		await collectFiles(files, srcDir);
	} catch (error) {
		console.error(`Error collecting files: ${error}`);
		return;
	}

	const decapReferences = [];
	for (const file of files) {
		try {
			const content = await fs.readFile(file, "utf-8");
			if (content.match(/decapCMS|netlify-cms|from\s+["'].*decapCMS.*["']/i)) {
				decapReferences.push(file.replace(root, "."));
			}
		} catch { }
	}

	if (decapReferences.length > 0) {
		console.log(`\n⚠️  Found ${decapReferences.length} file(s) with Decap/Blog dependencies:`);
		decapReferences.forEach(file => console.log(`   - ${file}`));
	}
}

async function cleanupContentConfig() {
	console.log("\n⚙️  Removing src/content.config.ts...");
	const contentConfigPath = join(root, "src", "content.config.ts");
	await moveItem(contentConfigPath, join(destinationDir, "src", "content.config.ts"), "Content collections config");
}

async function cleanupNavData() {
	console.log("\n🗺️  Cleaning up src/data/navData.json...");
	const navDataPath = join(root, "src", "data", "navData.json");

	try {
		await fs.access(navDataPath);
		const content = await fs.readFile(navDataPath, "utf-8");
		const navData = JSON.parse(content);

		const filtered = navData.filter(item => {
			// 1. Check the item key safely (case-insensitive)
			const isBlogKey = item.key && String(item.key).toLowerCase() === "blog";

			// 2. Check the item URL safely, walking through strings or deep object values
			let isBlogUrl = false;
			if (item.urls) {
				if (typeof item.urls === "string") {
					isBlogUrl = item.urls.replace(/\/$/, "") === "/blog";
				} else if (typeof item.urls === "object") {
					isBlogUrl = Object.values(item.urls).some(
						val => typeof val === "string" && val.replace(/\/$/, "") === "/blog"
					);
				}
			}

			// Keep the item only if it's NOT related to the blog
			return !isBlogKey && !isBlogUrl;
		});

		await fs.writeFile(navDataPath, JSON.stringify(filtered, null, 2) + "\n", "utf-8");
		console.log("✅ Successfully removed Blog entries from navigation configurations.");
	} catch (error) {
		console.error(`❌ Error updating navData.json: ${error.message}`);
	}
}

async function removeDecapCMS() {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	const confirm = await new Promise(r => rl.question("Are you sure you want to completely rip out Decap CMS? (y/n): ", a => r(a.toLowerCase() === 'y')));

	if (!confirm) {
		console.log("Cancelled.");
		rl.close();
		return;
	}

	const clearBlog = await new Promise(r => rl.question("Do you also want to delete all blog content, UI features, and localized translations? (y/n): ", a => { rl.close(); r(a.toLowerCase() === 'y') }));

	// Execute Administration Module removal
	await moveItem(adminSourcePath, join(destinationDir, "public", "admin"), "Admin dashboard settings");
	await moveItem(adminPagePath, join(destinationDir, "src", "pages", "admin.astro"), "Admin Astro layout route");

	if (clearBlog) {
		// Remove component architectures
		await moveItem(decapCMSFeaturePath, join(destinationDir, "src", "features", "decapCMS"), "Decap CMS Components feature folder");
		await moveItem(blogContentPath, join(destinationDir, "src", "content", "blog"), "Markdown blog content directory");

		// Remove the dynamic route translations helper if it exists
		const dynamicRouteTranslationsPath = join(root, "src", "features", "i18n", "collections", "generateDynamicRouteTranslations.ts");
		await moveItem(
			dynamicRouteTranslationsPath,
			join(destinationDir, "src", "features", "i18n", "collections", "generateDynamicRouteTranslations.ts"),
			"Dynamic Route Translations handler"
		);
		await replaceNoBlog("src/features/i18n/routing/getLocalizedPathname");

		// Remove dedicated layout locales translations
		await moveItem(blogLocaleEn, join(destinationDir, "src", "locales", "en", "blog.json"), "English Blog Locale definitions");
		await moveItem(blogLocaleFr, join(destinationDir, "src", "locales", "fr", "blog.json"), "French Blog Locale definitions");

		// Remove dynamic UI Routing pages
		const { defaultBlogDir, nonDefaultBlogDirs } = resolveBlogPagesPaths();
		await moveItem(defaultBlogDir, join(destinationDir, "src", "pages", "blog-default"), "Default locale routing engine files");
		for (const { locale, path } of nonDefaultBlogDirs) {
			await moveItem(path, join(destinationDir, "src", "pages", `blog-${locale}`), `Localized Routing directory for (${locale})`);
		}

		await cleanupContentConfig();
		await cleanupNavData();
	}

	// Clean up general configurations maps
	try {
		let config = await fs.readFile(astroConfigPath, "utf-8");
		config = config.replace(/filter:\s*\(page\)\s*=>\s*!page\.includes\(["']\/admin["']\),\s*\n?/, "");
		await fs.writeFile(astroConfigPath, config, "utf-8");
		console.log("\n✅ Cleaned up tracking definitions inside astro.config.ts");
	} catch { }

	await disableFeatureFlag(root, "cms");
	await scanForReferences(clearBlog);
	console.log("\n🎉 Decommission operations successfully completed!");
}

removeDecapCMS();