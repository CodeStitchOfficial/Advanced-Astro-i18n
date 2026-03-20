import { promises as fs, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import { collectFiles } from "./utils/collect-files.js";
import { replaceInFiles } from "./utils/replace-in-files.js";
import { readI18nConfig } from "./utils/read-i18n-config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = process.env.SCRIPT_ROOT ?? join(__dirname, "..");

// Decap CMS file and directory paths
const astroConfigPath = join("astro.config.mjs");
const adminSourcePath = join("public", "admin");
const adminPagePath = join("src", "pages", "admin.astro");
const destinationDir = join("scripts", "deleted");
const adminDestinationPath = join(destinationDir, "admin");
const adminPageDestinationPath = join(destinationDir, "admin.astro");

// Blog-related static paths (locale-aware paths are resolved at runtime below)
const blogContentPath = join("src", "content", "blog");
const blogComponentsPath = join("src", "components");
const blogContentDestination = join(destinationDir, "blog");
const blogPagesDestination = join(destinationDir, "pages-blog");
const blogComponentsDestination = join(destinationDir, "components");

// Resolve blog pages paths based on current i18n config (sync)
function resolveBlogPagesPaths() {
	const i18n = readI18nConfig(root);
	let prefixDefaultLocale = false;
	try {
		const astroConfig = readFileSync(join(root, "astro.config.mjs"), "utf-8");
		const m = astroConfig.match(/prefixDefaultLocale:\s*(true|false)/);
		prefixDefaultLocale = m?.[1] === "true";
	} catch { /* keep false */ }

	// Default locale blog path
	const defaultBlogDir = prefixDefaultLocale && i18n
		? join("src", "pages", i18n.defaultLocale, "blog")
		: join("src", "pages", "blog");

	// Non-default locale blog paths
	const nonDefaultBlogDirs = i18n
		? i18n.locales
			.filter((l) => l !== i18n.defaultLocale)
			.map((l) => ({ locale: l, path: join("src", "pages", l, "blog") }))
		: [{ locale: "fr", path: join("src", "pages", "fr", "blog") }];

	return { defaultBlogDir, nonDefaultBlogDirs };
}

// Blog-related component folders to remove
const blogComponents = ["FeaturedPost", "BlogFullArticle", "BlogPreview", "Pagination"];

// Blog-related icon files to remove
const iconsPath = join("src", "icons");
const blogIcons = ["profile.svg"];
const iconsDestination = join(destinationDir, "icons-blog");

/**
 * Move blog component folders (FeaturedPost, BlogFullArticle, BlogPreview, Pagination, etc.)
 */
async function moveBlogComponents() {
	try {
		// Create destination directory
		await fs.mkdir(blogComponentsDestination, { recursive: true });

		let movedCount = 0;
		for (const componentName of blogComponents) {
			const sourcePath = join(blogComponentsPath, componentName);
			const destPath = join(blogComponentsDestination, componentName);

			try {
				// Check if component folder exists
				await fs.access(sourcePath);

				// Check if destination already exists and remove it
				try {
					await fs.access(destPath);
					await fs.rm(destPath, { recursive: true, force: true });
				} catch {
					// Destination doesn't exist, which is fine
				}

				// Move the component folder
				await fs.rename(sourcePath, destPath);
				console.log(`Moved ${sourcePath} to ${destPath}`);
				movedCount++;
			} catch (error) {
				if (error.code === "ENOENT") {
					// Component doesn't exist, skip silently
					continue;
				}
				console.error(`Error moving ${sourcePath}: ${error.message}`);
			}
		}

		return movedCount;
	} catch (error) {
		console.error(`Error moving blog components: ${error.message}`);
		return 0;
	}
}

/**
 * Move blog-related icon files to deleted folder
 */
async function moveBlogIcons() {
	try {
		// Create destination directory
		await fs.mkdir(iconsDestination, { recursive: true });

		let movedCount = 0;
		for (const icon of blogIcons) {
			const sourcePath = join(iconsPath, icon);
			const destPath = join(iconsDestination, icon);

			try {
				// Check if icon exists
				await fs.access(sourcePath);

				// Check if destination already exists and remove it
				try {
					await fs.access(destPath);
					await fs.rm(destPath, { force: true });
				} catch {
					// Destination doesn't exist, which is fine
				}

				// Move the icon file
				await fs.rename(sourcePath, destPath);
				console.log(`Moved ${sourcePath} to ${destPath}`);
				movedCount++;
			} catch (error) {
				if (error.code === "ENOENT") {
					// Icon doesn't exist, skip silently
					continue;
				}
				console.error(`Error moving ${sourcePath}: ${error.message}`);
			}
		}

		return movedCount;
	} catch (error) {
		console.error(`Error moving blog icons: ${error.message}`);
		return 0;
	}
}

/**
 * Scan for remaining Decap/blog references in the codebase
 */
async function scanForReferences(removedBlogContent) {
	console.log("\nScanning for remaining references...");

	const files = [];
	const srcDir = join(process.cwd(), "src");

	try {
		await collectFiles(files, srcDir);
	} catch (error) {
		console.error(`Error collecting files: ${error}`);
		return { decapReferences: [], blogReferences: [] };
	}

	const decapReferences = [];
	const blogReferences = [];

	// Search for references in collected files
	for (const file of files) {
		try {
			const content = await fs.readFile(file, "utf-8");

			// Check for Decap/Netlify CMS references
			if (content.match(/decap|netlify-cms/i)) {
				decapReferences.push(file);
			}

			// Check for blog component imports if blog was removed
			if (removedBlogContent && content.match(/from\s+["'].*\/(FeaturedPost|BlogFullArticle|BlogPreview|Pagination).*["']/)) {
				blogReferences.push(file);
			}
		} catch (error) {
			// Skip files that can't be read
			continue;
		}
	}

	// Report findings
	if (decapReferences.length > 0) {
		console.log(`\n⚠️  Found ${decapReferences.length} file(s) with Decap CMS references:`);
		decapReferences.forEach((file) => {
			console.log(`   - ${file.replace(process.cwd(), ".")}`);
		});
	}

	if (blogReferences.length > 0 && removedBlogContent) {
		console.log(`\n⚠️  Found ${blogReferences.length} file(s) with blog component imports:`);
		blogReferences.forEach((file) => {
			console.log(`   - ${file.replace(process.cwd(), ".")}`);
		});
	}

	return { decapReferences, blogReferences };
}

/**
 * Update or delete content.config.ts depending on other collections
 */
async function cleanupContentConfig() {
	console.log("\nCleaning up content.config.ts...");

	const contentConfigPath = join(process.cwd(), "src", "content.config.ts");

	try {
		// Check if file exists
		await fs.access(contentConfigPath);

		// Read the file
		const content = await fs.readFile(contentConfigPath, "utf-8");

		// Check if there are other collections (like projects)
		const hasOtherCollections = content.match(/collections\s*=\s*\{[^}]*\}/s);

		if (hasOtherCollections) {
			// Check if blog is the only collection
			const collectionMatch = content.match(/collections\s*=\s*\{([^}]*)\}/s);
			if (collectionMatch) {
				const collectionsContent = collectionMatch[1];
				// Count collections by looking for collection entries (key: value pattern)
				const collectionEntries = collectionsContent.match(/\w+\s*:\s*\w+/g) || [];

				if (collectionEntries.length === 1 && content.includes("blog:")) {
					// Only blog collection exists, delete the entire file
					await fs.rm(contentConfigPath, { force: true });
					console.log("Deleted content.config.ts (no other collections remaining)");
				} else if (collectionEntries.length > 1) {
					// Multiple collections exist, remove just the blog collection
					let updatedContent = content;

					// Remove the blog collection definition (const blogsCollection = ...)
					updatedContent = updatedContent.replace(
						/const\s+blogsCollection\s*=\s*defineCollection\([^)]*\);?\n*/s,
						""
					);

					// Remove blog from collections export
					updatedContent = updatedContent.replace(/\s*blog\s*:\s*blogsCollection\s*,?\s*/g, "");

					// Clean up any trailing commas in the collections object
					updatedContent = updatedContent.replace(/,(\s*)\}/g, "$1}");

					// Write the updated file
					await fs.writeFile(contentConfigPath, updatedContent, "utf-8");
					console.log("Updated content.config.ts (removed blog collection, kept other collections)");
				}
			}
		} else {
			// Couldn't parse collections, delete the file to be safe
			await fs.rm(contentConfigPath, { force: true });
			console.log("Deleted content.config.ts");
		}
	} catch (error) {
		if (error.code === "ENOENT") {
			console.log("content.config.ts not found, skipping...");
		} else {
			console.error(`Error cleaning up content.config.ts: ${error.message}`);
		}
	}
}

