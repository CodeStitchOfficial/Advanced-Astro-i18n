import type { Locale } from "../i18nConfig";
import { loadNamespace } from "./loadNamespace";
import { getNestedValue } from "./getNestedValue";

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
