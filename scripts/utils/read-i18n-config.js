import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * Reads current i18n config from src/config/siteSettings.ts.
 * Returns { defaultLocale, locales } or null if the file can't be parsed.
 */
export function readI18nConfig(root) {
	const settingsPath = join(root, "src", "config", "siteSettings.ts");
	if (!existsSync(settingsPath)) return null;

	const content = readFileSync(settingsPath, "utf8");

	const defaultLocaleMatch = content.match(/defaultLocale[^=]*=\s*["']([^"']+)["']/);
	const localesMatch = content.match(/locales\s*=\s*\[([^\]]+)\]/);

	if (!defaultLocaleMatch || !localesMatch) return null;

	return {
		defaultLocale: defaultLocaleMatch[1],
		locales: localesMatch[1]
			.split(",")
			.map((l) => l.trim().replace(/["']/g, ""))
			.filter(Boolean),
	};
}
