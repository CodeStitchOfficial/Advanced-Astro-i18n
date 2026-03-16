/**
 * Integration tests for scripts/create-page.js
 *
 * Run: node --test scripts/tests/create-page.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
	createFixture,
	cleanupFixture,
	runScript,
	fileExists,
	readFile,
} from "./utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(__dirname, "..", "create-page.js");

const CLIENT_TS = `
export const SITE = { title: "Test Corp" };
export const BUSINESS = { name: "Test Corp" };
`;

const EN_TEMPLATE = `---
import BaseLayout from "@layouts/BaseLayout.astro";
---
<BaseLayout title="Page Title" description="Meta description for the page">
  <h1>Page Title</h1>
</BaseLayout>
`;

const FR_TEMPLATE = `---
import BaseLayout from "@layouts/BaseLayout.astro";
import { SITE } from "@data/client";
const description = \`Titre de la page - \${SITE.title}\`;
---
<BaseLayout title="Titre de la page" description={description}>
  <h1>Titre de la page</h1>
</BaseLayout>
`;

// ─── Happy path ───────────────────────────────────────────────────────────────

test("creates EN and FR pages from templates", async (t) => {
	const fixture = await createFixture({
		"src/pages/_template.astro": EN_TEMPLATE,
		"src/pages/fr/_template.astro": FR_TEMPLATE,
	});
	t.after(() => cleanupFixture(fixture));

	const { code } = await runScript(SCRIPT, ["Services"], {
		env: { SCRIPT_ROOT: fixture },
	});

	assert.equal(code, 0);
	assert.ok(
		await fileExists(fixture, "src/pages/services.astro"),
		"EN page created",
	);
	assert.ok(
		await fileExists(fixture, "src/pages/fr/services.astro"),
		"FR page created",
	);
});

test("substitutes the title in EN content (Page Title → actual title)", async (t) => {
	const fixture = await createFixture({
		"src/pages/_template.astro": EN_TEMPLATE,
	});
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, ["Our Team"], { env: { SCRIPT_ROOT: fixture } });

	const content = await readFile(fixture, "src/pages/our-team.astro");
	assert.ok(content.includes("Our Team"), "title substituted");
	assert.ok(!content.includes("Page Title"), "placeholder removed");
});

test("substitutes the title in FR content (Titre de la page → actual title)", async (t) => {
	const fixture = await createFixture({
		"src/pages/_template.astro": EN_TEMPLATE,
		"src/pages/fr/_template.astro": FR_TEMPLATE,
	});
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, ["Services"], { env: { SCRIPT_ROOT: fixture } });

	const content = await readFile(fixture, "src/pages/fr/services.astro");
	assert.ok(content.includes("Services"), "FR title substituted");
	assert.ok(!content.includes("Titre de la page"), "FR placeholder removed");
});

test("slugifies page name correctly", async (t) => {
	const fixture = await createFixture({
		"src/pages/_template.astro": EN_TEMPLATE,
	});
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, ["Our Team"], { env: { SCRIPT_ROOT: fixture } });

	assert.ok(
		await fileExists(fixture, "src/pages/our-team.astro"),
		"spaces become hyphens",
	);
});

test("title-cases the page name in file content", async (t) => {
	const fixture = await createFixture({
		"src/pages/_template.astro": EN_TEMPLATE,
	});
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, ["our team"], { env: { SCRIPT_ROOT: fixture } });

	const content = await readFile(fixture, "src/pages/our-team.astro");
	assert.ok(content.includes("Our Team"), "title-cased in content");
});

test("creates multiple pages from a comma-separated list", async (t) => {
	const fixture = await createFixture({
		"src/pages/_template.astro": EN_TEMPLATE,
	});
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, ["Services, About, Contact"], {
		env: { SCRIPT_ROOT: fixture },
	});

	assert.ok(await fileExists(fixture, "src/pages/services.astro"));
	assert.ok(await fileExists(fixture, "src/pages/about.astro"));
	assert.ok(await fileExists(fixture, "src/pages/contact.astro"));
});

// ─── Skip / guard behaviour ───────────────────────────────────────────────────

test("skips EN page if it already exists", async (t) => {
	const fixture = await createFixture({
		"src/pages/_template.astro": EN_TEMPLATE,
		"src/pages/services.astro": "EXISTING",
	});
	t.after(() => cleanupFixture(fixture));

	const { stdout } = await runScript(SCRIPT, ["Services"], {
		env: { SCRIPT_ROOT: fixture },
	});

	const content = await readFile(fixture, "src/pages/services.astro");
	assert.equal(content, "EXISTING", "existing file not overwritten");
	assert.ok(stdout.includes("Skipped"), "skip message printed");
});

test("skips FR page if it already exists", async (t) => {
	const fixture = await createFixture({
		"src/pages/_template.astro": EN_TEMPLATE,
		"src/pages/fr/_template.astro": FR_TEMPLATE,
		"src/pages/fr/services.astro": "EXISTING_FR",
	});
	t.after(() => cleanupFixture(fixture));

	const { stdout } = await runScript(SCRIPT, ["Services"], {
		env: { SCRIPT_ROOT: fixture },
	});

	const content = await readFile(fixture, "src/pages/fr/services.astro");
	assert.equal(content, "EXISTING_FR", "existing FR file not overwritten");
	assert.ok(stdout.includes("Skipped"), "skip message printed");
});

test("skips FR entirely when fr/_template.astro is absent", async (t) => {
	const fixture = await createFixture({
		"src/pages/_template.astro": EN_TEMPLATE,
	});
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, ["Services"], { env: { SCRIPT_ROOT: fixture } });

	assert.ok(
		await fileExists(fixture, "src/pages/services.astro"),
		"EN page still created",
	);
	assert.ok(
		!(await fileExists(fixture, "src/pages/fr/services.astro")),
		"no FR page",
	);
});

// ─── Client data ──────────────────────────────────────────────────────────────

test("FR template literal uses FR name after substitution", async (t) => {
	const fixture = await createFixture({
		"src/pages/_template.astro": EN_TEMPLATE,
		"src/pages/fr/_template.astro": FR_TEMPLATE,
	});
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, ["Our Team"], { env: { SCRIPT_ROOT: fixture } });

	const content = await readFile(fixture, "src/pages/fr/our-team.astro");
	assert.ok(
		content.includes("Our Team - ${SITE.title}"),
		"FR description literal updated",
	);
	assert.ok(
		!content.includes("Titre de la page"),
		"FR placeholder fully removed",
	);
});

test("logs client name when client.ts is present", async (t) => {
	const fixture = await createFixture({
		"src/pages/_template.astro": EN_TEMPLATE,
		"src/data/client.ts": CLIENT_TS,
	});
	t.after(() => cleanupFixture(fixture));

	const { stdout } = await runScript(SCRIPT, ["Services"], {
		env: { SCRIPT_ROOT: fixture },
	});

	assert.ok(stdout.includes("Test Corp"), "business name logged");
});

test("does not log client name when client.ts is absent", async (t) => {
	const fixture = await createFixture({
		"src/pages/_template.astro": EN_TEMPLATE,
	});
	t.after(() => cleanupFixture(fixture));

	const { stdout } = await runScript(SCRIPT, ["Services"], {
		env: { SCRIPT_ROOT: fixture },
	});

	assert.ok(!stdout.includes("Client:"), "no client line when file absent");
});

// ─── FR slug override ─────────────────────────────────────────────────────────

test("creates FR pages using FR slugs when second arg provided", async (t) => {
	const fixture = await createFixture({
		"src/pages/_template.astro": EN_TEMPLATE,
		"src/pages/fr/_template.astro": FR_TEMPLATE,
	});
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, ["test one, test two", "test un, test deux"], {
		env: { SCRIPT_ROOT: fixture },
	});

	assert.ok(await fileExists(fixture, "src/pages/fr/test-un.astro"), "FR page 1 uses FR slug");
	assert.ok(await fileExists(fixture, "src/pages/fr/test-deux.astro"), "FR page 2 uses FR slug");
	assert.ok(!(await fileExists(fixture, "src/pages/fr/test-one.astro")), "EN slug not used for FR page 1");
	assert.ok(!(await fileExists(fixture, "src/pages/fr/test-two.astro")), "EN slug not used for FR page 2");
});

test("EN pages use EN names when FR slugs are provided", async (t) => {
	const fixture = await createFixture({
		"src/pages/_template.astro": EN_TEMPLATE,
		"src/pages/fr/_template.astro": FR_TEMPLATE,
	});
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, ["test one, test two", "test un, test deux"], {
		env: { SCRIPT_ROOT: fixture },
	});

	assert.ok(await fileExists(fixture, "src/pages/test-one.astro"), "EN page 1 uses EN slug");
	assert.ok(await fileExists(fixture, "src/pages/test-two.astro"), "EN page 2 uses EN slug");

	const one = await readFile(fixture, "src/pages/test-one.astro");
	const two = await readFile(fixture, "src/pages/test-two.astro");
	assert.ok(one.includes("Test One"), "EN page 1 title correct");
	assert.ok(two.includes("Test Two"), "EN page 2 title correct");
});

test("FR page title uses FR name, not EN name", async (t) => {
	const fixture = await createFixture({
		"src/pages/_template.astro": EN_TEMPLATE,
		"src/pages/fr/_template.astro": FR_TEMPLATE,
	});
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, ["test one, test two", "test un, test deux"], {
		env: { SCRIPT_ROOT: fixture },
	});

	const un = await readFile(fixture, "src/pages/fr/test-un.astro");
	const deux = await readFile(fixture, "src/pages/fr/test-deux.astro");

	assert.ok(un.includes("Test Un"), "FR page 1 title is FR name");
	assert.ok(!un.includes("Test One"), "FR page 1 does not contain EN name");
	assert.ok(!un.includes("Titre de la page"), "FR placeholder removed");

	assert.ok(deux.includes("Test Deux"), "FR page 2 title is FR name");
	assert.ok(!deux.includes("Test Two"), "FR page 2 does not contain EN name");
	assert.ok(!deux.includes("Titre de la page"), "FR placeholder removed");
});

// ─── Error cases ──────────────────────────────────────────────────────────────

test("exits with code 1 when no page name is provided", async (t) => {
	const fixture = await createFixture({
		"src/pages/_template.astro": EN_TEMPLATE,
	});
	t.after(() => cleanupFixture(fixture));

	const { code } = await runScript(SCRIPT, [], {
		env: { SCRIPT_ROOT: fixture },
	});

	assert.equal(code, 1);
});

test("exits with code 1 when EN template is missing", async (t) => {
	const fixture = await createFixture({});
	t.after(() => cleanupFixture(fixture));

	const { code } = await runScript(SCRIPT, ["Services"], {
		env: { SCRIPT_ROOT: fixture },
	});

	assert.equal(code, 1);
});
