#!/usr/bin/env node

/**
 * remove-dark-mode.js
 *
 * Removes dark mode support from the Advanced Astro i18n kit.
 * This script:
 *   - Removes ThemeProvider component
 *   - Removes DarkMode components (MoonSun, ThemeSelect)
 *   - Removes the dark mode toggle from Settings component
 *   - Removes the ThemeProvider import and usage from Meta component
 *   - Removes the inline dark mode script from BaseLayout
 *
 * Run with: npm run remove-dark-mode
 *
 * NOTE: After running this script, you will still need to manually:
 *   - Remove `body.dark-mode` CSS blocks from any custom components you've added
 *   - Remove the `dark` class from root.less variables if desired
 */

import { existsSync, rmSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// ─── Guard: already run? ──────────────────────────────────────────────────────
const markerPath = join(root, ".dark-mode-removed");
if (existsSync(markerPath)) {
	console.log("Dark mode has already been removed (.dark-mode-removed marker exists).");
	process.exit(0);
}

// ─── Confirmation prompt ──────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question(
	"\n⚠️  This will permanently remove dark mode support from the project.\n" +
	"Dark mode CSS in custom components must be removed manually.\n\n" +
	"Type 'yes' to confirm: ",
	(answer) => {
		rl.close();
		if (answer.trim().toLowerCase() !== "yes") {
			console.log("Aborted. No files were changed.");
			process.exit(0);
		}
		runRemoval();
	}
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function remove(relPath) {
	const abs = join(root, relPath);
	if (existsSync(abs)) {
		rmSync(abs, { recursive: true, force: true });
		console.log(`  removed  ${relPath}`);
	}
}

function replace(relPath, from, to) {
	const abs = join(root, relPath);
	if (!existsSync(abs)) return;
	const before = readFileSync(abs, "utf8");
	const after = before.replaceAll(from, to);
	if (before !== after) {
		writeFileSync(abs, after, "utf8");
		console.log(`  updated  ${relPath}`);
	}
}

function replaceRegex(relPath, pattern, replacement) {
	const abs = join(root, relPath);
	if (!existsSync(abs)) return;
	const before = readFileSync(abs, "utf8");
	const after = before.replace(pattern, replacement);
	if (before !== after) {
		writeFileSync(abs, after, "utf8");
		console.log(`  updated  ${relPath}`);
	}
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function runRemoval() {
	console.log("\nRemoving dark mode support...\n");

	// ── Remove DarkMode components ────────────────────────────────────────────
	remove("src/components/ThemeProvider");
	remove("src/components/DarkMode");

	// ── Update Settings to remove MoonSun import and usage ───────────────────
	const settingsPath = "src/components/Settings/Settings.astro";
	replace(settingsPath, `// import ThemeSelect from "@components/DarkMode/ThemeSelect.astro";\nimport MoonSun from "@components/DarkMode/MoonSun.astro";\n`, "");
	replace(settingsPath, `\t<MoonSun />\n`, "");

	// ── Remove ThemeProvider from Meta component ──────────────────────────────
	replace(
		"src/components/Meta/Meta.astro",
		`import ThemeProvider from "@components/ThemeProvider/ThemeProvider.astro";\n`,
		""
	);
	replace(
		"src/components/Meta/Meta.astro",
		"\n<!-- Dark / Light mode component -->\n<ThemeProvider />\n",
		""
	);

	// ── Remove dark mode inline script from BaseLayout ────────────────────────
	replaceRegex(
		"src/layouts/BaseLayout.astro",
		/\{\/\* Inlined to avoid FOUC[\s\S]*?<\/script>\n?/,
		""
	);

	// ── Create marker ──────────────────────────────────────────────────────────
	writeFileSync(markerPath, new Date().toISOString() + "\n", "utf8");

	console.log("\nDone! Dark mode components have been removed.");
	console.log("\nRemember to manually remove `body.dark-mode` CSS blocks");
	console.log("from any custom components in your project.\n");
}
