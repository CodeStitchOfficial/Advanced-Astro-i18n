<h3 align="center">Advanced Astro v6 - i18n</h3>

<p align="center">
  This Astro starter kit ships bilingual (English/French) by default, with several pages built from CodeStitch components, a blog powered by Astro's content collections, and Decap CMS pre-wired for content editing. Every optional piece — i18n, the CMS, dark mode, demo content — can be stripped out with one interactive script, so the same kit works just as well for single-language projects as multilingual ones.
  <br/>
  <br/>
  <a href="https://advanced-astro-kit-i18n.netlify.app/" target="_blank">View Live Result</a>
</p>

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
    - [Using the Github template](#using-the-github-template)
    - [Using the CLI](#using-the-cli)
    - [Quickstart](#quickstart)
    - [Set up your project](#set-up-your-project)
    - [Essential files to configure](#essential-files-to-configure)
    - [Commands](#commands)
- [Features](#features)
- [Project Structure](#project-structure)
    - [Project Tree](#project-tree)
    - [Key Directories](#key-directories)
- [i18n System](#i18n-system)
    - [Overview and Config](#overview-and-config)
    - [Adding or changing locales](#adding-or-changing-locales)
    - [Page Structure](#page-structure)
    - [Configuration Files](#configuration-files)
    - [Translation Files and Namespaces](#translation-files-and-namespaces)
    - [Using Translations](#using-translations)
    - [Generating Localized URLs](#generating-localized-urls)
    - [Localizing Route Slugs](#localizing-route-slugs)
    - [Localizing Blog Post Slugs](#localizing-blog-post-slugs)
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

This kit runs on **Astro v6** with reusable components and centralized data, giving you room to scale as a client's site grows. It ships bilingual by default, with internationalization powered by [Astro's built-in i18n routing](https://docs.astro.build/en/guides/internationalization/), scalable to as many locales as you need. The blog runs on Decap CMS and Astro's Content Collections.

Every optional feature (i18n, Decap CMS, dark mode, demo content) can be removed with an interactive script (see [Commands](#commands)), so the same kit works just as well for a single-language site as a multilingual one. An example website is included, built from [CodeStitch's vanilla component library](https://codestitch.app/) for easy section swaps — deployment is possible in as little as two minutes.

## Getting Started

There are two ways you can bootstrap your starter kit:

### Using the Github template

1. At the top right of the GitHub Repository, click the green _Use this template_ button,
   then click _Create a new repository_.
2. Follow the instructions to create a new repository, using this repo as a template.
3. When created, clone the repository to your local machine.

### Using the CLI

Run one of these commands to initialize a new project from this template:

```sh
npm create astro@latest -- --template CodeStitchOfficial/Advanced-Astro-i18n
```

<details>
<summary>Using yarn or pnpm instead</summary>

```sh
yarn create astro@latest --template CodeStitchOfficial/Advanced-Astro-i18n
```

```sh
pnpm create astro@latest --template CodeStitchOfficial/Advanced-Astro-i18n
```

</details>

### Quickstart

Once you have the code, via either method above:

```sh
npm install
npm run dev
```

Open `localhost:4321` — you should see the demo site running. From there, jump to [Set up your project](#set-up-your-project) to strip out any features you don't need.

### Set up your project

```sh
npm run setup-project
```

This is the main onboarding command: it asks which optional features to keep (i18n, Decap CMS, demo content, dark mode) and, if i18n is kept, offers to configure your locales right after. Under the hood it calls the scripts below — they're not exposed as `npm run` commands, but you can also run them directly at any time (e.g. to reconfigure locales later)

### Essential files to configure

Once you've run `setup-project`, these are the files most projects need to personalize before writing any new code:

| File | What to update |
| ---- | --------------- |
| `src/data/client.ts` | Business name, email, phone, address (`BUSINESS` object) |
| `src/data/siteConfig.ts` | Domain, description, social share image (`SITE`, `OG`) |
| `astro.config.ts` | `site` — your production domain |
| `src/styles/root.less` | Brand colors/fonts via CSS variables (`--primary`, `--secondary`, `--headerColor`, etc.) |
| `src/components/Settings/Settings.astro` | Swap or remove the dark-mode toggle / language switcher |
| `src/data/navData.json` | Nav links, and per-locale translated paths if i18n is kept |
| `public/admin/config.yml` | Decap CMS repo + DecapBridge auth endpoints, if keeping the CMS |

See [Pre-Deployment Checklist](#pre-deployment-checklist) for the full list to double-check right before going live (production domain, favicons, sitemap, etc.).

### Commands

All commands are run from the root of the project, from a terminal:

| Command                 | Action                                                                     |
| ----------------------- | -------------------------------------------------------------------------- |
| `npm install`           | Installs dependencies                                                      |
| `npm run dev`           | Starts local dev server at `localhost:4321`                                |
| `npm run build`         | Build your production site to `./dist/`                                    |
| `npm run preview`       | Preview your build locally, before deploying                               |
| `npm run setup-project` | Interactively choose which features to keep/remove, then configure locales |
| `npm run create-page` | Scaffolds a new page for all locales |
| `node scripts/config-i18n.js` | Reconfigure locales interactively (default locale, additional locales, URL prefixing) |
| `node scripts/remove-i18n.js` | Permanently removes the i18n system |
| `node scripts/remove-decap.js` | Removes Decap CMS integration |
| `node scripts/remove-demo.js` | Removes demo/placeholder content |
| `node scripts/remove-dark-mode.js` | Removes dark mode components and styles |

## Features

- **Polyvalent**: every optional feature below can be removed with `npm run setup-project` (or its individual `remove-*` script), so this one kit covers single-language and multilingual projects alike
- Runs on **Astro v6**
- Bilingual by default (English/French) with Astro's built-in i18n routing and custom utilities — add more locales anytime
- Optional Decap CMS integration for blog management (removable via `node scripts/remove-decap.js`)
- Dark mode (removable via `node scripts/remove-dark-mode.js`)
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
│   ├── content/
│   │   └── blog/
│   │       ├── en/
│   │       └── fr/
│   ├── data/
│   │   ├── client.ts
│   │   ├── siteConfig.ts
│   │   └── navData.json
│   ├── features/
│   │   ├── i18n/
│   │   ├── darkmode/
│   │   ├── decapCMS/
│   │   └── demo/
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
│   └── content.config.ts
├── astro.config.ts
└── tsconfig.json
```

### Key Directories

- **`public/`** — Static assets that won't be processed by Astro (Decap admin, favicons, `_redirects`, `robots.txt`).
- **`src/components/`** — Reusable Astro components (`Meta/`, `Header/`, `Footer/`, `Settings/`, etc.).
- **`src/content/blog/`** — Blog posts, one folder per locale (`en/`, `fr/`).
- **`src/data/`** — Site-wide data (`client.ts`, `siteConfig.ts`, `navData.json`).
- **`src/icons/`** — SVGs used by the `<Icon />` component.
- **`src/layouts/`** — Page layouts. `BaseLayout.astro` wraps all pages.
- **`src/locales/`** — Translation JSON files, one folder per locale (`en/`, `fr/`).
- **`src/pages/`** — Astro page files. English pages live at the root, French pages under `fr/` with translated slugs.
- **`src/styles/`** — CSS/LESS stylesheets.

## i18n System

### Overview and Config

Internationalization runs on **Astro's built-in i18n routing**, plus a small set of helpers in `src/features/i18n/`. Two languages ship out of the box: English (default) and French.

```ts
// astro.config.ts
i18n: {
  defaultLocale: "en",
  locales: ["en", "fr"],
  routing: { prefixDefaultLocale: false },
},
```

`prefixDefaultLocale: false` means English pages have clean URLs (`/about/`) while French ones get a prefix (`/fr/a-propos/`). It is this kit's default setting.

> **Note:** This kit's i18n is opinionated, and not the only valid way to do it here. Full page duplication (see [Page Structure](#page-structure)) is already enough on its own to serve translated content — each locale's pages could just contain hardcoded copy in their own language. The JSON translation layer (`src/locales/`) exists on top of that so _shared components_ (Hero, CTA, the header, etc.) can serve every locale without duplicating their markup. If your components diverge a lot per locale anyway, or you'd rather edit copy directly in place, skipping the JSON layer and hardcoding is a perfectly reasonable alternative.

### Adding or changing locales

> **Tip:** Run `npm run setup-project` for an interactive setup instead of doing this by hand.

To add a locale manually (e.g. Spanish `es`):

1. **`astro.config.ts`** — add `"es"` to `locales`
2. **`src/features/i18n/i18nConfig.ts`** — add `es` to `locales`, `localeMap`, and `languageSwitcherMap`
3. **`src/locales/es/`** — copy the JSON files from `en/` and translate them
4. **`src/pages/es/`** — copy the pages from `src/pages/fr/` and translate them
5. **`src/data/navData.json`** — add an `es` entry to each nav item's `urls` and `label`
6. **`src/content/blog/es/`** — add translated blog posts (see [Localizing Blog Post Slugs](#localizing-blog-post-slugs))

### Page Structure

Each locale gets its own copy of every page: default locale pages sit at the root of `src/pages/`, secondary locale pages live inside a sub-folder

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

Every page starts with one call — `getSiteContext(Astro.url)` — which figures out the locale from the URL and hands back that locale's translated content. See [Using Translations](#using-translations)

### Configuration Files

**`src/features/i18n/i18nConfig.ts`** is the single source of truth for locale setup:

```ts
export const locales = ["en", "fr"] as const;
export const defaultLocale: Locale = "en";
export const localeMap = { en: "en-US", fr: "fr-FR" }; // for og:locale / hreflang
export const languageSwitcherMap = { en: "EN", fr: "FR" }; // labels on the toggle
```

> **Info:** This file is automatically populated when you set up your project with `npm run setup-project`.

**Route translations** (e.g. `about` → `a-propos`) aren't written by hand: they're generated automatically from `src/data/navData.json`, where each nav entry already has a translated URL per locale. To change a translated route, edit `navData.json`; you never need to touch the generated map directly.

### Translation Files and Namespaces

Translations live in `src/locales/{locale}/`, one JSON file per **namespace**:

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

Call `getSiteContext(Astro.url)` and read from `content`, namespaced by filename (`common.json` → `content.common`, `home.json` → `content.home`, etc.):

```astro
---
import { getSiteContext } from "@js/getSiteContext";

const { content } = await getSiteContext(Astro.url);
---

<h2>{content.common.ctaComponent.title}</h2>
<h1>{content.home.hero.title}</h1>
```

### Generating Localized URLs

Use `getLocalizedRoute(locale, path)` to link to translated routes:

```astro
---
import { getSiteContext } from "@js/getSiteContext";
import { getLocalizedRoute } from "src/features/i18n/routing/getLocalizedRoute";

const { locale } = await getSiteContext(Astro.url);
---

<a href={getLocalizedRoute(locale, "/about")}>About</a>
<!-- "/about/" for EN, "/fr/a-propos/" for FR -->
```

> [!IMPORTANT]
> This only translates routes that exist in `src/data/navData.json` **and** have a matching page file (e.g. `src/pages/fr/a-propos.astro`).

### Localizing Route Slugs

Adding a page with a translated slug is a 3-step combo:

1. Create the English page: `src/pages/my-page.astro`
2. Create the French page: `src/pages/fr/ma-page.astro`
3. Add it to `navData.json`:

```json
{
	"key": "my-page",
	"urls": { "en": "/my-page", "fr": "/ma-page" },
	"label": { "en": "My Page", "fr": "Ma Page" }
}
```

That's it — every URL helper picks this up automatically.

### Localizing Blog Post Slugs

Link translations of the same post with a matching `mappingKey` in frontmatter:

```yaml
# src/content/blog/en/first-post-in-english.md
title: First blog post in English
mappingKey: "post-1"
```

```yaml
# src/content/blog/fr/premier-article-en-francais.md
title: Premier article de blog en français
mappingKey: "post-1"
```

With the same `mappingKey`, but a different slug per locale, the language switcher uses it to jump from `/blog/first-post-in-english/` straight to `/fr/blog/premier-article-en-francais/`.

### Language Switcher Components

Two ready-made components live in `src/features/i18n/LanguageSwitch/`:

- **`TwoLocalesSelect.astro`** — simple toggle, best for 2 locales (default).
- **`MultiLocalesSelect.astro`** — dropdown, best for 3+ locales.

Both always link to the correct translated URL automatically. To switch which one is active, change the import in `src/components/Settings/Settings.astro`.

## Content Management & Blog

This kit ships with [Decap CMS](https://decapcms.org/) pre-configured, giving clients a user-friendly admin interface to manage blog posts in multiple languages. Authentication is handled by [DecapBridge](https://decapbridge.com/).

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

- **`astro.config.ts`** — set the `site` field to your production URL
- **`src/data/client.ts`** — fill in business name, address, phone, email, and social links
- **`src/data/siteConfig.ts`** — fill in site title, description, production URL, and social share image
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
