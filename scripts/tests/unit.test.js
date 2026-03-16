/**
 * Unit tests for pure transformation helpers (scripts/utils/transforms.js).
 * No file system, no prompts — fast and deterministic.
 *
 * Run: node --test scripts/tests/unit.test.js
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify, titleCase, humanizeKey, flattenIntoMap, lookupTranslation, removeObjectKey } from "../utils/transforms.js";

// ─── slugify ──────────────────────────────────────────────────────────────────

test("slugify: spaces become hyphens", () => {
	assert.equal(slugify("My Services"), "my-services");
});

test("slugify: strips special characters", () => {
	assert.equal(slugify("About Us!"), "about-us");
	assert.equal(slugify("FAQ & Help"), "faq-help");
});

test("slugify: collapses multiple hyphens", () => {
	assert.equal(slugify("contact--us"), "contact-us");
	assert.equal(slugify("contact  us"), "contact-us");
});

test("slugify: trims leading/trailing hyphens", () => {
	assert.equal(slugify("  services  "), "services");
});

test("slugify: already-slugified string is unchanged", () => {
	assert.equal(slugify("our-team"), "our-team");
});

test("slugify: lowercases input", () => {
	assert.equal(slugify("ABOUT"), "about");
});

test("slugify: empty string returns empty string", () => {
	assert.equal(slugify(""), "");
});

// ─── titleCase ────────────────────────────────────────────────────────────────

test("titleCase: capitalises first letter of each word", () => {
	assert.equal(titleCase("our team"), "Our Team");
});

test("titleCase: handles single word", () => {
	assert.equal(titleCase("services"), "Services");
});

test("titleCase: normalises all-uppercase input", () => {
	assert.equal(titleCase("ABOUT US"), "About Us");
});

test("titleCase: normalises mixed-case input", () => {
	assert.equal(titleCase("aBoUt Us"), "About Us");
});

// ─── humanizeKey ──────────────────────────────────────────────────────────────

test("humanizeKey: plain camelCase key gets sentence-cased", () => {
	assert.equal(humanizeKey("skipLink"), "SkipLink");
});

test("humanizeKey: hyphenated key becomes space-separated", () => {
	assert.equal(humanizeKey("skip-link"), "Skip link");
});

test("humanizeKey: underscore key becomes space-separated", () => {
	assert.equal(humanizeKey("page_title"), "Page title");
});

test("humanizeKey: strips namespace prefix", () => {
	assert.equal(humanizeKey("home:hero.title"), "Title");
	assert.equal(humanizeKey("common:footer.credit"), "Credit");
});

test("humanizeKey: plain single-segment key", () => {
	assert.equal(humanizeKey("home"), "Home");
});

// ─── flattenIntoMap ───────────────────────────────────────────────────────────

test("flattenIntoMap: creates both namespaced and plain keys", () => {
	const map = {};
	flattenIntoMap({ home: "Home", contact: "Contact" }, "common", "", map);
	assert.equal(map["common:home"], "Home");
	assert.equal(map["home"], "Home");
	assert.equal(map["common:contact"], "Contact");
	assert.equal(map["contact"], "Contact");
});

test("flattenIntoMap: nested objects use dot notation", () => {
	const map = {};
	flattenIntoMap({ footer: { credit: "Designed by" } }, "common", "", map);
	assert.equal(map["common:footer.credit"], "Designed by");
	assert.equal(map["footer.credit"], "Designed by");
});

test("flattenIntoMap: first namespace wins for plain key collisions", () => {
	const map = {};
	flattenIntoMap({ title: "Home Title" }, "home", "", map);
	flattenIntoMap({ title: "Blog Title" }, "blog", "", map);
	assert.equal(map["title"], "Home Title"); // first write wins
	assert.equal(map["home:title"], "Home Title");
	assert.equal(map["blog:title"], "Blog Title");
});

test("flattenIntoMap: deeply nested object", () => {
	const map = {};
	flattenIntoMap({ a: { b: { c: "deep" } } }, "ns", "", map);
	assert.equal(map["ns:a.b.c"], "deep");
	assert.equal(map["a.b.c"], "deep");
});

test("flattenIntoMap: ignores non-string, non-object values (null)", () => {
	const map = {};
	flattenIntoMap({ key: null }, "ns", "", map);
	assert.equal(Object.keys(map).length, 0);
});

// ─── lookupTranslation ────────────────────────────────────────────────────────

test("lookupTranslation: exact namespaced key match", () => {
	const map = { "common:skipLink": "Skip to main content" };
	assert.equal(lookupTranslation("common:skipLink", map), "Skip to main content");
});

test("lookupTranslation: exact plain key match", () => {
	const map = { skipLink: "Skip to main content" };
	assert.equal(lookupTranslation("skipLink", map), "Skip to main content");
});

test("lookupTranslation: strips namespace to find plain key", () => {
	const map = { skipLink: "Skip to main content" };
	assert.equal(lookupTranslation("common:skipLink", map), "Skip to main content");
});

test("lookupTranslation: falls back to humanized key when not in map", () => {
	assert.equal(lookupTranslation("home:hero.title", {}), "Title");
	assert.equal(lookupTranslation("skip-link", {}), "Skip link");
});

test("lookupTranslation: prefers exact over namespace-stripped match", () => {
	const map = { "common:home": "Exact", home: "Plain" };
	assert.equal(lookupTranslation("common:home", map), "Exact");
});

// ─── removeObjectKey ─────────────────────────────────────────────────────────

test("removeObjectKey: removes a simple top-level block", () => {
	const input = `export default defineConfig({
\tsite: "https://example.com",
\ti18n: {
\t\tdefaultLocale: "en",
\t\tlocales: ["en", "fr"],
\t},
\ttrailingSlash: "always",
});`;
	const result = removeObjectKey(input, "i18n");
	assert.ok(!result.includes("i18n"), "i18n block should be removed");
	assert.ok(result.includes('site: "https://example.com"'), "preceding key preserved");
	assert.ok(result.includes('trailingSlash: "always"'), "following key preserved");
});

test("removeObjectKey: removes a nested block inside a function call", () => {
	const input = `sitemap({
\tfilter: (page) => !page.includes("/admin"),
\ti18n: {
\t\tdefaultLocale: "en",
\t\tlocales: {
\t\t\ten: "en-US",
\t\t\tfr: "fr-FR",
\t\t},
\t},
})`;
	const result = removeObjectKey(input, "i18n");
	assert.ok(!result.includes("i18n"), "i18n block removed");
	assert.ok(!result.includes("en-US"), "nested content removed");
	assert.ok(result.includes("filter:"), "other key preserved");
});

test("removeObjectKey: handles doubly-nested braces (routing inside i18n)", () => {
	const input = `config({
\ti18n: {
\t\tdefaultLocale: "en",
\t\trouting: {
\t\t\tprefixDefaultLocale: false,
\t\t},
\t},
\tother: true,
})`;
	const result = removeObjectKey(input, "i18n");
	assert.ok(!result.includes("i18n"), "i18n removed");
	assert.ok(!result.includes("routing"), "nested routing removed too");
	assert.ok(result.includes("other: true"), "sibling key preserved");
});

test("removeObjectKey: is a no-op when the key is not present", () => {
	const input = `defineConfig({ site: "https://example.com" })`;
	assert.equal(removeObjectKey(input, "i18n"), input);
});

test("removeObjectKey: called twice removes two sequential occurrences", () => {
	const input = `config({
\ti18n: {
\t\tdefaultLocale: "en",
\t},
\tintegrations: [
\t\tsitemap({
\t\t\ti18n: {
\t\t\t\tdefaultLocale: "en",
\t\t\t},
\t\t}),
\t],
})`;
	let result = removeObjectKey(input, "i18n");
	result = removeObjectKey(result, "i18n");
	assert.ok(!result.includes("i18n"), "both i18n blocks removed");
	assert.ok(result.includes("integrations"), "integrations block preserved");
});
