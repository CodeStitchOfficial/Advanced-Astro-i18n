# Advanced Astro i18n - v3 Roadmap

This is a starter kit for CodeStitch users who wish to have an i18n project.

## Overview

Migration from `@astrolicious/i18n` to vanilla Astro i18n (branch: `feat/v3`).

- **Locales:** en (default), fr
- **Approach:** French pages are full copies (duplication over shared components)
- **i18n config:** Astro native with `prefixDefaultLocale: false`
- **Translation system:** JSON namespace files in `src/locales/{locale}/{namespace}.json`
- **Route translations:** Static routes in `src/config/routeTranslations.ts`, dynamic (collection) routes via `mappingKey` frontmatter
- **Content collections:** Blog (with `mappingKey` for cross-locale slug mapping)

## Changelog

### Language switcher blog slug translation

- Added `mappingKey` field to blog collection schema (`src/content.config.ts`)
- Added `mappingKey` frontmatter to all 8 blog posts (en + fr pairs: post-1 through post-4)
- Added `localizedCollections` config to `src/config/routeTranslations.ts`
- Rewrote `getLocalizedPathname()` in `src/js/translationUtils.ts` to be async — scans content collections at build time, groups entries by `mappingKey`, merges with static route translations
- Added `generateDynamicRouteTranslations()` to build full route maps from content collections
- Updated `TwoLocalesSelect.astro` and `BaseLayout.astro` to await async `getLocalizedPathname`
- Switching languages on blog posts now correctly translates slugs (e.g. `/blog/fourth-post-in-english/` <-> `/fr/blog/quatrieme-article-en-francais/`)

### Previous migration work (pre-roadmap)

- Removed all `@astrolicious/i18n` and `i18n:astro` imports
- Created utility files: `src/js/localeUtils.ts`, `src/js/translationUtils.ts`
- Created config files: `src/config/siteSettings.ts`, `src/config/routeTranslations.ts`
- Set up path aliases: `@js/*`, `@config/*`
- French pages created as full duplicates under `src/pages/fr/`
- HrefLang tags generated inline in `BaseLayout.astro`
- Build passes with 24 pages

## Todo

- [x] Evaluate whether the current `routeTranslations` system is solid and user-friendly enough. Currently only translates the first segment — nested routes like `projects/project-1` need full-path keys
      Currently uses a dual system: one through mappingKey for items in content collections, and one with RouteTranslations.ts for 'static' pages (i.e. non content collections).
      How does our system compare to i18next?
      => The two data sources exist because the content is fundamentally different:
    - Static pages (.astro files) — no frontmatter, finite set of known routes → routeTranslations.ts makes sense
    - Blog posts (content collection) — have frontmatter, dynamic/growing set → mappingKey makes sense

    Could you force them into one? Yes, but the tradeoffs aren't great:
    - Put blog mappings in routeTranslations.ts too: You'd have to manually add an entry every time you write a new blog post. Error-prone  
      and redundant since the info is already in the filenames + mappingKey.
    - Give static pages a mappingKey-like system: .astro files don't have frontmatter, so you'd need to invent something (a comment
      convention, a separate manifest file) — which is basically just routeTranslations.ts with extra steps.

    My take: The current architecture is already unified where it matters (the API surface). The two data sources exist for good reasons. I
    wouldn't change this — it's the right level of complexity for the problem.
    => Your system covers the same ground as i18next for the features you actually use. The main gaps are interpolation and pluralization —  
     both are straightforward to add to your t() function if you ever need them, without pulling in i18next's ~40KB runtime and plugin  
     ecosystem. The slug mapping system is entirely yours regardless — no i18n framework handles that.

- [x] Add French route translations for project pages (`/projects/project-1/` -> `/fr/projets/projet-1/`, etc.) and rename French page files accordingly

- [x] Audit `MultiLocalesSelect.astro` — it hasn't been updated for async `getLocalizedPathname` yet
- [x] Verify both language switcher components handle all page types correctly (static, blog, projects)

- [x] add feature: redirect to language based on browser preference for home page only
- [x] i18n sitemap

### kit standardization (see Int kit)

- [x] Add Decap CMS integration
- [x] Add `remove-decap` script
- [x] Add `remove-demo` script
- [x] Add `remove-dark-mode` script
- [x] Remove preloading system
- [x] Check favicon / check with other kits for CS favicon
- [x] Update blog post content to match the other CodeStitch kits (placeholder content alignment)
- [x] Use Astro <Picture /> throughout
- [x] should we use glob to load portfolio images? => too cumbersome

### Post-standardization checks

- [] set up decapbridge + test decap admn auth
- [] test i18n sitemap and hreflang
- [] tweak? and test remove-decap
- [] check and update code tours
- [] upgrade to Astro v6 and test Fonts API and live collection

### new script

- [] create remove i18n
- [] create add-page

### documentation

- [ ] update documentation and changelog

### random fixes
