#!/usr/bin/env node

/**
 * Removes dark mode support: DarkMode components, Settings toggle, BaseLayout
 * inline scripts, and all body.dark-mode CSS blocks. Run with:
 * node scripts/remove-dark-mode.js
 */

import { existsSync, rmSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import {
	checkFeatureFlagBeforeRun,
	disableFeatureFlag,
} from "./utils/feature-flags.js";
import { askYesNo } from "./utils/prompt.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = process.env.SCRIPT_ROOT ?? join(__dirname, "..");

// ─── Guard: already run? ──────────────────────────────────────────────────────
if (checkFeatureFlagBeforeRun(root, "darkMode", "Dark Mode")) {
	process.exit(0);
}

// ─── Confirmation prompt ──────────────────────────────────────────────────────
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

const proceed = await askYesNo(
	ask,
	"\n⚠️  This will permanently remove dark mode support from the project.\n\nProceed?",
	false,
);
rl.close();

if (!proceed) {
	console.log("Aborted. No files were changed.");
	process.exit(0);
}

await runRemoval();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function remove(relPath) {
	const abs = join(root, relPath);

	if (existsSync(abs)) {
		rmSync(abs, { recursive: true, force: true });
	}
}

function replace(relPath, from, to) {
	const abs = join(root, relPath);

	if (!existsSync(abs)) return;

	const before = readFileSync(abs, "utf8");
	const after = before.replaceAll(from, to);

	if (before !== after) {
		writeFileSync(abs, after, "utf8");
	}
}

function replaceRegex(relPath, pattern, replacement) {
	const abs = join(root, relPath);

	if (!existsSync(abs)) return;

	const before = readFileSync(abs, "utf8");
	const after = before.replace(pattern, replacement);

	if (before !== after) {
		writeFileSync(abs, after, "utf8");
	}
}

function removeDarkModeBlocks(content) {
	let result = content;
	const selector = "body.dark-mode";
	let idx;

	while ((idx = result.indexOf(selector)) !== -1) {
		const openBrace = result.indexOf("{", idx);

		if (openBrace === -1) break;

		let depth = 1;
		let pos = openBrace + 1;

		while (pos < result.length && depth > 0) {
			if (result[pos] === "{") depth++;
			else if (result[pos] === "}") depth--;
			pos++;
		}

		if (result[pos] === "\n") pos++;

		let start = idx;

		while (start > 0 && result[start - 1] !== "\n") {
			start--;
		}

		while (start > 0) {
			const lineEnd = start - 1;

			if (result[lineEnd] !== "\n") break;

			let lineStart = lineEnd - 1;

			while (lineStart > 0 && result[lineStart - 1] !== "\n") {
				lineStart--;
			}

			const line = result.slice(lineStart, lineEnd).trim();

			if (line === "" || /^\/\*.*\*\/$/.test(line)) {
				start = lineStart;
			} else {
				break;
			}
		}

		result = result.slice(0, start) + result.slice(pos);
	}

	result = result.replace(/\n[ \t]*@media[^{]+\{\s*\}[ \t]*/g, "");
	result = result.replace(/\n[ \t]*\/\* [Dd]ark [Mm]ode[^*]*\*\/[ \t]*/gi, "");

	return result;
}

function walkFiles(dir, exts) {
	const files = [];

	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);

		if (entry.isDirectory()) {
			files.push(...walkFiles(full, exts));
		} else if (exts.some((ext) => entry.name.endsWith(ext))) {
			files.push(full);
		}
	}

	return files;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function runRemoval() {
	console.log("\nRemoving dark mode support...\n");

	// ── Remove DarkMode components ────────────────────────────────────────────
	remove("src/features/darkmode");

	// ── Update Settings ───────────────────────────────────────────────────────
	const settingsPath = "src/components/Settings/Settings.astro";

	replaceRegex(
		settingsPath,
		/import ThemeSelect from "src\/features\/darkmode\/ThemeSelect\.astro";\r?\n/,
		""
	);

	replaceRegex(
		settingsPath,
		/\s*<ThemeSelect \/>\r?\n?/,
		""
	);

	// ── Remove dark mode inline scripts ───────────────────────────────────────
	replaceRegex(
		"src/layouts/BaseLayout.astro",
		/\n\t\t<!-- FOUC prevention[\s\S]*?<\/script>/,
		""
	);

	replaceRegex(
		"src/layouts/BaseLayout.astro",
		/\n\n<!-- Re-apply theme[\s\S]*?<\/script>\n?/,
		""
	);

	// ── Sweep CSS ─────────────────────────────────────────────────────────────
	console.log("\nSweeping src/ for body.dark-mode CSS blocks...\n");

	const srcDir = join(root, "src");
	const srcFiles = walkFiles(srcDir, [".astro", ".less", ".css"]);
	for (const file of srcFiles) {
		const before = readFileSync(file, "utf8");
		const after = removeDarkModeBlocks(before);

		if (before !== after) {
			writeFileSync(file, after, "utf8");
		}
	}

	// ── Disable feature flag ──────────────────────────────────────────────────
	await disableFeatureFlag(root, "darkMode");

	console.log("\nDone! Dark mode has been fully removed.\n");
}