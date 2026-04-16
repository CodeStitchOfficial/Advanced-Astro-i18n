import type { Locale } from "./siteSettings";

export const routeTranslations: Record<Locale, Record<string, string>> = {  fr: {
    "about": "a-propos",
    "projects": "projets",
    "project-1": "projet-1",
    "project-2": "projet-2",
    "reviews": "avis",
  },
  nl: {
    "about": "about",
    "projects": "projects",
    "project-1": "project-1",
    "project-2": "project-2",
    "reviews": "reviews",
  },
};

export const localizedCollections = {
  blog: {nl: "blog" },
} as const;
