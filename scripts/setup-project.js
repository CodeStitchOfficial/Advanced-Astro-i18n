#!/usr/bin/env node

import { readFileSync } from "fs";
import { join } from "path";
import readline from "readline";
import { spawn } from "child_process";
import {
    checkFeatureFlagBeforeRun,
    disableFeatureFlag,
} from "./utils/feature-flags.js";
import { askYesNo } from "./utils/prompt.js";

const root = process.cwd();


// Guard block. if the value of setup inside the featuresFlags.ts is set to false. it means this script has been run.
if (checkFeatureFlagBeforeRun(root, "setup", "project setup")) {
    process.exit(0);
}



const featuresFile = join(
    root,
    "src",
    "features",
    "featuresFlags.ts"
);

/**
 * Reads the current feature flags from featuresFlags.ts
 */
function readFeatureFlags() {
    const content = readFileSync(featuresFile, "utf8");

    const getFlag = (name) => {
        const match = content.match(
            new RegExp(`${name}\\s*:\\s*(true|false)`)
        );

        return match?.[1] === "true";
    };

    return {
        setup: getFlag("setup"),
        i18n: getFlag("i18n"),
        cms: getFlag("cms"),
        demo: getFlag("demo"),
        darkMode: getFlag("darkMode"),
    };
}

const FEATURES = [
    {
        key: "i18n",
        label: "Multilingual website (i18n)",
        script: "remove-i18n",
    },
    {
        key: "cms",
        label: "Decap CMS and blog functionality",
        script: "remove-decap",
    },
    {
        key: "demo",
        label: "Demo files",
        script: "remove-demo",
    },
    {
        key: "darkMode",
        label: "Dark mode",
        script: "remove-dark-mode",
    },
];

function runScript(scriptName) {
    return new Promise((resolve, reject) => {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`Running ${scriptName}...`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        const child = spawn(
            process.execPath,
            [join(root, "scripts", `${scriptName}.js`)],
            { stdio: "inherit" }
        );

        child.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(
                    new Error(`${scriptName} exited with code ${code}`)
                );
            }
        });
    });
}

async function main() {
    const currentFlags = readFeatureFlags();

    console.log("\nProject Feature Setup\n");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

    const actions = [];

    for (const feature of FEATURES) {
        if (!currentFlags[feature.key]) {
            console.log(`✓ ${feature.label} is already removed.`);
            continue;
        }

        const keep = await askYesNo(
            ask,
            `Keep ${feature.label}?`
        );

        actions.push({
            ...feature,
            remove: !keep,
        });
    }

    const i18nAction = actions.find((a) => a.key === "i18n");
    let configLocalesNow = false;
    if (i18nAction && !i18nAction.remove) {
        configLocalesNow = await askYesNo(
            ask,
            "\nWould you like to configure your locales now?"
        );
    }

    console.log("\nSummary\n");

    for (const action of actions) {
        console.log(
            `${action.remove ? "✗ Remove" : "✓ Keep"} ${action.label}`
        );
    }

    const proceed = await askYesNo(
        ask,
        "\nProceed with these changes?"
    );

    rl.close();

    if (!proceed) {
        console.log("\nCancelled.");
        process.exit(0);
    }

    for (const action of actions) {
        if (!action.remove) continue;

        try {
            await runScript(action.script);
        } catch (error) {
            console.error(`\n❌ ${error.message}`);
            process.exit(1);
        }
    }
    await disableFeatureFlag(root, "setup");

    if (configLocalesNow) {
        try {
            await runScript("config-i18n");
        } catch (error) {
            console.error(`\n❌ ${error.message}`);
            process.exit(1);
        }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Project setup complete.");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}


main().catch((error) => {
    console.error("\nFatal error:");
    console.error(error);
    process.exit(1);
});