/**
 * Integration tests for scripts/remove-demo.js
 *
 * Run: node --test scripts/tests/remove-demo.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createFixture, cleanupFixture, runScript, fileExists, readFile } from "./utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(__dirname, "..", "remove-demo.js");

// Templates matching the exact format that remove-demo.js regex patterns expect
const EN_TEMPLATE = `---
import BaseLayout from "@layouts/BaseLayout.astro";
import Banner from "@components/Banner/Banner.astro";
import CTA from "@components/CTA/CTA.astro";
import landingImage from "@assets/images/landing.jpg";
---
<BaseLayout title="Page Title" description="Meta description">
\t<!-- ============================================ -->
\t<!--                    LANDING                   -->
\t<!-- ============================================ -->

\t<Banner title="Page Title" image={landingImage} />

\t<!-- ============================================ -->
\t<!--            Add Your Sections Here            -->
\t<!-- ============================================ -->

\t<CTA />
</BaseLayout>
`;

const FR_TEMPLATE = `---
import BaseLayout from "@layouts/BaseLayout.astro";
import Banner from "@components/Banner/Banner.astro";
import CTA from "@components/CTA/CTA.astro";
import landingImage from "@assets/images/landing.jpg";
---
<BaseLayout title="Titre de la page" description="Méta description">
\t<!-- ============================================ -->
\t<!--                    LANDING                   -->
\t<!-- ============================================ -->

\t<Banner title="Titre de la page" image={landingImage} />

\t<!-- ============================================ -->
\t<!--         Ajoutez vos sections ici             -->
\t<!-- ============================================ -->

\t<CTA />
</BaseLayout>
`;

const BASE_FIXTURE = {
	"src/pages/_template.astro": EN_TEMPLATE,
	"src/pages/fr/_template.astro": FR_TEMPLATE,
	"src/pages/about.astro": "about page content",
	"src/pages/reviews.astro": "reviews page content",
	"src/pages/index.astro": "old index",
	"src/pages/fr/index.astro": "old fr index",
	"src/data/navData.json": JSON.stringify([{ key: "home", url: "/" }, { key: "about", url: "/about" }], null, "\t") + "\n",
	"src/components/Banner/Banner.astro": "banner component",
	"src/components/CTA/CTA.astro": "cta component",
	"src/assets/images/landing.jpg": "fake image",
};

// ─── Confirmed run ────────────────────────────────────────────────────────────

test("removes demo pages when confirmed", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	const { code } = await runScript(SCRIPT, [], { stdin: "yes\n", env: { SCRIPT_ROOT: fixture } });

	assert.equal(code, 0);
	assert.ok(!(await fileExists(fixture, "src/pages/about.astro")), "about.astro removed");
	assert.ok(!(await fileExists(fixture, "src/pages/reviews.astro")), "reviews.astro removed");
});

test("removes demo components when confirmed", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "yes\n", env: { SCRIPT_ROOT: fixture } });

	assert.ok(!(await fileExists(fixture, "src/components/Banner/Banner.astro")), "Banner removed");
	assert.ok(!(await fileExists(fixture, "src/components/CTA/CTA.astro")), "CTA removed");
});

test("strips Banner/CTA imports from EN template when confirmed", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "yes\n", env: { SCRIPT_ROOT: fixture } });

	const tpl = await readFile(fixture, "src/pages/_template.astro");
	assert.ok(!tpl.includes('import Banner'), "Banner import removed from EN template");
	assert.ok(!tpl.includes('import CTA'), "CTA import removed from EN template");
	assert.ok(!tpl.includes('import landingImage'), "landingImage import removed from EN template");
	assert.ok(!tpl.includes('<Banner'), "Banner usage removed from EN template");
	assert.ok(!tpl.includes('<CTA'), "CTA usage removed from EN template");
});

test("strips Banner/CTA imports from FR template when confirmed", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "yes\n", env: { SCRIPT_ROOT: fixture } });

	const tpl = await readFile(fixture, "src/pages/fr/_template.astro");
	assert.ok(!tpl.includes('import Banner'), "Banner import removed from FR template");
	assert.ok(!tpl.includes('import CTA'), "CTA import removed from FR template");
	assert.ok(!tpl.includes('<CTA'), "CTA usage removed from FR template");
});

test("resets navData.json when confirmed", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "yes\n", env: { SCRIPT_ROOT: fixture } });

	const nav = JSON.parse(await readFile(fixture, "src/data/navData.json"));
	assert.equal(nav.length, 2, "navData has exactly 2 entries after reset");
	assert.ok(nav.some((e) => e.key === "home"), "home entry present");
	assert.ok(nav.some((e) => e.key === "contact"), "contact entry present");
});

test("overwrites index.astro files when confirmed", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "yes\n", env: { SCRIPT_ROOT: fixture } });

	const en = await readFile(fixture, "src/pages/index.astro");
	const fr = await readFile(fixture, "src/pages/fr/index.astro");
	assert.ok(en.includes("Welcome"), "EN index has welcome content");
	assert.ok(fr.includes("Bienvenue"), "FR index has bienvenue content");
});

test("creates .demo-removed marker when confirmed", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "yes\n", env: { SCRIPT_ROOT: fixture } });

	assert.ok(await fileExists(fixture, ".demo-removed"), "marker file created");
});

// ─── Abort path ───────────────────────────────────────────────────────────────

test("aborts without changes when user types anything other than 'yes'", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	const { code } = await runScript(SCRIPT, [], { stdin: "no\n", env: { SCRIPT_ROOT: fixture } });

	assert.equal(code, 0);
	assert.ok(await fileExists(fixture, "src/pages/about.astro"), "about.astro not removed");
	assert.ok(!(await fileExists(fixture, ".demo-removed")), "no marker created");
});

// ─── Guard: already run ───────────────────────────────────────────────────────

test("exits early when .demo-removed marker already exists", async (t) => {
	const fixture = await createFixture({
		...BASE_FIXTURE,
		".demo-removed": new Date().toISOString(),
	});
	t.after(() => cleanupFixture(fixture));

	// No stdin needed — script exits before reaching any prompt
	const { code, stdout } = await runScript(SCRIPT, [], { env: { SCRIPT_ROOT: fixture } });

	assert.equal(code, 0);
	assert.ok(stdout.includes("already been removed"), "guard message printed");
	// Original demo files should still exist (script did nothing)
	assert.ok(await fileExists(fixture, "src/pages/about.astro"), "about.astro untouched");
});
