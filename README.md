<h3 align="center">Advanced Astro v6 - i18n</h3>

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
    - [Adding or changing locales](#adding-or-changing-locales)
    - [Using a single language](#using-a-single-language)
    - [Page Structure](#page-structure)
    - [Configuration Files](#configuration-files)
    - [Translation Files and Namespaces](#translation-files-and-namespaces)
    - [Using Translations](#using-translations)
    - [Generating Localized URLs](#generating-localized-urls)
    - [Localizing Route Slugs](#localizing-route-slugs)
    - [Localizing Blog Post Slugs](#localizing-blog-post-slugs)
    - [Browser Language Redirect](#browser-language-redirect)
    - [Language Switcher Components](#language-switcher-components)
- [Content Management & Blog](#content-management--blog)
    - [Content Collections](#content-collections)
    - [Configuring the CMS](#configuring-the-cms)
    - [i18n Blog Structure](#i18n-blog-structure)
    - [Accessing the Dashboard](#accessing-the-dashboard)
    - [Featured Posts](#featured-posts)
    - [Styling the Preview Pane](#styling-the-preview-pane)
    - [Local Backend Setup](#local-backend-setup)
- [Deployment](#deployment)
    - [Pre-Deployment Checklist](#pre-deployment-checklist)
    - [Setting Up Decap CMS with DecapBridge](#setting-up-decap-cms-with-decapbridge)
- [Acknowledgments](#acknowledgments)
- [Conclusion](#conclusion)

## Overview

This Advanced kit includes a pre-configured [Astro](https://www.astro.build) environment, which allows for repeated components, centralized data and greater room to scale as your clients grow. The kit runs **Astro v6** with internationalization powered by [Astro's built-in i18n routing](https://docs.astro.build/en/guides/internationalization/) and a set of custom utility functions to create a multilingual website, scalable to as many languages as necessary. The blog is powered by Decap CMS and Astro's Content Collections.

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

Next, you can run any of the CLI commands below to help you shape the kit according to your needs.

### Commands

All commands are run from the root of the project, from a terminal:

| Command                    | Action                                       |
| :------------------------- | :------------------------------------------- |
| `npm install`              | Installs dependencies                        |
| `npm run dev`              | Starts local dev server at `localhost:4321`  |
| `npm run build`            | Build your production site to `./dist/`      |
| `npm run preview`          | Preview your build locally, before deploying |
| `npm run config-i18n`      | Configures the i18n setup interactively      |
| `npm run remove-demo`      | Removes demo/placeholder content             |
| `npm run remove-dark-mode` | Removes dark mode components and styles      |
| `npm run remove-decap`     | Removes Decap CMS integration                |
| `npm run create-page`      | Scaffolds a new page for all locales         |
| `npm run test:scripts`     | Runs unit tests for the utility scripts      |

## Features

- Runs on **Astro v6**
- i18n setup ready to go with Astro's built-in i18n routing and custom utilities
- Browser language redirect on the home page
- Dark mode (removable via `npm run remove-dark-mode`)
- Optional Decap CMS integration (removable via `npm run remove-decap`)
- Astro's `<ClientRouter />` integration for view transitions
- Astro Fonts API
- Astro's content collections to supercharge your Astro pages and content
- Automatic sitemap generation at build time
- [CodeStitch](https://codestitch.app/) HTML and CSS blocks to build the UI
- Perfect Lighthouse scores

## Project Structure

### Project Tree

```
.
├── public/
│   ├── admin/
│   │   ├── config.yml
│   │   └── decap-preview-styles.css
│   ├── assets/
│   ├── _redirects
│   └── robots.txt
├── scripts/
├── src/
│   ├── assets/
│   ├── components/
│   ├── config/
│   │   ├── routeTranslations.ts
│   │   └── siteSettings.ts
│   ├── content/
│   │   └── blog/
│   │       ├── en/
│   │       └── fr/
│   ├── data/
│   │   ├── client.ts
│   │   └── navData.json
│   ├── icons/
│   ├── js/
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
│   │   │   └── index.astro
│   │   ├── blog/
│   │   │   ├── [...page].astro
│   │   │   └── [...slug].astro
│   │   ├── projects/
│   │   │   ├── project-1.astro
│   │   │   └── project-2.astro
│   │   ├── 404.astro
│   │   └── index.astro
│   ├── styles/
├── astro.config.mjs
├── content.config.ts
└── tsconfig.json
```

### Key Directories

- **`public/`** — Static assets that won't be processed by Astro (Decap admin, favicons, `_redirects`, `robots.txt`).
- **`src/components/`** — Reusable Astro components.
- **`src/config/`** — i18n configuration: locale definitions (`siteSettings.ts`) and route translations (`routeTranslations.ts`).
- **`src/content/blog/`** — Blog posts organized by locale (`en/`, `fr/`).
- **`src/data/`** — Site-wide data (`client.json`, `navData.json`).
- **`src/icons/`** — SVGs used by the `<Icon />` component.
- **`src/js/`** — i18n utility functions.
- **`src/layouts/`** — Page layouts. `BaseLayout.astro` wraps all pages.
- **`src/locales/`** — Translation JSON files organized by locale (`en/`, `fr/`).
- **`src/pages/`** — Astro page files. By default, English pages live at the root, French pages under `fr/` with translated slugs.
- **`src/styles/`** — CSS/LESS stylesheets.

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

### Adding or changing locales

> **Tip:** Run `npm run config-i18n` to configure locales interactively.

To add a new locale manually (e.g. Spanish `es`):

1. **`astro.config.mjs`** — add `"es"` to the `locales` array
2. **`src/config/siteSettings.ts`** — add `es` to `locales`, `localeMap` (`es: "es-ES"`), and `languageSwitcherMap` (`es: "ES"`)
3. **`src/locales/es/`** — create translated JSON files mirroring `en/`
4. **`src/pages/es/`** — create translated page files mirroring `src/pages/fr/`
5. **`src/config/routeTranslations.ts`** — add `es` entries for each translated route segment
6. **`src/content/blog/es/`** — add translated blog posts with matching `mappingKey` values

### Using a single language

This kit supports single-language projects where a language switcher is not needed. When configured for a single language:

- **No language prefix** — all pages are served at the root (e.g., `/about/`, not `/en/about/`)
- **No language switcher** — the language switcher components automatically hide
- **All i18n utilities still work** — translation functions and route helpers work unchanged
- **Easy upgrade path** — convert to multi-language later without rewriting code

#### Setting up a single-language project

Run the interactive configuration:

```bash
npm run config-i18n
```

When prompted, select "single-language project" and provide your language code (e.g., `en`, `nl`, `de`). The script will:

1. Update `astro.config.mjs` with your locale and set `prefixDefaultLocale: false`
2. Create `.i18n-single-language` marker file to track single-language mode
3. Provide next steps for removing demo content

#### Single-language utility functions

For single-language projects, `translationUtils.ts` provides simplified helpers:

- **`getSingleLocale()`** — returns the single configured locale
- **`getLocalizedRouteForCurrentLang(path)`** — a simplified version of `getLocalizedRoute()` for single-language use

Example:

```astro
---
import { getSingleLocale, getLocalizedRouteForCurrentLang } from "@js/translationUtils";

const locale = getSingleLocale();
const aboutUrl = getLocalizedRouteForCurrentLang("/about");
---

<a href={aboutUrl}>About</a>
```

All existing i18n functions (`getLocalizedRoute`, `getLocalizedPathname`, `useTranslations`) continue to work as-is.

#### Upgrading from single to multi-language

To convert a single-language project to multi-language:

1. Run `npm run config-i18n` and select "multi-language project"
2. Follow the prompts to specify additional locales
3. The `.i18n-single-language` marker file will be removed
4. Add page files and translations for the new locales following the [multi-language structure](#page-structure)

For more details, see `SINGLE_LANGUAGE.md` in the project root.

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

The `localeMap` object maps locale codes to BCP 47 region tags and is used for date formatting (e.g. `fr: "fr-FR"`).

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

Two language switcher components are provided in `src/components/LanguageSwitch/`:

- **`TwoLocalesSelect.astro`** — A simple toggle for two-locale setups (e.g. EN/FR).
- **`MultiLocalesSelect.astro`** — A dropdown menu for projects with more than two locales.

Both components use `getLocalizedPathname(locale, Astro.url)` to resolve the equivalent URL in the target locale, including translated route segments and blog post slugs. To swap which one is active, edit the imports in `src/components/Settings/Settings.astro`.

## Content Management & Blog

This kit ships with [Decap CMS](https://decapcms.org/) pre-configured, giving clients a user-friendly admin interface to manage blog posts in multiple languages. Authentication is handled by [DecapBridge](https://decapbridge.com/), which adds GitHub-based login without requiring Netlify Identity.

### Content Collections

[Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) are the best way to manage sets of content in any Astro project: blog posts, product descriptions, character profiles, recipes, or any structured content. Collections help to organize and query your documents, enable Intellisense and type checking in your editor, and provide automatic TypeScript type-safety for all of your content.

Blog posts live in `src/content/blog/` organized by locale:

```
src/content/blog/
├── en/
│   ├── first-post-in-english.md
│   └── ...
└── fr/
    ├── premier-article-en-francais.md
    └── ...
```

This kit's blog collection is configured in `src/content.config.ts` and require schemas for Typescript validation.

> [!IMPORTANT]
> If you are using Decap CMS, the collection schema in `content.config.ts` and the field definitions in `public/admin/config.yml` must stay in sync. Adding a field to one without updating the other will cause validation errors or missing data.

### Configuring the CMS

The CMS configuration lives in `public/admin/config.yml`. This file controls:

- **Backend** — authentication method, GitHub repo, and branch
- **Media** — where uploaded images are stored (`src/assets/images/blog/`)
- **i18n** — locale structure for multilingual content
- **Collections** — the fields available in the admin UI for each content type

After completing the [DecapBridge setup](#setting-up-decap-cms-with-decapbridge), replace the `backend` block in `config.yml` with the snippet from your DecapBridge dashboard. See the [Decap CMS docs](https://decapcms.org/docs/) for a full reference on collection fields and widget types.

### i18n Blog Structure

The CMS mirrors this kit's bilingual blog structure. In `config.yml`, the i18n block uses `multiple_folders`:

```yaml
i18n:
    structure: multiple_folders
    locales: [en, fr]
    default_locale: en
```

This maps to `src/content/blog/en/` and `src/content/blog/fr/` on disk. When an editor creates a post, Decap saves language variants into the corresponding locale folder automatically.

The `mappingKey` field (set to `i18n: duplicate`) links the English and French versions of the same post. It must be identical across translations — this is how `getLocalizedPathname()` resolves the equivalent post URL when switching locales. See [Localizing Blog Post Slugs](#localizing-blog-post-slugs) for details.

### Accessing the Dashboard

Once deployed and configured, navigate to `/admin` on your live site to access the CMS. Log in with your DecapBridge credentials. Clients you invite via the DecapBridge dashboard can log in the same way.

### Featured Posts

Set `featured: true` in a post's frontmatter (or toggle the **Featured** switch in the CMS) to surface that post as featured in the frontend. The `featured` field is `i18n: duplicate`, so toggling it in one locale applies to both.

### Styling the Preview Pane

Decap CMS renders a live preview of posts as editors type. Two files control this:

- **`public/admin/decap-preview-styles.css`** — CSS applied inside the preview iframe. Edit this to match your site's typography and colours. Note: CSS must be **flat** (no nesting), as the preview iframe does not run a CSS preprocessor.
- **`src/pages/admin.astro`** — Registers the preview template and injects the stylesheet into Decap. Edit the preview template here to change the preview layout.

### Local Backend Setup

To run Decap CMS locally without deploying (useful for content entry during development):

1. Add `local_backend: true` to the top of `public/admin/config.yml`:

```yaml
local_backend: true
backend:
    # ... rest of your backend config
```

2. Install the required packages:

```bash
npm install --save-dev npm-run-all
npm install decap-server
```

3. Update `package.json` scripts:

```json
"scripts": {
    "astro": "astro dev",
    "decap": "npx decap-server",
    "dev": "npm-run-all --parallel astro decap",
    ...
}
```

4. Run `npm run dev` as usual. The CMS admin will be available at `http://localhost:4321/admin` without requiring a login.

> [!NOTE]
> Remove `local_backend: true` before deploying to production.

## Deployment

### Pre-Deployment Checklist

Before going live, confirm the following are updated for your client's project:

- **`astro.config.mjs`** — set the `site` field to your production URL
- **`src/data/client.ts`** — fill in business name, address, phone, email, and social links
- **`public/robots.txt`** — update the `Sitemap` URL to your production domain
- **`public/assets/favicons/`** — replace placeholder favicons with the client's branding
- **`public/admin/config.yml`** — complete the DecapBridge setup (see below) and set `site_url` to the production URL

Once updated, test the production build locally:

```bash
npm run build && npm run preview
```

Then deploy: Netlify is the recommended host. Navigate to your Netlify Admin Panel, click **Add new site → Import an existing project**, and connect your GitHub repository.

> [!NOTE]
> If you choose a different host, update the `_redirects` file to match that host's 404 redirect syntax.

### Setting Up Decap CMS with DecapBridge

[DecapBridge](https://decapbridge.com/) provides GitHub OAuth for Decap CMS without requiring Netlify Identity. Follow these steps after deploying your site:

**1. Create a DecapBridge account**

Go to [decapbridge.com](https://decapbridge.com/) and sign up.

**2. Create a new site in DecapBridge**

In your dashboard, click **Create New Site** and fill in:

- **GitHub repository** — `your-github-username/your-repo-name`
- **CMS URL** — your deployed site's URL (e.g. `https://yoursite.netlify.app/admin`)

**3. Generate a GitHub Personal Access Token**

Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens** and create a token with:

- **Repository access** — select your repo
- **Permissions** — `Contents: Read and write`, `Pull requests: Read and write`

Paste the token into the DecapBridge site setup form.

**4. Paste the backend snippet into `config.yml`**

DecapBridge will generate a backend configuration snippet. This kit is pre-configured for the **PKCE** auth format (the newer, recommended option). Paste your snippet into the `backend` block in `public/admin/config.yml`:

```yaml
# PKCE format (used in this kit)
backend:
    name: git-gateway
    repo: your-github-username/your-repo-name
    branch: main
    auth_type: pkce
    base_url: https://auth.decapbridge.com
    auth_endpoint: /sites/<your-site-id>/pkce
    auth_token_endpoint: /sites/<your-site-id>/token
    gateway_url: https://gateway.decapbridge.com
```

> [!NOTE]
> DecapBridge also supports a **legacy** auth format (without `auth_type: pkce`), which uses `identity_url` and `gateway_url` only. Either format works — this kit ships pre-configured for PKCE. Use whichever format your DecapBridge dashboard provides.

**5. Push and test**

Commit and push the updated `config.yml`. Visit `/admin` on your live site and log in with your DecapBridge credentials to verify the connection.

**6. Invite clients**

From your DecapBridge dashboard, invite client email addresses. They'll receive a login link and can access the CMS at `/admin` without a GitHub account.

## Acknowledgments

The author would like to acknowledge:

- [Starlight](https://starlight.astro.build/) - The ThemeProvider and Select components are derived from Starlight.

## Conclusion

I hope that this kit will prove useful to you. If you have any questions or would like to connect, feel free to reach out on [GitHub](https://github.com/BuckyBuck135) or at `buckybuck` on Discord.

Happy coding!
**_Geoffrey_**
