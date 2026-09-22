import { getRelativeLocaleUrl } from "astro:i18n";
import navData from "@data/navData.json";
import { defaultLocale } from "../features/i18n/i18nConfig";

type NavItem = {
	urls: Record<string, string>;
	children?: NavItem[];
};

function normalizePath(path: string) {
	const safePath = String(path || "");

	let result = safePath;
	if (!result.startsWith("/")) result = `/${result}`;

	if (!result.endsWith("/")) result = `${result}/`;

	return result;
}

// Default-locale URL -> per-locale URLs, built once from navData.json
const urlsByDefaultUrl = new Map<string, Record<string, string>>();

function indexNavItems(items: NavItem[]) {
	for (const item of items) {
		const defaultUrl = item.urls[defaultLocale];
		if (defaultUrl) urlsByDefaultUrl.set(normalizePath(defaultUrl), item.urls);
		if (item.children?.length) indexNavItems(item.children);
	}
}

indexNavItems(navData as NavItem[]);

/**
 * Localized URL for a path. If `path` is a default-locale URL listed in
 * navData.json (e.g. "/about"), it is translated (e.g. "/fr/a-propos/").
 * Any other path (dynamic or already localized) only gets the locale prefix.
 */
export function getLocalizedRoute(locale: string | undefined, path: string) {
	const currentLocale = locale || defaultLocale;
	const cleanPath = normalizePath(path);
	const localizedPath = urlsByDefaultUrl.get(cleanPath)?.[currentLocale] ?? cleanPath;

	return normalizePath(getRelativeLocaleUrl(currentLocale, normalizePath(localizedPath)));
}
