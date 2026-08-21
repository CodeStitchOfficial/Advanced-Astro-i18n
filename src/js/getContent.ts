import { loadTranslations } from "./loadTranslations";
import { features } from "../features/featuresFlags";

export const i18nEnabled = features.i18n;

export function getContent(locale?: string) {
  if (i18nEnabled) {
    return loadTranslations(locale ?? "en");
  }

  // BASIC MODE:
  // ignore locale completely
  return loadTranslations("en");
}
