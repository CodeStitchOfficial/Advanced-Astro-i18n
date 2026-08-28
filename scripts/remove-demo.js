#!/usr/bin/env node

/**
 * Removes demo-specific files and references without touching pages or layouts.
 */

import { promises as fs } from "fs";
import { join, relative, basename } from "path";
import readline from "readline";

import { collectFiles } from "./utils/collect-files.js";
import {
	checkFeatureFlagBeforeRun,
	disableFeatureFlag,
} from "./utils/feature-flags.js";
import { askYesNo } from "./utils/prompt.js";

const root = process.cwd();

if (checkFeatureFlagBeforeRun(root, "demo", "Demo Content")) {
	process.exit(0);
}

const DEMO = {
	featureDir: join(root, "src", "features", "demo"),

	assets: [
		join(root, "src", "assets", "images", "hero.jpg"),
		join(root, "src", "assets", "images", "hero-m.jpg"),
		join(root, "src", "assets", "images", "construction.jpg"),
		join(root, "src", "assets", "images", "portfolio"),
		join(root, "src", "assets", "images", "CTA"),
	],

	pages: [
		join(root, "src", "pages", "about.astro"),
		join(root, "src", "pages", "reviews.astro"),
		join(root, "src", "pages", "projects"),

		join(root, "src", "pages", "fr", "a-propos.astro"),
		join(root, "src", "pages", "fr", "avis.astro"),
		join(root, "src", "pages", "fr", "projets"),
	],

	navKeys: new Set([
		"about",
		"projects",
		"reviews",
	]),
};

async function exists(path) {
	try {
		await fs.access(path);
		return true;
	} catch {
		return false;
	}
}

async function removeItem(path) {
	if (!(await exists(path))) return;
	await fs.rm(path, { recursive: true, force: true });
}

async function ask(question) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	const answer = await new Promise(resolve =>
		rl.question(question, resolve)
	);

	rl.close();

	return answer;
}

async function discoverDemoComponents() {
	if (!(await exists(DEMO.featureDir))) return [];

	const files = await fs.readdir(DEMO.featureDir);

	return files
		.filter(file => file.endsWith(".astro"))
		.map(file => basename(file, ".astro"));
}

function removeNavEntries(items, keys) {
	return items
		.filter(item => !keys.has(item.key))
		.map(item => ({
			...item,
			children: Array.isArray(item.children)
				? removeNavEntries(item.children, keys)
				: [],
		}));
}

async function cleanupNavigation() {
	const navPath = join(root, "src", "data", "navData.json");

	if (!(await exists(navPath))) return;

	try {
		const nav = JSON.parse(await fs.readFile(navPath, "utf8"));

		const cleaned = removeNavEntries(nav, DEMO.navKeys);

		await fs.writeFile(
			navPath,
			JSON.stringify(cleaned, null, 2) + "\n",
			"utf8"
		);

		console.log("✅ Updated navigation");
	}
	catch (err) {
		console.error(`❌ Failed updating navData.json: ${err.message}`);
	}
}

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function removeDemoReferences(componentNames) {
	console.log("\n🔍 Cleaning Astro files...\n");

	const files = [];
	await collectFiles(files, join(root, "src"));

	let updated = 0;

	const demoAssets = [
		"hero",
		"hero-m",
		"construction",
		"portfolio",
		"CTA",
	];

	for (const file of files) {
		if (!file.endsWith(".astro")) continue;

		let source = await fs.readFile(file, "utf8");
		const original = source;

		// Remove imports and usages for every discovered component
		for (const component of componentNames) {

			const importRegex = new RegExp(
				`^[ \\t]*import\\s+${escapeRegex(component)}\\s+from\\s+["'][^"']+["'];?\\r?\\n`,
				"gm"
			);

			const usageRegex = new RegExp(
				`^[ \\t]*<${escapeRegex(component)}\\b[\\s\\S]*?\\/>[ \\t]*\\r?\\n?`,
				"gm"
			);

			source = source.replace(importRegex, "");
			source = source.replace(usageRegex, "");
		}

		// Remove demo asset imports
		for (const asset of demoAssets) {
			const assetRegex = new RegExp(
				`^[ \\t]*import\\s+.*?from\\s+["'][^"']*${escapeRegex(asset)}[^"']*["'];?\\r?\\n`,
				"gm"
			);

			source = source.replace(assetRegex, "");
		}

		source = source.replace(/\n{3,}/g, "\n\n");

		if (source !== original) {
			await fs.writeFile(file, source, "utf8");
			updated++;
		}
	}

	console.log(`\n✅ Updated ${updated} Astro file(s).`);
}

async function scanForRemainingReferences(componentNames) {
	console.log("\n🔎 Scanning for remaining demo references...\n");

	const files = [];
	await collectFiles(files, join(root, "src"));

	const names = componentNames.join("|");

	const regex = new RegExp(
		`features\\\\/demo|features/demo|${names}`,
		"i"
	);

	const matches = [];

	for (const file of files) {
		const content = await fs.readFile(file, "utf8");

		if (regex.test(content)) {
			matches.push(relative(root, file));
		}
	}

	if (matches.length === 0) {
		console.log("✅ No remaining demo references found.");
		return;
	}

	console.log(
		"\n⚠ Remaining demo references:\n"
	);

	for (const file of matches) {
		console.log(`   - ${file}`);
	}
}

async function removeDemo() {

	const confirm = await askYesNo(
		ask,
		"\nThis will permanently remove all demo content.\n\nContinue?",
		false,
	);

	if (!confirm) {
		console.log("\nCancelled.");
		return;
	}

	console.log("\nDiscovering demo components...\n");

	const demoComponents = await discoverDemoComponents();

	console.log(
		`Found ${demoComponents.length} demo component(s).`
	);
	console.log("\nRemoving demo pages...\n");

	for (const page of DEMO.pages) {
		await removeItem(page);
	}

	console.log("\nRemoving demo assets...\n");

	for (const asset of DEMO.assets) {
		await removeItem(asset);
	}

	console.log();

	await cleanupNavigation();

	console.log();

	// Remove imports and component usage while the feature
	// still exists to avoid temporary broken imports.
	await removeDemoReferences(demoComponents);

	console.log("\nRemoving demo feature...\n");

	await removeItem(DEMO.featureDir);

	console.log();

	await scanForRemainingReferences(demoComponents);
	console.log();

	await disableFeatureFlag(root, "demo");

	console.log("✅ Disabled Demo feature flag.");

	console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 Demo content successfully removed!

The following actions were completed:

 • Removed demo feature module
 • Removed demo pages
 • Removed demo assets
 • Cleaned navigation entries
 • Removed demo imports
 • Removed demo component usage
 • Disabled the Demo feature flag

Next recommended steps:

  npm run dev

Verify the site still builds correctly.
Any remaining references (if any) were listed above.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

removeDemo().catch(error => {
	console.error("\n❌ Demo removal failed.\n");
	console.error(error);
	process.exit(1);
});