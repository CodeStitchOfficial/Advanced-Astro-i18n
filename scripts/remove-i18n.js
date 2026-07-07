#!/usr/bin/env node

import fs from "fs";
import path from "path";
import readline from "readline";
import {
    checkFeatureFlagBeforeRun,
    disableFeatureFlag,
} from "./utils/feature-flags.js";

const root = process.cwd();
const backupRootDir = path.join(root, "scripts/deleted");

// ─── Guard: already run? ──────────────────────────────────────────────────────
if (checkFeatureFlagBeforeRun(root, "i18n", "i18n")) {
    process.exit(0);
}

// ─── Confirmation prompt ──────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question(
    "\n⚠️  This will permanently disable and remove i18n support from the project.\n" +
    "Files will be backed up to 'scripts/deleted/'.\n\n" +
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

/** Moves a file or directory to scripts/deleted/ preserving its relative hierarchy */
function moveToDeletedBackup(targetPath) {
    if (!fs.existsSync(targetPath)) return;

    const relativePath = path.relative(root, targetPath);
    const destinationPath = path.join(backupRootDir, relativePath);

    // Create target directory structure inside scripts/deleted
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });

    // Use copy + delete strategy to avoid Windows EPERM file-locking constraints
    fs.cpSync(targetPath, destinationPath, { recursive: true });
    fs.rmSync(targetPath, { recursive: true, force: true });
}

function keepEnglishOnly(value) {
    if (Array.isArray(value)) {
        return value.map(keepEnglishOnly);
    }

    if (value && typeof value === "object") {
        const result = {};

        for (const [key, val] of Object.entries(value)) {
            if (key === "urls" || key === "label") {
                result[key] = { en: val.en };
            } else {
                result[key] = keepEnglishOnly(val);
            }
        }

        return result;
    }

    return value;
}

function cleanupNavData() {
    const navDataPath = path.join(root, "src", "data", "navData.json");

    if (!fs.existsSync(navDataPath)) {
        return;
    }

    const navData = JSON.parse(fs.readFileSync(navDataPath, "utf8"));

    const updated = keepEnglishOnly(navData);

    fs.writeFileSync(
        navDataPath,
        JSON.stringify(updated, null, 2) + "\n",
        "utf8"
    );

    console.log("✔ Removed non-English localized values from navData.json");
}

function removeDirectory(dir) {
    if (fs.existsSync(dir)) {
        moveToDeletedBackup(dir);
    }
}

function removeFromFile(filePath, patterns) {
    const fullPath = path.join(root, filePath);

    if (!fs.existsSync(fullPath)) {
        console.warn(`⚠ Missing: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, "utf8");
    let updated = false;

    for (const pattern of patterns) {
        if (pattern.test(content)) {
            content = content.replace(pattern, "");
            updated = true;
        }
    }

    if (updated) {
        fs.writeFileSync(fullPath, content);
    }
}

function replaceNoI18n(filePath) {
    const noI18nPath = path.join(root, `${filePath}.no-i18n.ts`);
    const targetPath = path.join(root, `${filePath}.ts`);

    if (!fs.existsSync(noI18nPath)) {
        throw new Error(`Missing fallback file: ${noI18nPath}`);
    }

    // If target exists, backup before overriding
    if (fs.existsSync(targetPath)) {
        moveToDeletedBackup(targetPath);
    }

    fs.renameSync(noI18nPath, targetPath);
}



// ─── Main Execution ─────────────────────────────────────────────────────────── 
async function runRemoval() {
    console.log("\nStarting i18n removal process...\n");

    // 1. Flip i18n flag to false
    await disableFeatureFlag(root, "i18n");

    // 2. Remove (Move) i18n-owned directories
    removeDirectory(path.join(root, "src/features/i18n"));
    removeDirectory(path.join(root, "src/pages/fr"));
    removeDirectory(path.join(root, "src/locales/fr"));
    cleanupNavData();

    // 3. Replace fallback utility files (and backup the old ones)
    replaceNoI18n("src/js/getSiteContext");
    replaceNoI18n("src/features/decapCMS/core/getBlogPosts");
    replaceNoI18n("src/js/routes");

    // 4. Clean up imports and component usages
    removeFromFile("src/components/Settings/Settings.astro", [
        /import\s+TwoLocalesSelect\s+from\s+["'][^"']*TwoLocalesSelect\.astro["'];?\r?\n/g, /\s*<TwoLocalesSelect\s*\/>\r?\n?/g,
    ]);

    removeFromFile("src/pages/index.astro", [
        /import\s+BrowserLanguageRedirect\s+from\s+["'][^"']*BrowserLanguageRedirect\.astro["'];?\r?\n/g, /\s*<BrowserLanguageRedirect\s*\/>\r?\n?/g,
    ]);

    console.log("\n✔ i18n removal complete. Originals backed up to scripts/deleted/");
}