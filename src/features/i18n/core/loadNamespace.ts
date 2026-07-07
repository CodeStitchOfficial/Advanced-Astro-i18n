import type { Locale } from "../i18nConfig";

const cache: Record<string, Record<string, unknown>> = {};

export function loadNamespace(locale: Locale, namespace: string) {
  const cacheKey = `${locale}/${namespace}`;
  if (cache[cacheKey]) return cache[cacheKey];

  const modules = import.meta.glob<{ default: Record<string, unknown> }>(
    "/src/locales/**/*.json",
    { eager: true },
  );

  const filePath = `/src/locales/${locale}/${namespace}.json`;
  const mod = modules[filePath];

  if (!mod) {
    console.warn(`Missing translation file: ${filePath}`);
    return {};
  }

  cache[cacheKey] = mod.default;
  return mod.default;
}
