#!/usr/bin/env node

/**
 * remove-demo.js
 *
 * Removes demo/placeholder content from the Advanced Astro i18n kit.
 * This script removes demo pages, section components, images, and resets
 * navData.json and both locale index pages to a minimal welcome state.
 *
 * Supports both English and French locale content.
 *
 * Run with: npm run remove-demo
 */

import { existsSync, rmSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import readline from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// ─── Guard: already run? ──────────────────────────────────────────────────────
const markerPath = join(root, ".demo-removed");
if (existsSync(markerPath)) {
	console.log("Demo content has already been removed (.demo-removed marker exists).");
	process.exit(0);
}

// ─── Confirmation prompt ──────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question(
	"\n⚠️  This will permanently remove all demo content from the project.\n" +
	"This includes demo pages, section components, and placeholder images.\n\n" +
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

function write(relPath, content) {
	const abs = join(root, relPath);
	mkdirSync(dirname(abs), { recursive: true });
	writeFileSync(abs, content, "utf8");
	console.log(`  updated  ${relPath}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function runRemoval() {
	console.log("\nRemoving demo content...\n");

	// ── Demo pages (both locales) ─────────────────────────────────────────────
	[
		"src/pages/about.astro",
		"src/pages/reviews.astro",
		"src/pages/projects",
		"src/pages/fr/a-propos.astro",
		"src/pages/fr/avis.astro",
		"src/pages/fr/projets",
	].forEach(remove);

	// ── Demo section components ───────────────────────────────────────────────
	[
		"src/components/Hero",
		"src/components/Services",
		"src/components/SideBySide",
		"src/components/Gallery",
		"src/components/Testimonials",
		"src/components/Reviews",
		"src/components/Banner",
		"src/components/CTA",
	].forEach(remove);

	// ── Demo images ───────────────────────────────────────────────────────────
	[
		"src/assets/images/hero.jpg",
		"src/assets/images/hero-m.jpg",
		"src/assets/images/landing.jpg",
		"src/assets/images/cabinets2.jpg",
		"src/assets/images/construction.jpg",
		"src/assets/images/portfolio",
		"src/assets/images/CTA",
	].forEach(remove);

	// ── Reset navData.json to home-only ───────────────────────────────────────
	write(
		"src/data/navData.json",
		JSON.stringify(
			[
				{ key: "home", url: "/", children: [] },
				{ key: "contact", url: "/contact", children: [] },
			],
			null,
			"\t"
		) + "\n"
	);

	// ── Reset EN index.astro ──────────────────────────────────────────────────
	write(
		"src/pages/index.astro",
		`---
import BaseLayout from "@layouts/BaseLayout.astro";
import { getLocaleFromUrl } from "@js/localeUtils";
import { useTranslations } from "@js/translationUtils";
import BrowserLanguageRedirect from "@components/LanguageSwitch/BrowserLanguageRedirect.astro";

const locale = getLocaleFromUrl(Astro.url);
const t = useTranslations(locale);
---

<BrowserLanguageRedirect />

<BaseLayout title="Welcome" description="Welcome to our website">
	<section style="padding: 8rem 1rem; text-align: center;">
		<h1>Welcome</h1>
		<p>Your new site is ready. Start building!</p>
		<a href="/contact" style="display:inline-block; margin-top:1rem; padding:0.75rem 1.5rem; background:var(--primary); color:#fff; text-decoration:none; border-radius:4px;">Contact Us</a>
	</section>
</BaseLayout>
`
	);

	// ── Reset FR index.astro ──────────────────────────────────────────────────
	write(
		"src/pages/fr/index.astro",
		`---
import BaseLayout from "@layouts/BaseLayout.astro";
import { getLocaleFromUrl } from "@js/localeUtils";
import { useTranslations } from "@js/translationUtils";

const locale = getLocaleFromUrl(Astro.url);
const t = useTranslations(locale);
---

<BaseLayout title="Bienvenue" description="Bienvenue sur notre site web">
	<section style="padding: 8rem 1rem; text-align: center;">
		<h1>Bienvenue</h1>
		<p>Votre nouveau site est prêt. Commencez à construire !</p>
		<a href="/fr/contact" style="display:inline-block; margin-top:1rem; padding:0.75rem 1.5rem; background:var(--primary); color:#fff; text-decoration:none; border-radius:4px;">Nous contacter</a>
	</section>
</BaseLayout>
`
	);

	// ── Create .demo-removed marker ───────────────────────────────────────────
	writeFileSync(markerPath, new Date().toISOString() + "\n", "utf8");

	console.log("\nDone! Demo content has been removed.");
	console.log("The .demo-removed marker file has been created to prevent re-running.");
	console.log("\nNext steps:");
	console.log("  1. Run `npm run dev` to verify the site still loads");
	console.log("  2. Update src/data/client.ts with your client's information");
	console.log("  3. Update src/locales/ with real translations");
	console.log("  4. Build your new pages and components\n");
}
