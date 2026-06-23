import type { Locale } from "./siteSettings";

export const routeTranslations: Record<Locale, Record<string, string>> = {
  en: {
    "about": "about",
    "projects": "projects",
    "project-1": "project-1",
    "project-2": "project-2",
    "reviews": "reviews",
  },  es: {
    "about": "about",
    "projects": "projects",
    "project-1": "project-1",
    "project-2": "project-2",
    "reviews": "reviews",
  },
};

export const localizedCollections = {
  blog: {  en: "blog", es: "blog" },
} as const;
