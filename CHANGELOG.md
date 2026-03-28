# Advanced Astro v6 i18n

## 3.0.2

### Patch changes

- Migrated font loading to the Astro Fonts API; removed local font option in favour of Fontsource
- Added `preload` to the primary font for faster first paint
- Fixed `slugify()` edge case that could produce incorrect slugs when using diacritics (#53)
- Fixed missing `<Font />` component import
- Cleaned up `remove-dark-mode` script

## 3.0.1

### Patch changes

- Switching language between blog posts should now correctly navigate to the alternate blog post when mappingKey is set up
- Adding a blog entry through Decap dashboard now generates the correct id

## 3.0.0

### Major changes

- Migrated i18n system from `@astrolicious/i18n` to vanilla Astro i18n. The third-party integration has been removed entirely and replaced with a lightweight, self-contained utility layer.
- Routing moved from `src/routes/` to `src/pages/`, with French pages living as full copies under `src/pages/fr/` (duplication over shared components, for maximum flexibility).
- `prefixDefaultLocale: false` — English URLs stay clean (`/blog/...`), French gets the `/fr/` prefix.

#### New files

- `src/js/localeUtils.ts` — locale detection helpers
- `src/js/translationUtils.ts` — `t()` translation function and `getLocalizedPathname()` for cross-locale URL resolution
- `src/js/localePreference.ts` — browser language preference handling
- `src/config/siteSettings.ts` — centralised site configuration
- `src/config/routeTranslations.ts` — static route translation map + `localizedCollections` config
- `src/components/LanguageSwitch/BrowserLanguageRedirect.astro` — redirects home page visitors to their preferred locale on first visit

#### Blog slug translation (language switcher)

- Added `mappingKey` field to the blog collection schema (`src/content.config.ts`) to link equivalent posts across locales
- Added `mappingKey` frontmatter to all 8 blog posts (4 en + 4 fr pairs)
- `getLocalizedPathname()` is now async — it scans content collections at build time, groups entries by `mappingKey`, and merges them with static route translations
- Added `generateDynamicRouteTranslations()` to build full route maps from content collections
- Updated `TwoLocalesSelect.astro`, `MultiLocalesSelect.astro`, and `BaseLayout.astro` to await async `getLocalizedPathname`
- Switching languages on a blog post now correctly translates the slug (e.g. `/blog/fourth-post-in-english/` ↔ `/fr/blog/quatrieme-article-en-francais/`)

#### Route translations

- French project pages translated and renamed: `/projects/project-1/` → `/fr/projets/projet-1/`, `/projects/project-2/` → `/fr/projets/projet-2/`
- All static route translations declared in `src/config/routeTranslations.ts`

#### What should I do on my fork?

1. **Remove `@astrolicious/i18n`**

    ```bash
    npm uninstall @astrolicious/i18n astro-integration-kit
    ```

2. **Add the new utility and config files** from `src/js/` and `src/config/`

3. **Update path aliases in `tsconfig.json`**

    ```json
    {
    	"compilerOptions": {
    		"paths": {
    			"@js/*": ["src/js/*"],
    			"@config/*": ["src/config/*"]
    		}
    	}
    }
    ```

4. **Recreate your pages under `src/pages/`**, duplicating them per locale under `src/pages/fr/`

5. **Update your blog collection schema** (`src/content.config.ts`):
    - Remove `tags: z.array(z.string())`
    - Add `featured: z.boolean().optional()`
    - Add `mappingKey` with slug-safe regex validation and `slug` (optional, for Decap):

    ```ts
    mappingKey: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    ```

    Then add a `mappingKey` value to the frontmatter of every blog post to link translated pairs.

6. **Replace all `i18n:astro` / `@astrolicious/i18n` imports** with the new utilities:

    ```diff
    - import { getLocale, t } from "i18n:astro";
    + import { getLocaleFromUrl } from "@js/localeUtils";
    + import { t, getLocalizedPathname } from "@js/translationUtils";
    ```

7. **Update language switcher components** to `await getLocalizedPathname(...)` (it is now async)

#### Astro v6 upgrade

- Upgraded Astro to **v6**

#### Decap CMS

- Pre-configured Decap admin panel with **DecapBridge** backend
- Localized slug patterns enforced in Decap via regex validation on `slug` and `mappingKey` fields
- Remove Decap entirely with `npm run remove-decap`

#### Utility scripts

- **`npm run config-i18n`** — Interactive CLI to configure locales and i18n options
- **`npm run create-page`** — Scaffolds a new page for all locales
- **`npm run remove-demo`** — Removes demo/placeholder content
- **`npm run remove-dark-mode`** — Removes dark mode components and styles
- **`npm run test:scripts`** — Runs unit tests for the utility scripts

#### Schema changes

- `tags: z.array(z.string())` removed; replaced by `featured: z.boolean().optional()`
- `slug` field added with slug-safe regex validation (for Decap compatibility)
- `mappingKey` now also enforced with the same regex

#### Other changes & fixes

- Fixed FOUC (Flash of Unstyled Content)
- Fixed OG image generation and meta `<title>` / `<description>` handling
- Removed the preloading system (`getOptimizedImage`) — redundant with Astro's built-in optimization
- Removed `StaticHeader` — not applicable to multilingual projects
- Navigation labels now driven by `navData` (removed reliance on `common.json`)
- Added JSON-LD schema markup
- Code tours rewritten to reflect the v3 architecture
- Fixed accessibility issue: anchors without `href`

---

## 2.2.2

### Patch changes

- Added package overrides to resolve dependency conflicts with astro-integration-kit

```diff
+ "overrides": {
+   "@astrolicious/i18n": {
+     "astro-integration-kit": "^0.18.0"
+   }
+ }
```

## 2.2.1

### Patch changes

- Astro has been upgraded to v.5.7.12
- Fixed Picture import statement. Newer versions of Astro must import `<Image />` and `<Picture />` from "astro:assets"

```diff
- import Picture from "astro/components/Picture.astro"
+ import { Picture } from "astro:assets"
```

## 2.2.0

### Major change

New feature: Pagination

The blog index now has a pagination feature that allows to break up large collections into multiple pages. Paginated route names should use the same [bracket] syntax as a standard dynamic route. For instance, the file name /blog/[page].astro will generate routes for /blog/1, /blog/2, etc, where [page] is the generated page number.
Refer to [Astro's documentation on Pagination](https://docs.astro.build/en/guides/routing/#pagination) for more information.

### patch change

- Upgraded Astro packages

#### What should I do on my fork?

- [119cc5fa2a2d4289d5905f6107fb426315e6f46b](https://github.com/CodeStitchOfficial/Advanced-Astro-i18n/commit/119cc5fa2a2d4289d5905f6107fb426315e6f46b) - Add the `Paginate.astro` and `paginateButton.astro` components
- [7a6b2ae7a59dffe4c96abcdf8f161efea8d0c631](https://github.com/CodeStitchOfficial/Advanced-Astro-i18n/commit/7a6b2ae7a59dffe4c96abcdf8f161efea8d0c631#diff-ee82542e4c17b61e51157a8be5e0d05783aa3063649de4aacc31b15c9d24748e) - `blog.astro` is gone, and we now use `routes/blog/[...page].astro` to hold the pagination routing logic

```diff
// blog/[...page].astro
- const locale = getLocale();
- const posts = await getCollection("blog", ({ id }) => {
-    return id.startsWith(locale);
- });
- posts.sort(
-      (a, b) => new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf(),
-);

+ import type { GetStaticPaths, Page } from "astro";
+ import type { CollectionEntry } from "astro:content";
+ import { collectionFilters } from "@astrolicious/i18n/content-collections";
+ import { getLocalePlaceholder } from "i18n:astro";
+ import Pagination from "@components/TemplateComponents/Pagination.astro";
+
+ export const getStaticPaths = (async ({ paginate }) => {
+   const locale = getLocalePlaceholder();
+   const posts = await getCollection("blog", (post: CollectionEntry<"blog">) =>
+     collectionFilters.byLocale(post, { locale })
+   );
+
+   const sortedPosts = posts.sort(
+     (a, b) => new Date(b.data.date).valueOf() - new Date(a.data.date).valueOf(),
+ );
+
+   // paginates with options - https://docs.astro.build/en/reference/api-reference/#paginate
+   return paginate(sortedPosts, {
+     pageSize: 3,
+   });
+ }) satisfies GetStaticPaths;
+
+ const { page } = Astro.props as { page: Page };

```

- [7a6b2ae7a59dffe4c96abcdf8f161efea8d0c631](https://github.com/CodeStitchOfficial/Advanced-Astro-i18n/commit/7a6b2ae7a59dffe4c96abcdf8f161efea8d0c631#diff-55bed05322ee2559a6dac7d240323af8cf226d6cbcfd2a0f29ba9fbd3ad1d319) - Add translations strings and t functions for pagination buttons
- [383a919117cc64bf9a626c496979e446d1533482](https://github.com/CodeStitchOfficial/Advanced-Astro-i18n/commit/383a919117cc64bf9a626c496979e446d1533482) - Add extra blog posts to test the pagination system

## 2.1.0

### Major change

- [#20](https://github.com/CodeStitchOfficial/Advanced-Astro-i18n/pull/20) Feature: adds support for localized routes.
  For example, we are on /blog/third-post-in-english and switch language to fr. We will now correctly navigate to /fr/blog/troisieme-article-en-francais

#### What should I do on my fork?

- [76f8e00](https://github.com/CodeStitchOfficial/Advanced-Astro-i18n/pull/20/commits/76f8e00ffbf009f9036652b81dfdcf5777b9cf36) - update `config.astro.mjs`
- [720afe6](https://github.com/CodeStitchOfficial/Advanced-Astro-i18n/pull/20/commits/720afe6ed4a1d58189c5f4cf14078b63941bf903) - renamed [page] to [slug] and modified he getStaticpaths() script to use dynamicParams and localized routes
- [acd2672](https://github.com/CodeStitchOfficial/Advanced-Astro-i18n/pull/20/commits/acd26727808a1de67634994ea1731b5a2d64c60c) - add `defaultLocaleVersion` key and renamed markdown files for localization
- [acd2672](https://github.com/CodeStitchOfficial/Advanced-Astro-i18n/pull/20/commits/acd26727808a1de67634994ea1731b5a2d64c60c) - add `defaultLocaleVersion: reference("blog").optional(),` to your blog schema in `src/content.config.ts`
- [cd405a8](https://github.com/CodeStitchOfficial/Advanced-Astro-i18n/pull/20/commits/cd405a8bdb2a01fff3abfd7937d077fe88a14eb5) - using getLocalePath() instead of now deleted slugify() utility function
- [8a2e69d](https://github.com/CodeStitchOfficial/Advanced-Astro-i18n/pull/20/commits/8a2e69d457132e1b5464a655522c40a96658f10f) - delete trailing slashes to enforce proper routing
- [3cc3d2f](renamed and changed location of the blog page) - the blog index page is now named `blog.astro` and lives in the `pages` folder (from `/blog/inddex.astro`)

## 2.0.1

### Patch change

- Fix: changes file path to use alias instead of absolute path
  In blog markdown files, the images were not pulled from the right location. Using alias path `@assets` makes sure images are pulled from src. `image: "@assets/images/blog/blog-cover.jpg"`

## 2.0.0

### Major changes

- Astro has been upgraded to v5.0

#### What should I do on my fork?

1.  **Upgrade Astro and its dependencies** 1. Run `npx @astrojs/upgrade` in your terminal 2. At the yellow warning, choose “Yes” to continue
    <br>

2.  **Breaking change: Renamed: <ViewTransitions /> component**
    <br> 📢 Reference: https://docs.astro.build/en/guides/upgrade-to/v5/#renamed-viewtransitions--component 1. In `BaseLayout.astro`, replace all occurrences of the `ViewTransitions` import and component with `ClientRouter`

            ```tsx
            // BaseLayout.astro
            - import { ViewTransitions } from 'astro:transitions';
            + import { ClientRouter } from 'astro:transitions';

            <html>
              <head>
                ...
               - <ViewTransitions />
               + <ClientRouter />
              </head>
            </html>
            ```

     <br>

3.  **Breaking Change: Content Collections**
    <br> 📢 Reference: https://docs.astro.build/en/guides/upgrade-to/v5/#updating-existing-collections 1. **Move the content config file**. This file no longer lives within the `src/content/` folder. This file should now exist at `src/content.config.ts`.

        2. **Edit the collection definition**. Your updated collection requires a `loader` which indicates both a folder for the location of your collection (`base`) and a `pattern` defining the collection entry filenames and extensions to match.


            ```tsx
            // src/content.config.ts

             + import { glob } from 'astro/loaders';

            // type: 'content',

            loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/blog" }),

            ```

        3. **Change references from `slug` to `id`**. Content layer collections do not have a reserved `slug` field. Instead, all updated collections will have an `id`.

            For example:

            ```tsx
            // src/pages/blog/[...post].astro

            export async function getStaticPaths() {
              const posts = await getCollection("blog");
              return posts.map((entry) => ({
                // params: { post: entry.slug },
                params: { post: entry.id },
                props: { post: entry },
              }));
            }
            ```

            > 📢 `CTRL+SHIFT+F` and check for any traces of `.slug`. There shouldn’t be any more.


        4. **Switch to the new `render()` function**. Entries no longer have a `render()` method. Instead, import the `render()` function from `astro:content`.


            ```tsx
            // src/pages/blog/[...post].astro

            import { getCollection, render } from 'astro:content';

            // const { Content } = await page.render();
            const { Content } = await render(post);
            ```

            > 📢 Running into `Module '"astro:content"' has no exported member 'render'`?
            > => Restart the dev server



        5. Repeat for every content collection you may have added.

4.  **Breaking change: TypeScript configuration**
    <br> 📢 Reference: https://docs.astro.build/en/guides/upgrade-to/v5/#changed-typescript-configuration 1. Add the following `include` and `exclude` properties to your existing `tsconfig.json`:

    ````
    {
    "extends": "astro/tsconfigs/base",
    "include": [".astro/types.d.ts", "**/*"],
    "exclude": ["dist"]
    }

        ```
    ````

- Ensure that the other packages you may have added are up-to-date and compatible with Astro v5
- Please refer to the [official Upgrade to v5 guide](https://docs.astro.build/en/guides/upgrade-to/v5/) if you run into any issues.

### Minor changes

- Added CHANGELOG.md to keep track of patch changes and setup instructions

## 1.0.1

### Patch Changes

- [#17](https://github.com/CodeStitchOfficial/Advanced-Astro-v4-i18n/pull/17) [`8a346bb`](https://github.com/CodeStitchOfficial/Advanced-Astro-v4-i18n/commit/8a346bb5d640407bbb5c7a10d645cd0717f671ab) Thanks [@Masoud-M](https://github.com/Masoud-M)! - Fixes meta tag title to make it check for any language in the config.
    - Adds utility functions in utils.ts

```
//utils.ts
export function trimArrSlashes(arr: string[]) {
  return arr.map((str) => str.replace(/^\/+|\/+$/g, ""));
}

export function trimStringSlashes(arr: string) {
  return arr.replace(/^\/+|\/+$/g, "");
}
```

- Adds support for checking any language to create the meta title

```
//BaseLayout.astro
---
+ import { getHtmlAttrs, getLocales, t } from "i18n:astro";
+ import { trimArrSlashes, trimStringSlashes } from "@utils/utils";
+ const locales = getLocales();
+ // Trimming "/" from the beginning and end to handle URLs with or without trailing slashes.
+ const trimmedLocales = trimArrSlashes(locales);
+ const trimmedPathname = trimStringSlashes(Astro.url.pathname);
+ const isLandingPage = Astro.url.pathname === "/" || trimmedLocales.includes(trimmedPathname);
---

- {Astro.url.pathname === "/" ?  (`${ title }
+ {isLandingPage ?  (`${ title }
```

## [1.0.0] - 2023-10-05

### Added

- Initial release of Advanced Astro v4 with i18n support.
