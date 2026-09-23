#!/usr/bin/env node

/**
 * Removes the Prettier formatting tooling: config files, CI check, VSCode
 * formatter wiring, and the format/format:check scripts + devDependencies.
 * Does NOT reformat existing source files — they stay as Prettier left them
 * (tabs); this only removes the enforcement layer. Run with:
 * node scripts/remove-prettier.js
 */

import { existsSync, rmSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";
import readline from "readline";
import { checkFeatureFlagBeforeRun, disableFeatureFlag } from "./utils/feature-flags.js";
import { askYesNo } from "./utils/prompt.js";

const root = process.cwd();

// ─── Guard: already run? ──────────────────────────────────────────────────────
if (checkFeatureFlagBeforeRun(root, "prettier", "Prettier tooling")) {
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
	"\n⚠️  This will remove the Prettier formatting tooling (config, CI check, " +
		"VSCode wiring, format scripts).\nExisting files will NOT be reformatted — " +
		"they stay as Prettier left them.\n\nProceed?",
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

function removeFromFile(relPath, patterns) {
	const abs = join(root, relPath);

	if (!existsSync(abs)) return;

	let content = readFileSync(abs, "utf8");
	let updated = false;

	for (const pattern of patterns) {
		const after = content.replace(pattern, "");

		if (after !== content) {
			content = after;
			updated = true;
		}
	}

	if (updated) {
		writeFileSync(abs, content, "utf8");
	}
}

/** Re-adds the .gitignore rule for .vscode/settings.json, if it's not
 *  already there — personal VSCode settings are no longer repo-mandated. */
function restoreVscodeSettingsIgnore() {
	const abs = join(root, ".gitignore");

	if (!existsSync(abs)) return;

	const content = readFileSync(abs, "utf8");

	if (content.includes(".vscode/settings.json")) return;

	const withRule = content.replace(/\n*$/, "\n\n# vscode setting folder\n.vscode/settings.json\n");

	writeFileSync(abs, withRule, "utf8");
}

/** Reads a JSON file, applies `mutate` to the parsed object, writes it back
 *  tab-indented (matching the rest of the Prettier-formatted codebase). */
function patchJson(relPath, mutate) {
	const abs = join(root, relPath);

	if (!existsSync(abs)) return;

	const parsed = JSON.parse(readFileSync(abs, "utf8"));

	mutate(parsed);

	writeFileSync(abs, JSON.stringify(parsed, null, "\t") + "\n", "utf8");
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function runRemoval() {
	console.log("\nRemoving Prettier tooling...\n");

	// ── Config files ──────────────────────────────────────────────────────────
	remove(".prettierrc");
	remove(".prettierignore");
	remove(".git-blame-ignore-revs");

	// ── VSCode wiring ─────────────────────────────────────────────────────────
	remove(".vscode/settings.json");

	patchJson(".vscode/extensions.json", (json) => {
		if (Array.isArray(json.recommendations)) {
			json.recommendations = json.recommendations.filter((r) => r !== "esbenp.prettier-vscode");
		}
	});

	restoreVscodeSettingsIgnore();

	// ── CI ────────────────────────────────────────────────────────────────────
	remove(".github/workflows/format.yml");

	const workflowsDir = join(root, ".github", "workflows");
	if (existsSync(workflowsDir) && readdirSync(workflowsDir).length === 0) {
		remove(".github/workflows");
	}

	// ── package.json ─────────────────────────────────────────────────────────
	patchJson("package.json", (pkg) => {
		if (pkg.scripts) {
			delete pkg.scripts.format;
			delete pkg.scripts["format:check"];
		}
		if (pkg.devDependencies) {
			delete pkg.devDependencies.prettier;
			delete pkg.devDependencies["prettier-plugin-astro"];
		}
	});

	// ── README ────────────────────────────────────────────────────────────────
	removeFromFile("README.md", [
		/\n\| `npm run format`\s*\|[^\n]*\|/,
		/\n\| `npm run format:check`\s*\|[^\n]*\|/,
	]);

	// ── Disable feature flag ──────────────────────────────────────────────────
	await disableFeatureFlag(root, "prettier");

	console.log("\nDone! Prettier tooling has been removed.");
	console.log("Note: existing files were NOT reformatted — they stay as Prettier left them.");
	console.log("⚠ Run `npm install` to sync package-lock.json and node_modules.\n");
}
