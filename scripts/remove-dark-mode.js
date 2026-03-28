#!/usr/bin/env node

/**
 * remove-dark-mode.js
 *
 * Removes dark mode support from the Advanced Astro i18n kit.
 * This script:
 *   - Removes DarkMode components (DarkModeToggle, ThemeSelect)
 *   - Removes the dark mode toggle from Settings component
 *   - Removes the inline dark mode scripts from BaseLayout
 *   - Sweeps all src .astro/.less/.css files for body.dark-mode CSS blocks
 *
 * Run with: npm run remove-dark-mode
 */

import { existsSync, rmSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = process.env.SCRIPT_ROOT ?? join(__dirname, "..");

// ─── Guard: already run? ──────────────────────────────────────────────────────
const markerPath = join(root, ".dark-mode-removed");
if (existsSync(markerPath)) {
	console.log("Dark mode has already been removed (.dark-mode-removed marker exists).");
	process.exit(0);
}

// ─── Confirmation prompt ──────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question(
	"\n⚠️  This will permanently remove dark mode support from the project.\n\n" +
	"Proceed? (y/n): ",
	(answer) => {
		rl.close();
		if (answer.trim().toLowerCase() !== "y") {
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

/**
 * Remove all `body.dark-mode { ... }` blocks from a CSS string.
 * Uses brace counting so it handles arbitrary nesting depth.
 * Also eats the preceding blank line and any `/* Dark Mode *\/` comment line.
 */
function removeDarkModeBlocks(content) {
	let result = content;
	const selector = "body.dark-mode";
	let idx;

	while ((idx = result.indexOf(selector)) !== -1) {
		// Find the opening brace of this block
		const openBrace = result.indexOf("{", idx);
		if (openBrace === -1) break;

		// Walk forward counting braces to find the matching closing brace
		let depth = 1;
		let pos = openBrace + 1;
		while (pos < result.length && depth > 0) {
			if (result[pos] === "{") depth++;
			else if (result[pos] === "}") depth--;
			pos++;
		}
		// pos is now one past the closing '}'

		// Consume the trailing newline after the closing brace
		if (result[pos] === "\n") pos++;

		// Walk back to the start of the line containing 'body.dark-mode'
		let start = idx;
		while (start > 0 && result[start - 1] !== "\n") start--;

		// Eat preceding blank lines and /* … */ comment lines
		while (start > 0) {
			const lineEnd = start - 1; // the \n character
			if (result[lineEnd] !== "\n") break;
			let lineStart = lineEnd - 1;
			while (lineStart > 0 && result[lineStart - 1] !== "\n") lineStart--;
			const line = result.slice(lineStart, lineEnd).trim();
			if (line === "" || /^\/\*.*\*\/$/.test(line)) {
				start = lineStart;
			} else {
				break;
			}
		}

		result = result.slice(0, start) + result.slice(pos);
	}

	// Remove empty @media blocks left behind (only whitespace inside)
	result = result.replace(/\n[ \t]*@media[^{]+\{\s*\}[ \t]*/g, "");
	// Remove orphaned /* Dark Mode */ comment lines
	result = result.replace(/\n[ \t]*\/\* [Dd]ark [Mm]ode[^*]*\*\/[ \t]*/gi, "");

	return result;
}

/** Recursively collect files matching any of the given extensions. */
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
function runRemoval() {
	console.log("\nRemoving dark mode support...\n");

	// ── Remove DarkMode components ────────────────────────────────────────────
	remove("src/components/DarkMode");

	// ── Update Settings to remove ThemeSelect import and usage ───────────────
	const settingsPath = "src/components/Settings/Settings.astro";
	replaceRegex(settingsPath, /import ThemeSelect from "@components\/DarkMode\/ThemeSelect\.astro";\r?\n/, "");
	replaceRegex(settingsPath, /\t<ThemeSelect \/>\r?\n/, "");

	// ── Remove dark mode inline scripts from BaseLayout ──────────────────────
	// FOUC prevention script (lives in <head>)
	replaceRegex(
		"src/layouts/BaseLayout.astro",
		/\n\t\t<!-- FOUC prevention[\s\S]*?<\/script>/,
		""
	);
	// View Transition re-apply script (lives after </html>)
	replaceRegex(
		"src/layouts/BaseLayout.astro",
		/\n\n<!-- Re-apply theme[\s\S]*?<\/script>\n?/,
		""
	);

	// ── Sweep all src files for body.dark-mode CSS blocks ────────────────────
	console.log("\nSweeping src/ for body.dark-mode CSS blocks...\n");
	const srcDir = join(root, "src");
	const srcFiles = walkFiles(srcDir, [".astro", ".less", ".css"]);
	for (const file of srcFiles) {
		const before = readFileSync(file, "utf8");
		const after = removeDarkModeBlocks(before);
		if (before !== after) {
			writeFileSync(file, after, "utf8");
			const rel = file.slice(root.length).replace(/\\/g, "/").replace(/^\//, "");
			console.log(`  updated  ${rel}`);
		}
	}

	// ── Create marker ──────────────────────────────────────────────────────────
	writeFileSync(markerPath, new Date().toISOString() + "\n", "utf8");

	console.log("\nDone! Dark mode has been fully removed.\n");
}
