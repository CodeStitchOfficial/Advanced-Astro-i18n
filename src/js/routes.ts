import { getRelativeLocaleUrl } from "astro:i18n";
import { defaultLocale } from "../features/i18n/i18nConfig";

function normalizePath(path: string) {
  const safePath = String(path || "");

  let result = safePath;
  if (!result.startsWith("/")) result = `/${result}`;

  if (!result.endsWith("/")) result = `${result}/`;

  return result;
}

export function getRoute(locale: string | undefined, path: string) {
  const cleanPath = normalizePath(path);

  return normalizePath(getRelativeLocaleUrl(locale || defaultLocale, cleanPath));
}
