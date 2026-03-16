/**
 * Integration tests for scripts/remove-i18n.js
 *
 * Run: node --test scripts/tests/remove-i18n.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createFixture, cleanupFixture, runScript, fileExists, readFile } from "./utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(__dirname, "..", "remove-i18n.js");

// ─── Fixture content ──────────────────────────────────────────────────────────

const ASTRO_CONFIG = `import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
\tsite: "https://example.com",
\ti18n: {
\t\tdefaultLocale: "en",
\t\tlocales: ["en", "fr"],
\t\trouting: {
\t\t\tprefixDefaultLocale: false,
\t\t},
\t},
\tintegrations: [
\t\tsitemap({
\t\t\tfilter: (page) => !page.includes("/admin"),
\t\t\ti18n: {
\t\t\t\tdefaultLocale: "en",
\t\t\t\tlocales: {
\t\t\t\t\ten: "en-US",
\t\t\t\t\tfr: "fr-FR",
\t\t\t\t},
\t\t\t},
\t\t}),
\t],
});`;

const ASTRO_CONFIG_PREFIX_TRUE = `import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
\tsite: "https://example.com",
\ti18n: {
\t\tdefaultLocale: "en",
\t\tlocales: ["en", "fr"],
\t\trouting: {
\t\t\tprefixDefaultLocale: true,
\t\t},
\t},
\tintegrations: [sitemap()],
});`;

const BASELAYOUT = `---
import { getLocaleFromUrl } from "@js/localeUtils";
import { useTranslations } from "@js/translationUtils";

const locale = getLocaleFromUrl(Astro.url);
const t = useTranslations(locale);
---

<html lang={locale}>
  <body>
    <a class="skip">{t("skipLink")}</a>
    <slot />
  </body>
</html>
`;

// prettier-ignore
const META = `---
import { getLocaleFromUrl } from "@js/localeUtils";
import { getLocalizedPathname } from "@js/translationUtils";
import { locales, localeMap } from "@config/siteSettings";

const locale = getLocaleFromUrl(Astro.url);
const isLandingPage = Astro.url.pathname === "/" || Astro.url.pathname === \`/\${locale}/\`;

// Generate hreflang alternate links
const hrefLangLinks = await Promise.all(
\tlocales.map(async (l) => ({
\t\threflang: localeMap[l],
\t\thref: new URL(await getLocalizedPathname(l, Astro.url), Astro.site).href,
\t}))
);
---

<!-- Hreflang alternate links for SEO -->
{hrefLangLinks.map(({ hreflang, href }) => (
\t<link rel="alternate" hreflang={hreflang} href={href} />
))}
<link rel="alternate" hreflang="x-default" href={hrefLangLinks[0]?.href} />
`;

const TEMPLATE_PAGE = `---
import { getLocaleFromUrl } from "@js/localeUtils";
import { useTranslations } from "@js/translationUtils";

const locale = getLocaleFromUrl(Astro.url);
const t = useTranslations(locale);
---

<h1>{t("home")}</h1>
`;

const BASE_FIXTURE = {
	"astro.config.mjs": ASTRO_CONFIG,
	"src/layouts/BaseLayout.astro": BASELAYOUT,
	"src/components/Meta/Meta.astro": META,
	"src/pages/_template.astro": TEMPLATE_PAGE,
	"src/pages/fr/index.astro": "<html>fr index</html>",
	"src/locales/en/common.json": JSON.stringify({ home: "Home", skipLink: "Skip to content" }),
	"src/js/localeUtils.ts": `export function getLocaleFromUrl() { return "en"; }`,
	"src/js/translationUtils.ts": `export function useTranslations() { return (k) => k; }`,
	"src/config/siteSettings.ts": `export const locales = ["en", "fr"]; export const localeMap = {};`,
	"src/config/routeTranslations.ts": `export const routeTranslations = {};`,
	"src/components/LanguageSwitch/LanguageSwitch.astro": `<select>Language</select>`,
};

// Fixture for prefixDefaultLocale: true — pages live in locale subfolders
const BASE_FIXTURE_PREFIX_TRUE = {
	"astro.config.mjs": ASTRO_CONFIG_PREFIX_TRUE,
	"src/layouts/BaseLayout.astro": BASELAYOUT,
	"src/components/Meta/Meta.astro": META,
	"src/pages/en/index.astro": "<html>en index</html>",
	"src/pages/en/about.astro": "<html>en about</html>",
	"src/pages/fr/index.astro": "<html>fr index</html>",
	"src/locales/en/common.json": JSON.stringify({ home: "Home", skipLink: "Skip to content" }),
	"src/js/localeUtils.ts": `export function getLocaleFromUrl() { return "en"; }`,
	"src/js/translationUtils.ts": `export function useTranslations() { return (k) => k; }`,
	"src/config/siteSettings.ts": `export const locales = ["en", "fr"]; export const localeMap = {};`,
	"src/config/routeTranslations.ts": `export const routeTranslations = {};`,
	"src/components/LanguageSwitch/LanguageSwitch.astro": `<select>Language</select>`,
};

// ─── Phase B: file sweep ──────────────────────────────────────────────────────

test("Phase B: removes locale imports and consts from source files", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "\nyes\n", env: { SCRIPT_ROOT: fixture } });

	const tpl = await readFile(fixture, "src/pages/_template.astro");
	assert.ok(!tpl.includes("getLocaleFromUrl"), "getLocaleFromUrl import removed");
	assert.ok(!tpl.includes("useTranslations"), "useTranslations import removed");
	assert.ok(!tpl.includes("const locale"), "locale const removed");
	assert.ok(!tpl.includes("const t ="), "t const removed");
});

test("Phase B: replaces t() calls with translated values", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "\nyes\n", env: { SCRIPT_ROOT: fixture } });

	const tpl = await readFile(fixture, "src/pages/_template.astro");
	assert.ok(!tpl.includes('{t("home")}'), "t() call replaced");
	assert.ok(tpl.includes("Home"), "replaced with actual translation");
});

// ─── Phase C: specific file patches ──────────────────────────────────────────

test("Phase C: removes both i18n blocks from astro.config.mjs", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "\nyes\n", env: { SCRIPT_ROOT: fixture } });

	const config = await readFile(fixture, "astro.config.mjs");
	assert.ok(!config.includes("i18n:"), "i18n blocks removed");
	assert.ok(config.includes("filter:"), "sitemap filter preserved");
	assert.ok(config.includes("site:"), "site property preserved");
});

test("Phase C: sets html lang to the chosen locale in BaseLayout.astro", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "\nyes\n", env: { SCRIPT_ROOT: fixture } });

	const layout = await readFile(fixture, "src/layouts/BaseLayout.astro");
	assert.ok(layout.includes('<html lang="en">'), "static lang attribute set to en");
	assert.ok(!layout.includes("{locale}"), "dynamic locale reference removed");
});

test("Phase C: uses custom locale in BaseLayout.astro when specified", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "fr\nyes\n", env: { SCRIPT_ROOT: fixture } });

	const layout = await readFile(fixture, "src/layouts/BaseLayout.astro");
	assert.ok(layout.includes('<html lang="fr">'), "lang set to fr");
});

test("Phase C: simplifies isLandingPage in Meta.astro", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "\nyes\n", env: { SCRIPT_ROOT: fixture } });

	const meta = await readFile(fixture, "src/components/Meta/Meta.astro");
	assert.ok(meta.includes('Astro.url.pathname === "/"'), "simplified isLandingPage present");
	assert.ok(!meta.includes("locale"), "locale reference removed from Meta");
});

test("Phase C: removes hrefLang generation from Meta.astro", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "\nyes\n", env: { SCRIPT_ROOT: fixture } });

	const meta = await readFile(fixture, "src/components/Meta/Meta.astro");
	assert.ok(!meta.includes("hrefLangLinks"), "hrefLangLinks block removed");
	assert.ok(!meta.includes("x-default"), "x-default link removed");
	assert.ok(!meta.includes("getLocalizedPathname"), "getLocalizedPathname removed");
});

// ─── Phase D: file moves ──────────────────────────────────────────────────────

test("Phase D: moves locales/ to scripts/deleted/locales/", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "\nyes\n", env: { SCRIPT_ROOT: fixture } });

	assert.ok(!(await fileExists(fixture, "src/locales")), "src/locales removed");
	assert.ok(await fileExists(fixture, "scripts/deleted/locales/en/common.json"), "locales moved to deleted/");
});

test("Phase D: moves utility files to scripts/deleted/", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "\nyes\n", env: { SCRIPT_ROOT: fixture } });

	assert.ok(await fileExists(fixture, "scripts/deleted/localeUtils.ts"), "localeUtils.ts moved");
	assert.ok(await fileExists(fixture, "scripts/deleted/translationUtils.ts"), "translationUtils.ts moved");
	assert.ok(await fileExists(fixture, "scripts/deleted/siteSettings.ts"), "siteSettings.ts moved");
	assert.ok(await fileExists(fixture, "scripts/deleted/routeTranslations.ts"), "routeTranslations.ts moved");
});

test("Phase D: moves LanguageSwitch component to scripts/deleted/", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "\nyes\n", env: { SCRIPT_ROOT: fixture } });

	assert.ok(await fileExists(fixture, "scripts/deleted/LanguageSwitch/LanguageSwitch.astro"), "LanguageSwitch moved");
});

test("Phase D: moves non-default locale pages to scripts/deleted/pages-{locale}/", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "\nyes\n", env: { SCRIPT_ROOT: fixture } });

	assert.ok(!(await fileExists(fixture, "src/pages/fr")), "src/pages/fr removed");
	assert.ok(await fileExists(fixture, "scripts/deleted/pages-fr/index.astro"), "fr pages moved to deleted/");
});

test("Phase D: does NOT move the default locale's page folder", async (t) => {
	// When defaultLocale is "fr", src/pages/fr/ should stay
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "fr\nyes\n", env: { SCRIPT_ROOT: fixture } });

	assert.ok(await fileExists(fixture, "src/pages/fr/index.astro"), "fr pages kept (fr is default)");
});

test("Phase D (prefix=true): promotes default locale subfolder to root", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE_PREFIX_TRUE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "\nyes\n", env: { SCRIPT_ROOT: fixture } });

	assert.ok(await fileExists(fixture, "src/pages/index.astro"), "en/index.astro promoted to root");
	assert.ok(await fileExists(fixture, "src/pages/about.astro"), "en/about.astro promoted to root");
	assert.ok(!(await fileExists(fixture, "src/pages/en")), "src/pages/en/ removed after promotion");
	assert.ok(!(await fileExists(fixture, "src/pages/fr")), "src/pages/fr removed");
	assert.ok(await fileExists(fixture, "scripts/deleted/pages-fr/index.astro"), "fr pages in deleted/");
});

test("Phase D (prefix=true): promotes correct subfolder when custom default locale is given", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE_PREFIX_TRUE);
	t.after(() => cleanupFixture(fixture));

	// user says fr is the default locale
	await runScript(SCRIPT, [], { stdin: "fr\nyes\n", env: { SCRIPT_ROOT: fixture } });

	assert.ok(await fileExists(fixture, "src/pages/index.astro"), "fr/index.astro promoted to root");
	assert.ok(!(await fileExists(fixture, "src/pages/fr")), "src/pages/fr/ removed after promotion");
	assert.ok(!(await fileExists(fixture, "src/pages/en")), "src/pages/en removed");
	assert.ok(await fileExists(fixture, "scripts/deleted/pages-en/index.astro"), "en pages in deleted/");
});

// ─── Phase F: marker ─────────────────────────────────────────────────────────

test("creates .i18n-removed marker on successful run", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	await runScript(SCRIPT, [], { stdin: "\nyes\n", env: { SCRIPT_ROOT: fixture } });

	assert.ok(await fileExists(fixture, ".i18n-removed"), "marker file created");
});

// ─── Prompt: locale validation ────────────────────────────────────────────────

test("re-prompts on invalid locale input until a valid one is given", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	// "123" invalid → "abc-def" invalid → "en" valid → "yes" confirm
	const { code } = await runScript(SCRIPT, [], {
		stdin: "123\nabc-def\nen\nyes\n",
		env: { SCRIPT_ROOT: fixture },
	});

	assert.equal(code, 0, "script succeeds after valid locale entered");
	assert.ok(await fileExists(fixture, ".i18n-removed"), "ran to completion");
});

// ─── Abort path ───────────────────────────────────────────────────────────────

test("aborts without changes when confirmation is declined", async (t) => {
	const fixture = await createFixture(BASE_FIXTURE);
	t.after(() => cleanupFixture(fixture));

	const { code, stdout } = await runScript(SCRIPT, [], {
		stdin: "en\nno\n",
		env: { SCRIPT_ROOT: fixture },
	});

	assert.equal(code, 0);
	assert.ok(stdout.includes("Aborted"), "abort message printed");
	assert.ok(!(await fileExists(fixture, ".i18n-removed")), "no marker created");
	assert.ok(await fileExists(fixture, "src/locales/en/common.json"), "locales untouched");
});

// ─── Guard: already run ───────────────────────────────────────────────────────

test("exits early when .i18n-removed marker already exists", async (t) => {
	const fixture = await createFixture({
		...BASE_FIXTURE,
		".i18n-removed": new Date().toISOString(),
	});
	t.after(() => cleanupFixture(fixture));

	// Script exits before readline is created — no stdin needed
	const { code, stdout } = await runScript(SCRIPT, [], { env: { SCRIPT_ROOT: fixture } });

	assert.equal(code, 0);
	assert.ok(stdout.includes("already been removed"), "guard message printed");
	// Locales should still be in their original location
	assert.ok(await fileExists(fixture, "src/locales/en/common.json"), "files untouched");
});
