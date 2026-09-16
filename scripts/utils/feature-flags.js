import { readFileSync, promises as fs } from "fs";
import { join } from "path";

/**
 * Checks whether a feature flag is already disabled.
 *
 * @param {string} root - Project root.
 * @param {string} flagName - Feature flag key (e.g. "darkMode").
 * @param {string} featureLabel - Friendly name for logging.
 * @returns {boolean} True if the feature is already disabled.
 */
export function checkFeatureFlagBeforeRun(root, flagName, featureLabel) {
    const flagsPath = join(root, "src", "features", "featuresFlags.ts");

    try {
        const content = readFileSync(flagsPath, "utf8");
        const regex = new RegExp(`${flagName}\\s*:\\s*(true|false)`);
        const match = content.match(regex);

        if (match?.[1] === "false") {
            console.log(`ℹ️  Feature flags indicate ${featureLabel} is already disabled.`);
            return true;
        }
    } catch {
        // Ignore if feature flags file doesn't exist
    }

    return false;
}

/**
 * Sets a feature flag from true to false.
 *
 * @param {string} root - Project root.
 * @param {string} flagName - Feature flag key.
 */
export async function disableFeatureFlag(root, flagName) {
    console.log("\n🚩 Updating src/features/featuresFlags.ts...");

    const flagsPath = join(root, "src", "features", "featuresFlags.ts");

    try {
        await fs.access(flagsPath);

        const content = await fs.readFile(flagsPath, "utf8");

        const regex = new RegExp(`(${flagName}\\s*:\\s*)true`, "g");
        const updated = content.replace(regex, "$1false");

        if (updated !== content) {
            await fs.writeFile(flagsPath, updated, "utf8");
            console.log(`✔ Disabled '${flagName}' feature flag.`);
        } else {
            console.log(`ℹ️  '${flagName}' feature flag was already disabled.`);
        }
    } catch (error) {
        if (error.code === "ENOENT") {
            console.warn("⚠ Missing src/features/featuresFlags.ts");
        } else {
            console.error(`❌ Failed to update feature flags: ${error.message}`);
        }
    }
}