import type { Locale } from "@config/siteSettings";
import { locales, defaultLocale } from "@config/siteSettings";
import {
	routeTranslations,
	localizedCollections,
} from "@config/routeTranslations";
import { getCollection } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";
import { getPostSlug } from "@js/localeUtils";

// Cache for loaded translation files
const translationCache: Record<string, Record<string, unknown>> = {};

/** Load a translation namespace JSON file for a given locale. */
function loadNamespace(
	locale: Locale,
	namespace: string,
): Record<string, unknown> {
	const cacheKey = `${locale}/${namespace}`;
	if (translationCache[cacheKey]) {
		return translationCache[cacheKey];
	}

	// Use Vite's glob import to load all translation files eagerly
	const modules = import.meta.glob<{ default: Record<string, unknown> }>(
		"/src/locales/**/*.json",
		{ eager: true },
	);

	const filePath = `/src/locales/${locale}/${namespace}.json`;
	const mod = modules[filePath];
	if (!mod) {
		console.warn(`Translation file not found: ${filePath}`);
		return {};
	}

	translationCache[cacheKey] = mod.default;
	return mod.default;
}

/** Traverse a nested object by dot-separated key path. */
function getNestedValue(
	obj: Record<string, unknown>,
	keyPath: string,
): unknown {
	const keys = keyPath.split(".");
	let current: unknown = obj;

	for (const key of keys) {
		if (current == null || typeof current !== "object") {
			return keyPath;
		}
		current = (current as Record<string, unknown>)[key];
	}

	return current ?? keyPath;
}

/**
 * Returns a translation function `t(key)` for the given locale.
 * Keys can be namespaced: "home:hero.title" loads src/locales/{locale}/home.json
 * and traverses hero.title. Keys without a namespace use "common" by default.
 */
export function useTranslations(locale: Locale) {
	return function t<T = string>(key: string): T {
		let namespace = "common";
		let keyPath = key;

		const colonIndex = key.indexOf(":");
		if (colonIndex !== -1) {
			namespace = key.slice(0, colonIndex);
			keyPath = key.slice(colonIndex + 1);
		}

		const translations = loadNamespace(locale, namespace);
		return getNestedValue(translations, keyPath) as T;
	};
}

/**
 * Generate a locale-aware URL for a base route.
 * Translates route segments using routeTranslations config.
 * For the default locale, no prefix is added.
 */
export function getLocalizedRoute(locale: Locale, baseRoute: string): string {
	// Normalize: remove leading/trailing slashes, split into segments
	const trimmed = baseRoute.replace(/^\/|\/$/g, "");

	if (trimmed === "") {
		// Home page
		return locale === defaultLocale ? "/" : `/${locale}/`;
	}

	const segments = trimmed.split("/");
	const localeRoutes = routeTranslations[locale] || {};

	// Translate each segment if a translation exists
	const translatedSegments = segments.map((seg) => {
		return localeRoutes[seg] || seg;
	});

	const path = translatedSegments.join("/");

	if (locale === defaultLocale) {
		return `/${path}/`;
	}
	return `/${locale}/${path}/`;
}

// ── Dynamic route translations (blog slug mapping) ──────────────────

type RouteMap = Record<Locale, Record<string, string>>;

let dynamicRouteCache: RouteMap | null = null;

/**
 * Scans content collections that have `mappingKey` frontmatter,
 * groups entries by mappingKey, and builds a full route translation map
 * that merges static routes with dynamic collection-based routes.
 *
 * For example, a blog entry `en/fourth-post-in-english` with mappingKey "post-4"
 * paired with `fr/quatrieme-article-en-francais` produces:
 *   en: { "blog/fourth-post-in-english": "blog/fourth-post-in-english" }
 *   fr: { "blog/fourth-post-in-english": "blog/quatrieme-article-en-francais" }
 */
async function generateDynamicRouteTranslations(): Promise<RouteMap> {
	if (dynamicRouteCache) return dynamicRouteCache;

	// Start with static route translations
	const merged: RouteMap = {} as RouteMap;
	for (const locale of locales) {
		merged[locale] = { ...routeTranslations[locale] };
	}

	// Process each localized collection
	for (const [collectionName, collectionLocales] of Object.entries(
		localizedCollections,
	)) {
		const allEntries = await getCollection(collectionName as "blog");

		// Group entries by mappingKey
		const groups: Record<string, Record<Locale, string>> = {};

		for (const entry of allEntries) {
			const mappingKey = (entry.data as { mappingKey?: string })
				.mappingKey;
			if (!mappingKey) continue;

			const idParts = entry.id.split("/");
			const entryLocale = idParts[0] as Locale;
			if (!locales.includes(entryLocale)) continue;

			const slug = getPostSlug(
				entry as { data: { permalink?: string; title: string } },
			);

			if (!groups[mappingKey]) {
				groups[mappingKey] = {} as Record<Locale, string>;
			}
			groups[mappingKey][entryLocale] = slug;
		}

		// For each group, create route translations using the default locale slug as the key
		for (const slugsByLocale of Object.values(groups)) {
			const defaultSlug = slugsByLocale[defaultLocale];
			if (!defaultSlug) continue;

			for (const locale of locales) {
				const localizedSlug = slugsByLocale[locale];
				if (!localizedSlug) continue;

				const collectionPath = collectionLocales[locale];
				const routeKey = `${collectionLocales[defaultLocale]}/${defaultSlug}`;
				merged[locale][routeKey] = `${collectionPath}/${localizedSlug}`;
			}
		}
	}

	dynamicRouteCache = merged;
	return merged;
}

/**
 * Switch a URL to another locale. Used by the language switcher and hreflang tags.
 * Takes the current URL and a target locale, returns the equivalent path in the target locale.
 * Now async because it needs to look up blog slug translations from content collections.
 */
export async function getLocalizedPathname(
	locale: Locale,
	url: URL,
): Promise<string> {
	const allRoutes = await generateDynamicRouteTranslations();
	const pathname = url.pathname;

	// Strip existing locale prefix and determine current locale
	const segments = pathname.split("/").filter(Boolean);
	let currentLocale: Locale = defaultLocale;
	let neutralSegments: string[];

	if (locales.includes(segments[0] as Locale)) {
		currentLocale = segments[0] as Locale;
		neutralSegments = segments.slice(1);
	} else {
		neutralSegments = [...segments];
	}

	// Build reverse map: current locale's translated value → neutral key
	const currentRoutes = allRoutes[currentLocale] || {};
	const reverseMap: Record<string, string> = {};
	for (const [key, val] of Object.entries(currentRoutes)) {
		reverseMap[val] = key;
	}

	const targetRoutes = allRoutes[locale] || {};

	// Try full-path lookup first (handles multi-segment keys like blog slugs:
	// "blog/deuxieme-article-en-francais" → "blog/second-post-in-english")
	const fullPath = neutralSegments.join("/");
	if (reverseMap[fullPath] !== undefined) {
		const neutralizedPath = reverseMap[fullPath];
		const translatedPath = targetRoutes[neutralizedPath] ?? neutralizedPath;
		return getRelativeLocaleUrl(locale, translatedPath);
	}

	// Fall back to per-segment lookup (handles single-segment static routes like "a-propos" → "about")
	const neutralizedSegments = neutralSegments.map(
		(seg) => reverseMap[seg] ?? seg,
	);
	const translatedSegments = neutralizedSegments.map(
		(seg) => targetRoutes[seg] ?? seg,
	);

	// Use Astro's getRelativeLocaleUrl for proper locale prefixing
	return getRelativeLocaleUrl(locale, translatedSegments.join("/"));
}
