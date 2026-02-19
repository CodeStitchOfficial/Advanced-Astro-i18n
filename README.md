<h3 align="center">Advanced Astro v5 - i18n</h3>

<p align="center">
  This Astro advanced kit includes a pre-configured multi-language setup, along with five pages filled with CodeStitch components. Everything is ready to go right from the start, offering a fantastic introduction to the advantages of a Static Site Generator, complete with LESS preprocessing and a blog powered by Astro's content collections.
  <br/>
  <br/>
  <a href="https://advanced-astro-kit-i18n.netlify.app/" target="_blank">View Live Result</a>
</p>

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Commands](#commands)
- [Features](#features)
- [Project Structure](#project-structure)
    - [Project Tree](#project-tree)
    - [Key Directories](#key-directories)
- [i18n System](#i18n-system)
    - [Overview and Config](#overview-and-config)
    - [Page Structure](#page-structure)
    - [Configuration Files](#configuration-files)
    - [Translation Files and Namespaces](#translation-files-and-namespaces)
    - [Using Translations](#using-translations)
    - [Generating Localized URLs](#generating-localized-urls)
    - [Localizing Route Slugs](#localizing-route-slugs)
    - [Localizing Blog Post Slugs](#localizing-blog-post-slugs)
    - [Browser Language Redirect](#browser-language-redirect)
    - [Language Switcher Components](#language-switcher-components)
- [Content Collections](#content-collections)
- [Custom Picture Component](#custom-picture-component)
- [Preloading Images](#preloading-images)
- [Deployment](#deployment)
- [Acknowledgments](#acknowledgments)
- [Conclusion](#conclusion)

## Overview

This Advanced kit includes a pre-configured [Astro](https://www.astro.build) environment, which allows for repeated components, centralized data and greater room to scale as your clients grow. The kit runs **Astro v5** with internationalization powered by [Astro's built-in i18n routing](https://docs.astro.build/en/guides/internationalization/) and a set of custom utility functions to create a multilingual website, scalable to as many languages as necessary. The blog is powered by Astro's Content Collections. This can easily be adapted to anything which requires changing content, such as menus, job listing boards, portfolios and much more. It could even be extended by a CMS to allow your clients to manage their content on their own.

An example website has also been provided, with easy substitution of website sections possible through the use of [CodeStitch's vanilla component library](https://codestitch.app/). This kit aims to get any project off the ground in as little time as possible, with deployment being possible in as little as two minutes.

## Getting Started

There are two ways you can bootstrap your starter kit:

### Using the Github template

1. At the top right of the GitHub Repository, click the green _Use this template_ button,
   then click _Create a new repository_.
2. Follow the instructions to create a new repository, using this repo as a template.
3. When created, clone the repository to your local machine.
4. Run `npm install` to install all dependencies.
5. Run `npm run dev` to start the project and spin up a development server on `localhost:4321`.

### Using the CLI

Run one of these commands to initialize a new project from this template:

```sh
npm create astro@latest -- --template CodeStitchOfficial/Advanced-Astro-i18n
```

```sh
yarn create astro@latest --template CodeStitchOfficial/Advanced-Astro-i18n
```

```sh
pnpm create astro@latest --template CodeStitchOfficial/Advanced-Astro-i18n
```

Then follow the prompts, install dependencies with `npm install`, and start the dev server with `npm run dev`.

Next, it is recommended to update `data/client.json` with some new information about this project. Through the power of templating, the project's `<head>` and contact information will automatically be filled out, providing a first peek into some of the benefits of SSGs.

You can find all of CodeStitch's `:root` variables, as well as `.cs-topper`, `.cs-title` and `.cs-text`, within the root stylesheet. Feel free to adjust these, or use our Content Flair micro-stitches, to update site-wide styles quickly.

## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## Features

- Runs on **Astro v5**
- i18n setup ready to go with Astro's built-in i18n routing and custom utilities
- Browser language redirect on the home page
- Dark mode
- Astro's `<ClientRouter />` integration for view transitions
- Astro's content collections to supercharge your Astro pages and content
- Accessible dropdown menus on desktop navigation and nested pages
- Automatic sitemap generation at build time
- [CodeStitch](https://codestitch.app/) HTML and CSS blocks to build the UI
- Perfect Lighthouse scores

This kit ships the following packages:

- [Astro Icon](https://www.astroicon.dev/) - Straightforward icon system for the Astro framework.
- [Autoprefixer](https://www.npmjs.com/package/autoprefixer) - PostCSS plugin to parse CSS and add vendor prefixes to CSS rules.
- [LESS](https://www.npmjs.com/package/less) - Less makes a few convenient additions to the CSS language, but you can also simply write standard CSS if you wish.
- [Astro Sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) - Automatically generates `sitemap-index.xml` and `sitemap-0.xml`. Make sure to replace `https://www.yourwebsite.com` with your actual site URL in `astro.config.mjs` and `robots.txt`.

### Prerequisites

Only the vanilla web technologies are _required_ before using this kit, with familiarity with Astro and React-style components and props recommended. If you would like to read up on some of these things, we recommend the following resources:

1. [Astro's Documentation](https://docs.astro.build/en/getting-started/)
2. [Astro Crash Course in 20 Minutes!](https://www.youtube.com/watch?v=zrPVTf761OI)
3. [Astro's Internationalization Guide](https://docs.astro.build/en/guides/internationalization/)

## Project Structure

### Project Tree

```
.
├── public/
│   ├── assets/
│   │   ├── favicons/
│   │   ├── fonts/
│   │   ├── images/
│   │   ├── js/
│   │   └── svgs/
│   ├── _redirects
│   └── robots.txt
├── src/
│   ├── assets/
│   │   └── images/
│   ├── components/
│   │   └── TemplateComponents/
│   │       ├── DarkMode/
│   │       ├── LanguageSwitch/
│   │       │   ├── BrowserLanguageRedirect.astro
│   │       │   ├── MultiLocalesSelect.astro
│   │       │   └── TwoLocalesSelect.astro
│   │       ├── CSPicture.astro
│   │       ├── Pagination.astro
│   │       └── Settings.astro
│   ├── config/
│   │   ├── routeTranslations.ts
│   │   └── siteSettings.ts
│   ├── content/
│   │   └── blog/
│   │       ├── en/
│   │       └── fr/
│   ├── data/
│   │   ├── client.json
│   │   └── navData.json
│   ├── icons/
│   ├── js/
│   │   ├── localeUtils.ts
│   │   └── translationUtils.ts
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── locales/
│   │   ├── en/
│   │   └── fr/
│   ├── pages/
│   │   ├── fr/
│   │   │   ├── blog/
│   │   │   │   ├── [...page].astro
│   │   │   │   └── [...slug].astro
│   │   │   ├── projets/
│   │   │   │   ├── projet-1.astro
│   │   │   │   └── projet-2.astro
│   │   │   ├── 404.astro
│   │   │   ├── a-propos.astro
│   │   │   ├── contact.astro
│   │   │   └── index.astro
│   │   ├── blog/
│   │   │   ├── [...page].astro
│   │   │   └── [...slug].astro
│   │   ├── projects/
│   │   │   ├── project-1.astro
│   │   │   └── project-2.astro
│   │   ├── 404.astro
│   │   ├── about.astro
│   │   ├── contact.astro
│   │   └── index.astro
│   ├── styles/
│   └── utils/
├── astro.config.mjs
├── content.config.ts
├── postcss.config.cjs
└── tsconfig.json
```

### Key Directories

- **`public/`** — Static assets that won't be processed by Astro (fonts, favicons, `_redirects`, `robots.txt`).
- **`src/components/`** — Reusable Astro components. `TemplateComponents/` contains non-CodeStitch components (dark mode, language switcher, pagination, etc.).
- **`src/config/`** — i18n configuration: locale definitions (`siteSettings.ts`) and route translations (`routeTranslations.ts`).
- **`src/content/blog/`** — Blog posts organized by locale (`en/`, `fr/`).
- **`src/data/`** — Site-wide data (`client.json`, `navData.json`).
- **`src/icons/`** — SVGs used by the `<Icon />` component.
- **`src/js/`** — i18n utility functions: locale detection (`localeUtils.ts`) and translations/routing (`translationUtils.ts`).
- **`src/layouts/`** — Page layouts. `BaseLayout.astro` wraps all pages.
- **`src/locales/`** — Translation JSON files organized by locale (`en/`, `fr/`).
- **`src/pages/`** — Astro page files. English pages live at the root, French pages under `fr/` with translated slugs.
- **`src/styles/`** — CSS/LESS stylesheets.
- **`src/utils/`** — General helper functions.

## i18n System

### Overview and Config

Internationalization is powered by **Astro's built-in i18n routing** combined with custom utility functions. The project ships with two languages out of the box: English (default) and French.

The i18n routing is configured in `astro.config.mjs`:

```js
i18n: {
  defaultLocale: "en",
  locales: ["en", "fr"],
  routing: {
    prefixDefaultLocale: false,
  },
},
```

With `prefixDefaultLocale: false`, English pages are served at the root (`/about/`) while French pages are prefixed (`/fr/a-propos/`).

Locale settings are centralized in `src/config/siteSettings.ts`:

### Page Structure

Unlike a plugin-based approach, this kit uses **full page duplication**: English pages live at the root of `src/pages/`, and French pages are duplicated under `src/pages/fr/`. A localization system has been implemented to localize the slugs with translated filenames:

```
src/pages/
├── about.astro           → /about/
├── contact.astro         → /contact/
├── index.astro           → /
├── fr/
│   ├── a-propos.astro    → /fr/a-propos/
│   ├── contact.astro     → /fr/contact/
│   └── index.astro       → /fr/
```

Each page detects its locale using `getLocaleFromUrl()` and loads translations accordingly. This approach gives you full control over each locale's page structure.

### Configuration Files

#### `src/config/siteSettings.ts`

Defines the available locales, default locale, locale-to-region mapping, and language switcher labels. Import from `@config/siteSettings`.

#### `src/config/routeTranslations.ts`

Maps route segments between locales. Used by `getLocalizedRoute()` and `getLocalizedPathname()` to generate and translate URLs:

```ts
export const routeTranslations: Record<Locale, Record<string, string>> = {
	en: {
		about: "about",
		projects: "projects",
		"project-1": "project-1",
		"project-2": "project-2",
	},
	fr: {
		about: "a-propos",
		projects: "projets",
		"project-1": "projet-1",
		"project-2": "projet-2",
	},
};
```

### Translation Files and Namespaces

Translation files live in `src/locales/{locale}/` as JSON files. Each JSON file is a **namespace**. The default namespace is `common.json`.

```
src/locales/
├── en/
│   ├── common.json
│   ├── home.json
│   ├── about.json
│   └── ...
└── fr/
    ├── common.json
    ├── home.json
    ├── about.json
    └── ...
```

JSON files for each locale must have the **same structure and keys** — only the translated values differ.

**Example** — `src/locales/en/common.json`:

```json
{
	"ctaComponent": {
		"title": "Get It Done",
		"subtitle": "With Us Today",
		"message": "Say something encouraging...",
		"cta": "Get a Quote"
	}
}
```

**Example** — `src/locales/fr/common.json`:

```json
{
	"ctaComponent": {
		"title": "Confiez votre projet",
		"subtitle": "à nos experts",
		"message": "Dites quelque chose d'accrocheur...",
		"cta": "Obtenir un devis"
	}
}
```

### Using Translations

Use `useTranslations(locale)` to get a `t()` function that resolves translation keys:

```astro
---
import { getLocaleFromUrl } from "@js/localeUtils";
import { useTranslations } from "@js/translationUtils";

const locale = getLocaleFromUrl(Astro.url);
const t = useTranslations(locale);
---

<h2>{t("ctaComponent.title")}</h2>
<p>{t("ctaComponent.message")}</p>
```

To access a key from a namespace other than `common`, prefix with the namespace name:

```astro
<!-- Loads from src/locales/{locale}/home.json -->
<h1>{t("home:hero.title")}</h1>
```

Array items are accessed by index:

```astro
<!-- home.json: { "services": [{ "heading": "Service 1" }, ...] } -->
<h2>{t("home:services.0.heading")}</h2>
```

### Generating Localized URLs

Use `getLocalizedRoute(locale, basePath)` to generate locale-aware URLs with translated segments:

```astro
---
import { getLocaleFromUrl } from "@js/localeUtils";
import { getLocalizedRoute } from "@js/translationUtils";

const locale = getLocaleFromUrl(Astro.url);
---

<!-- Outputs "/contact/" for EN, "/fr/contact/" for FR -->
<a href={getLocalizedRoute(locale, "/contact")}>Contact</a>

<!-- Outputs "/about/" for EN, "/fr/a-propos/" for FR -->
<a href={getLocalizedRoute(locale, "/about")}>About</a>
```

> [!IMPORTANT]
> For `getLocalizedRoute()` to produce translated URLs, the route segments must be defined in `src/config/routeTranslations.ts` (see below) **and** the corresponding page files must exist with matching filenames (e.g. `src/pages/fr/a-propos.astro` for the French version of `/about`).

### Localizing Route Slugs

Route slug translations are defined in `src/config/routeTranslations.ts`. When you add a new page with a translated slug:

1. Create the English page at `src/pages/my-page.astro`.
2. Create the French page at `src/pages/fr/ma-page.astro`.
3. Add the mapping to `routeTranslations`:

```ts
en: {
  "my-page": "my-page",
},
fr: {
  "my-page": "ma-page",
},
```

The `getLocalizedRoute()` and `getLocalizedPathname()` functions will use this mapping to generate and translate URLs.

### Localizing Blog Post Slugs

Blog post slugs are localized using the `mappingKey` frontmatter field. This field links translations of the same post across locales.

**English** — `src/content/blog/en/first-post-in-english.md`:

```yaml
---
title: First blog post in English
mappingKey: "post-1"
# ...
---
```

**French** — `src/content/blog/fr/premier-article-en-francais.md`:

```yaml
---
title: Premier article de blog en français
mappingKey: "post-1"
# ...
---
```

The `mappingKey` value (`"post-1"`) connects these posts. The `getLocalizedPathname()` function uses this to resolve the correct slug when switching locales — for example, `/blog/first-post-in-english/` ↔ `/fr/blog/premier-article-en-francais/`.

### Browser Language Redirect

The home page (`/`) automatically redirects visitors to their preferred locale based on the browser's primary language. For example, a visitor whose browser is set to French will be redirected to `/fr/`.

- The redirect only applies to the **home page**, not other pages.
- Once a user manually switches languages via the language switcher, a `locale-preference` key is stored in `localStorage` and the auto-redirect is disabled.

**To disable this feature**, remove the `<BrowserLanguageRedirect />` component and its import from `src/pages/index.astro`.

### Language Switcher Components

Two language switcher components are provided in `src/components/TemplateComponents/LanguageSwitch/`:

- **`TwoLocalesSelect.astro`** — A simple toggle for two-locale setups (e.g. EN/FR).
- **`MultiLocalesSelect.astro`** — A dropdown menu for projects with more than two locales.

Both components use `getLocalizedPathname(locale, Astro.url)` to resolve the equivalent URL in the target locale, including translated route segments and blog post slugs.

## Content Collections

The blog uses [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) configured in `src/content.config.ts`. Blog posts live in `src/content/blog/` organized by locale:

```
src/content/blog/
├── en/
│   ├── first-post-in-english.md
│   └── ...
└── fr/
    ├── premier-article-en-francais.md
    └── ...
```

The blog schema includes:

```ts
z.object({
	title: z.string(),
	description: z.string(),
	author: z.string(),
	date: z.date(),
	tags: z.array(z.string()),
	image: image(),
	imageAlt: z.string(),
	mappingKey: z.string().optional(),
});
```

The `mappingKey` field is optional and used to link translated versions of the same post (see [Localizing Blog Post Slugs](#localizing-blog-post-slugs)).

Posts are filtered by locale using `filterCollectionByLanguage(collection, locale)` from `@js/localeUtils`.

## Custom Picture Component

Astro provides built-in `<Picture>` and `<Image>` components for image optimization. To replicate the `<picture>` elements with multiple `srcset` found in many CodeStitch stitches, use the custom `<CSPicture />` component in `src/components/TemplateComponents/`.

It uses [Astro's `getImage()` function](https://docs.astro.build/en/recipes/build-custom-img-component/) to create a custom image component that displays different source images based on media queries.

> Note: the component will automatically convert your .jpg files to .webp!

```astro
---
import CSPicture from "@components/TemplateComponents/CSPicture.astro";
import mobileImage from "@assets/images/construction-m.jpg"
import desktopImage from "@assets/images/cabinets2.jpg"
import fallbackImage from "@assets/images/cabinets2.jpg"
---

<CSPicture
  mobileImgUrl={mobileImage}
  mobileMediaWidth="600px"
  desktopImgUrl={desktopImage}
  desktopMediaWidth="601px"
  fallbackImgUrl={fallbackImage}
  alt=""
/>
```

It accepts 3 images (mobile, desktop and fallback) that can be different sizes, crops, or completely different assets, plus customizable media width breakpoints.

## Preloading Images

This kit takes advantage of the [preload attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload) to fetch images above the fold with higher priority, resulting in improved performance and reducing flashes of unstyled content.

You will notice this snippet at the top of every `.astro` page:

```astro
---
import {getOptimizedImage} from "../js/utils"
import landingImage from "../assets/images/landing.jpg"
const optimizedImage = await getOptimizedImage(landingImage)
---
```

You only need to change the path of the asset you want to preload. The rest is managed behind the scenes.

## Deployment

1. Before you deploy, test the build. Run `npm run build` to build the project. Once done, run `npm run preview` to access the site on `http://localhost:4321/`. This allows you to test your website as if it was deployed on your host.
2. Ensure the `astro.config.mjs`, `client.json`, `robots.txt` and `_redirects` have been filled out and updated.
3. Netlify is the recommended hosting provider. If you choose another one, make sure to modify the `_redirects` code to handle the 404 page.
   Navigate to your Netlify Admin Panel, click _Add new site | Import an existing project_.
4. Follow the instructions to connect your GitHub repository to Netlify and deploy.

## Acknowledgments

The author would like to acknowledge:

- [Starlight](https://starlight.astro.build/) - The ThemeProvider and Select components are derived from Starlight.

## Conclusion

I hope that this kit will prove useful to you. If you have any questions or would like to connect, feel free to reach out on [GitHub](https://github.com/BuckyBuck135) or at `buckybuck` on Discord.

Happy coding!
**_Geoffrey_**
