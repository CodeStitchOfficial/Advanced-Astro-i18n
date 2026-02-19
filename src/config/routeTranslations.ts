import type { Locale } from "./siteSettings";

export const routeTranslations: Record<Locale, Record<string, string>> = {
  en: {
    "about": "about",
    "projects": "projects",
    "project-1": "project-1",
    "project-2": "project-2",
  },
  fr: {
    "about": "a-propos",
    "projects": "projets",
    "project-1": "projet-1",
    "project-2": "projet-2",
  },
};

export const localizedCollections = {
  blog: { en: "blog", fr: "blog" },
} as const;