/**
 * Clean up navData.json by removing blog navigation link
 */
async function cleanupNavData() {
	console.log("\nCleaning up navData.json...");

	const navDataPath = join(process.cwd(), "src", "data", "navData.json");

	try {
		// Check if file exists
		await fs.access(navDataPath);

		const content = await fs.readFile(navDataPath, "utf-8");
		const navData = JSON.parse(content);

		// Filter out the blog entry
		const filteredNavData = navData.filter((item) => {
			return item.key !== "Blog" && item.url !== "/blog/";
		});

		// Write back the updated JSON with proper formatting
		await fs.writeFile(navDataPath, JSON.stringify(filteredNavData, null, 2) + "\n", "utf-8");
		console.log("Cleaned up navData.json (Blog link removed)");
	} catch (error) {
		if (error.code === "ENOENT") {
			console.log("navData.json not found, skipping...");
		} else {
			console.error(`Error cleaning up navData.json: ${error.message}`);
		}
	}
}

/**
 * Move a directory, handling destination cleanup
 */
async function moveDir(sourcePath, destPath, label) {
	try {
		await fs.access(sourcePath);

		// Check if destination already exists and remove it
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

/**
 * Move a file, handling destination cleanup
 */
async function moveFile(sourcePath, destPath, label) {
	try {
		await fs.access(sourcePath);

		// Check if destination already exists and remove it
		try {
			await fs.access(destPath);
			await fs.rm(destPath, { force: true });
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

/**
 * Main function to remove Decap CMS
 */
async function removeDecapCMS() {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	// First confirmation
	const userConfirmed = await new Promise((resolve) => {
		rl.question("Are you sure you want to remove Decap CMS from this project? (y/n): ", (answer) => {
			resolve(answer.toLowerCase() === "y");
		});
	});

	if (!userConfirmed) {
		console.log("Operation cancelled by the user.");
		rl.close();
		process.exit(0);
	}

	// Ask about removing blog content
	const removeBlogContent = await new Promise((resolve) => {
		rl.question("Do you also want to remove all blog-related content and config files? (choose no if you want to run local Content Collections without Decap) (y/n): ", (answer) => {
			rl.close();
			resolve(answer.toLowerCase() === "y");
		});
	});

	// Newline for better output formatting
	console.log();

	try {
		// Create the destination directory if it doesn't exist
		await fs.access(destinationDir).catch(async () => {
			await fs.mkdir(destinationDir, { recursive: true });
			console.log(`Created directory ${destinationDir}`);
		});

		// Move the admin folder
		await moveDir(adminSourcePath, adminDestinationPath, "Admin folder");

		// Move the admin.astro page
		await moveFile(adminPagePath, adminPageDestinationPath, "Admin page");

		// Move blog content if requested
		if (removeBlogContent) {
			// Move blog content folder (includes en/ and fr/ subdirectories)
			await moveDir(blogContentPath, blogContentDestination, "Blog content folder");

			// Move blog component folders
			const movedComponentsCount = await moveBlogComponents();
			if (movedComponentsCount > 0) {
				console.log(`Moved ${movedComponentsCount} blog component folder(s)`);
			} else {
				console.log(`No blog component folders found, skipping...`);
			}

			// Move blog icon files
			const movedIconsCount = await moveBlogIcons();
			if (movedIconsCount > 0) {
				console.log(`Moved ${movedIconsCount} blog icon file(s)`);
			} else {
				console.log(`No blog icon files found, skipping...`);
			}

			// Move blog pages — paths depend on prefixDefaultLocale and active locales
			const { defaultBlogDir, nonDefaultBlogDirs } = resolveBlogPagesPaths();
			await moveDir(defaultBlogDir, blogPagesDestination, "Blog pages folder (default locale)");
			for (const { locale, path } of nonDefaultBlogDirs) {
				await moveDir(path, join(destinationDir, `pages-blog-${locale}`), `Blog pages folder (${locale})`);
			}
		}
	} catch (error) {
		console.error(`Error moving files: ${error}`);
	}

	// Update astro.config.mjs
	try {
		let astroConfigContent = await fs.readFile(astroConfigPath, "utf-8");

		// Remove the sitemap filter for /admin
		const sitemapFilterRegex = /filter:\s*\(page\)\s*=>\s*!page\.includes\(["']\/admin["']\),\s*\n?/;
		astroConfigContent = astroConfigContent.replace(sitemapFilterRegex, "");

		// Remove any empty lines left behind
		const emptyLineRegex = /^\s*[\r\n]/gm;
		astroConfigContent = astroConfigContent.replace(emptyLineRegex, "");

		await fs.writeFile(astroConfigPath, astroConfigContent, "utf-8");
		console.log(`Updated ${astroConfigPath}`);

		// Clean up blog config and nav if blog content was removed
		if (removeBlogContent) {
			await cleanupContentConfig();
			await cleanupNavData();
		}

		// Scan for remaining references
		const { decapReferences, blogReferences } = await scanForReferences(removeBlogContent);

		console.log("\n...done!\n");
		console.log("=================================================");
		console.log(" Successfully removed Decap CMS from the project");
		console.log("=================================================\n");

		// Next steps
		if (decapReferences.length > 0 || (blogReferences.length > 0 && removeBlogContent)) {
			console.log("⚠️  Manual cleanup needed:");
			if (decapReferences.length > 0) {
				console.log("   - Review files with Decap CMS references listed above");
			}
			if (blogReferences.length > 0 && removeBlogContent) {
				console.log("   - Fix files with remaining blog imports (auto-cleanup attempted)");
			}
			console.log();
		}

		console.log("Next steps:");
		if (removeBlogContent) {
			console.log("1. Update any navigation/links that point to /blog");
			console.log("2. Run your build to ensure everything works");
			console.log("3. All removed files are in scripts/deleted/ if you need to restore them\n");
		} else {
			console.log("1. Run your build to ensure everything works");
			console.log("2. All removed files are in scripts/deleted/ if you need to restore them\n");
		}
	} catch (error) {
		console.error(`Error updating ${astroConfigPath}: ${error}`);
	}
}

// Run the script
removeDecapCMS();
