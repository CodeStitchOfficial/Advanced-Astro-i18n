  <h3 align="center">Advanced Astro v4 - i18n</h3>

  <p align="center">
    This Astro advanced kit includes a pre-configured multi-language setup, along with five pages filled with CodeStitch components. Everything is ready to go right from the start, offering a fantastic introduction to the advantages of a Static Site Generator, complete with LESS preprocessing and a blog powered by Astro’s content collections. 
    <br/>
    <br/>
    <a href="https://advanced-astro-kit-i18n.netlify.app/" target="_blank">View Live Result</a>
  </p>

## Table of Contents

- [Overview](#overview)
- [Getting Started](#gettingStarted)
- [Commands](#commands)
- [Prerequisites](#prerequisites)
- [Features](#features)
- [Project Structure](#projectStructure)
  - [Root Files and Folders](#rootFilesAndFolders)
  - [Source Files and Folders](#sourceFilesAndFolders)
- [Expanding the Project](#expandingTheProject)
  - [i18n](#i18n)
  - [Custom Picture component](#Custompicturecomponent)
  - [Astro Content Collections](#AstroContentCollections)
  - [Preloading images](#preloadingimages)
- [Deployment](#deployment)
- [Acknowledgments](#acknowledgments)
- [Conclusion](#conclusion)

<a name="overview"></a>

## Overview

This Advanced kit includes a pre-configured <a href="https://www.astro.build">Astro</a> environment, which
allows for repeated components, centralized data and greater room to scale as your clients grow. The kit runs the latest major Astro version, v4. On top of this, internationalization has been provided througha [the Astrolicious i18n integration](https://github.com/astrolicious/i18n) to create a multilingual website, scalable to as many languages as necessary. The blog is powered by Astro's Content Collections. This can easily be adapted to anything which requires changing content, such as menus, job listing boards, portfolios and much more. It could even be extended by a CMS to allow your clients to manage their content on their own.

An example website has also been provided, with easy substitution of website sections possible through the use of <a href="https://codestitch.app/">CodeStitch's
vanilla component library</a>. This kit aims to get any project off the ground in as little time as possible, with deployment being possible in as little as two minutes. 

<a name="gettingStarted"></a>

## Getting Started

1. Run one of these commands to initialize a new project from this template:

```sh
npm create astro@latest -- --template CodeStitchOfficial/Advanced-Astro-i18n
```

```sh
yarn create astro@latest --template CodeStitchOfficial/Advanced-Astro-i18n
```

```sh
pnpm create astro@latest --template CodeStitchOfficial/Advanced-Astro-i18n
```
2. Choose a name for your project.
3. Change into the newly created project directory.
4. Install dependencies:
```sh
npm install
```
5. Start the development server:
```sh
npm run dev
```
This will spin up the project on <a href="http://localhost:4321">http://localhost:4321</a>

Next, it is recommended to update `data/client.json` with some new information about this project. Through the power of templating, the
project's `<head>` and contact information will automatically be filled out, providing a first peek into some of the benefits of SSGs.

You can find all of CodeStitches `:root` variables, as well as .cs-topper, .cs-title and .cs-text, within the `root` stylesheet. Feel free to adjust these, or use our Content Flair micro-stitches, to update site-wide styles quickly.

<a name="commands"></a>

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

<a name="prerequisites"></a>

## Prerequisites

Only the vanilla web technologies are _required_ before using this kit, with familiarity with Astro and React-style Components and props are recommended. A lot of the leg-work for the non-vanilla technologies has been done for you. If you would like to read up on some of these things, we recommend the following resources:

1. [Astro's Documentation](https://docs.astro.build/en/getting-started/)
2. [Astro Crash Course in 20 Minutes!](https://www.youtube.com/watch?v=zrPVTf761OI)
3. [i18next Crash Course](https://www.youtube.com/watch?v=SA_9i4TtxLQ)


<a name="features"></a>

## Features

* Runs on Astro v4
* i18n setup ready to go, complete with routing and LanguageSelect component
* Dark mode
* Astro's `<ViewTransitions />` integration
* Astro's content collections to supercharge your Astro pages and content. 
* Accessible dropdown menus on desktop navigation and nested pages
* Automatic sitemap generation at build time
* [CodeStitch](https://codestitch.app/) HTML and CSS blocks to build the UI.
* Perfect Lighthouse scores
  

This kit ships the following packages:
* [Astro Icon](https://www.astroicon.dev/) - Astro Icon is a straightforward icon system for the Astro framework.
* [Autoprefixer](https://www.npmjs.com/package/autoprefixer) - PostCSS plugin to parse CSS and add vendor prefixes to CSS rules using values from Can I Use. It is recommended by Google and used in Twitter and Alibaba.
* [LESS](https://www.npmjs.com/package/less) - Less makes a few convenient additions to the CSS language, but you can also simply write standard CSS if you wish.
* [Astrolicious i18n](https://github.com/astrolicious/i18n) -  i18n integration for Astro with server and client utilities, type safety and translations built-in.
* [Astro Sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/#_top) - Automatically generates `sitemap-index.xml` and `sitemap-0.xml`. Make sure to replace `https://yourwebsite.com` with your actual site URL in `astro.config.mjs` and `robots.txt`.

<a name="projectStructure"></a>

## Project Structure

Astro leverages an opinionated folder layout for your project. Every Astro project root should include the following directories and files:
* `src/*` - Your project source code (components, pages, styles, etc.)
* `public/*` - Your non-code, unprocessed assets (fonts, icons, etc.)
* `package.json` - A project manifest.
* `astro.config.mjs` - An Astro configuration file. (recommended)
* `tsconfig.json` - A TypeScript configuration file. (recommended)


<a name="projectTree"></a>

### Project Tree

```
.
├── public/
|   |—— assets/
|   |   |—— favicons/
|   |   |—— fonts/
|   |   |—— images/
|   |   |—— js/
|   |   └── svgs/
|   |—— _redirects
|   |—— robots.txt
├── src/
|   ├── assets/
|   |   └── images/
|   ├── components/
│   │   └── TemplateComponents 
│   ├── content/ /
│   │   ├── blog/ 
│   │   └── config.ts 
│   ├── data/
│   │   ├── client.json 
│   │   └── navData.json 
│   ├── icons/ 
│   ├── locales/ 
│   │   ├── en 
│   │   └── fr
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── routes/ 
|   |   |── index.astro /* Accessible at / and /fr by default */
|   |   |—— about.astro /* Accessible at /about and /fr/about by default etc. */
|   |   |—— contact.astro
│   │   └── blog/
│   │   |   ├── [post].astro /* Dynamically generates individual blog pages */
│   │   |   └── index.astro /* Blog landing page */
│   │   └── projects/
│   │       ├── project-1.astro
│   │       └── project-2.astro
|   |── styles/
|   └── utils/
|       |── global.d.ts /* used by the ThemeProvider component */
|       └── utils.ts /* place any utility functions here */
├── .astro.config.mjs
├── .postcss.config.cjs
└── tsconfig.json
```

<a name="sourceFilesAndFolders"></a>

### Source Files and Folders

- public/ - All assets you don't want or need optimized by Astro. Include fonts and favicons in here. The \_redirects and robots.txt files also live here.
- src/ - Raw, source code. The folder you work in.
- .astro.config.mjs - Astro config file, already set up for you.


<a name="sourceFilesAndFolders"></a>

### Source Files and Folders

#### `node_modules/*`
Created after you run `npm install`. This directory contains the code for all the dependencies that power this kit. It comes as standard with any NodeJS-powered project, much like the `package.json` and `package-lock.json` files. You can safely ignore this directory in your day-to-day work.

#### `dist/`
Created after running `npm build`. This will hold the final build of your site.

#### `public/*`
The `public/` directory is for files and assets in your project that do not need to be processed during Astro’s build process. The files in this folder will be copied into the build folder untouched, and then your site will be built.


- \_redirects - To configure redirects. Read more on <a href="https://docs.netlify.com/routing/redirects/">Netlify</a>
- content/ - Data to render pages from, such as the blog.
- robots.txt - Instructions for site crawlers. Learn more, and generate your own, <a href="https://en.ryte.com/free-tools/robots-txt-generator/">here</a>

You can place CSS and JavaScript in your public/ directory, but be aware that those files will not be bundled or optimized in your final build.


#### `src/*`
The `src/` folder is where most of your project source code lives. This includes:

* Pages
* Layouts
* Astro components
* UI framework components (React, etc.)
* Styles (CSS, Sass)
* Markdown

Astro processes, optimizes, and bundles your src/ files to create the final website that is shipped to the browser. Unlike the static public/ directory, your src/ files are built and handled for you by Astro.

##### `src/assets`
Contains all assets you want optimized by Astro (such as assets used in `<Picture />` components for example) must be placed in `src`.

`public/assets/images/blog` is where the images uploaded on the CMS will be stored.

##### `src/components`
Components are reusable units of code for your HTML pages. These could be Astro components, or UI framework components like React or Vue. It is common to group and organize all of your project components together in this folder.

The `TemplateComponents` folder contains all non-CodeStitch related components such as ThemeProvider and Select etc.

##### `src/content`
The src/content/ directory is reserved to store content collections organised in folders (e.g. `src/content/blog`) containing `.md` files, and an optional `config.ts` collections configuration file. No other files are allowed inside this folder.

##### `src/data`
This directory contains data files that are accessible within any template throughout the project. 
* `client.js` holds some information you may wish to define for a client. It's important to fill this file out with the correct information for your client, as many HTML meta tags, the sitemap, and robots.txt all use data from this file.

* `navData.json` holds data to create the navigation of your site. See more information in the [navigation via navData.json section](#navigationViaFrontMatter)

##### `src/icons`
SVGs used by the <Icon /> component **must** be placed in this folder.

##### `src/layouts`
Layouts are Astro components that define the UI structure shared by one or more pages. The `BaseLayout.astro` file acts as a giant wrapper for each individual page, where the content is injected through the `<slot /> `component.

##### `src/locales`
Place your json files for translations in these sub-folders. See more information in the [i18n section](#i18n).

##### `src/pages`
Unlike a standard non-i18n Astro project, this `pages` folder ships empty. Use it for pages that you want handled by the i18n package. See more information in the [i18n section](#i18n).

##### `src/routes`
Managed by the i18n package; place your "pages" here. See more information in the [i18n section](#i18n). All `.astro` files placed in this directory will generate pages accessible from all locales.

```
├── routes/ 
|   |   |── index.astro /* Accessible at / and /fr by default */
|   |   |—— about.astro /* Accessible at /about and /fr/about by default */
```

##### `src/styles`
It is a common convention to store your CSS, Less or Sass files in a `src/styles` directory.

##### `src/utils`
Contains helper functions.

#### `astro.config.mjs`
An Astro configuration file. It's already set up for you, but you can extend it with integrations to use, build options, server options, and more.

#### `package.json` and `package-lock.json`
The project's manifest. Standard NodeJS package files, containing the dependencies needed for the project to work.


#### `tsconfig.json`
A TypeScript configuration file. Optional. Includes TypeScript configuration options for your Astro project. Some features (like npm package imports) aren’t fully supported in the editor without a tsconfig.json file.

This kit is configured to have the `strictest` TS config, which you can modify of course. The `paths` config object comes handy to create import shortcuts.

<a name="expandingTheProject"></a>

## Expanding the Project

Aimed towards freelancers, this kit was made with scalability and flexibility in mind, suiting a range of websites and client needs. As such, it is your choice whether you'd rather make small tweaks to the existing site, or clear all the page content and build a site all over again. Outlined below are some best
practices for when it comes to building on top of this kit:



<a name="i18n"></a>

### i18n

Internationalization is powered by the [I18n for Astro integration plugin](https://astro-i18n.netlify.app/). This project is set up to work with two languages out of the box, English (default language) and French. 

This plugin brings 5 major changes to our project structure:

1. in `astro.config.js`

```JS
i18n({
    defaultLocale: "en",
    locales: ["fr", "en"],
    client: {
      data: true,
      paths: true
    },
  })
```

This allows to configure the integration. This minimal set up here configures the languages in your project. You can check the [configuration documentation](https://astro-i18n.netlify.app/usage/configuration/#_top) for more options to pass to this configuration object.

2. The `routes` directory

Unlike a monolingual Astro project, the `routes` directory is where most of your `.astro` pages will live and what the integration uses to create routing. Any `.astro` file placed in this `routes` directory will be accessible from all locales. For example, `index.astro` will be accessible at `/blog` and `/fr/blog` by default.

![alt text](/public/assets/images/docs/image.png)

The `pages` directory can still be used. It's useful when you want some urls to be unique, ie. not translated like API routes (eg. under pages/api)
in 1 locale only (eg. /pages/fr/test won't be handled in a special way)

3. The `locales` directory
The `locales` directory will have one sub-directory for each locale in your project. This is where the translations live, in `.json` files. You are free to organize your translations as you with, but you must provide at least a `src/locales/en/common.json` for each locale. These json files are also referred to as namespaces.

These json files must have the same name and the same organisation of key/values pairs. The only difference will obviously be the translated content.

The default (and mandatory) name space is `common.json`. In this kit, we also use extra name spaces so that `common.json` doesn't become too bloated. You can use `common.json` for translations of repeated components, and other name spaces for individual pages for example. 

For example:
`/locales/en/common.json`
```
{
  "home": "Home",
  "about": "About",
  "projects": "Projects",
  "project-1": "Project 1",
  "project-2": "Project 2",
}
```

`/locales/fr/common.json`
```
{
  "home": "Accueil",
  "about": "A propos",
  "projects": "Projets",
  "project-1": "Projet 1",
  "project-2": "Projet 2",
}
```

4. Accessing the namespaces' data and translating with the `t()` function.

Under the hood, [i18next](https://www.i18next.com/) is used to manage translations. We enforce the following conventions:

* Locales must live in the src/locales/ directory (can be customized with localesDir)
* A folder for the default locale is required, eg. `src/locales/en/`
* Provide at least a `src/locales/en/common.json` file (can be customized with defaultNamespace)

To access data from a name space in an .`astro` file, we use the `t` function. Don't forget to import it first in your astro file with  `import { t } from "i18n:astro";`.

  1. First, we create the json data. 

`src/locales/fr/common.json`
```json
"ctaComponent": {
    "title1": "Confiez votre projet",
    "title2": "à nos experts",
    "message": "Dites quelque chose d'accrocheur, d'informatif et d'encourageant à cliquer sur le bouton pour aller à la page de contact. J'aime ajouter cette bannière en bas de chaque page.",
    "cta":"Obtenir un devis"
},
```

  2. Then, in our `.astro` file, we import the `t` function and use it in JSX:

`src/components/CTA.astro`
```JSX
---
import { t, getLocalePath } from "i18n:astro";
---
<div class="container">
  <h2 class="title">
    {t("ctaComponent.title1")}
    <br />
    {t("ctaComponent.title2")}
  </h2>
  <p>
    {t("ctaComponent.message")}
  </p>
  <a href={getLocalePath("/contact")} class="cs-button-solid">{t("ctaComponent.cta")}</a>
</div>
```

To access data from a name space other than `common.json`, the syntax will be slightly different: we must prefix with the name of the name space.

`home.json`
```json
"layout": {
    "title": "Pixel Perfect Websites",
    "description": "Meta description for the page"
},
```
Use `{t("home:layout.title")}` to access the `title` key from the `layout` object in the `home` namespace (=.json file)


`home.json`
```json
"services": [
    {
        "heading": "Service 1",
        "p": "Talk about the service with keywords people will be searching for it by. Keep it 1-2 sentences."
    },
    {
        "heading": "Service 2",
        "p": "Talk about the service with keywords people will be searching for it by. Keep it 1-2 sentences."
    },
    {
        "heading": "Service 3",
        "p": "Talk about the service with keywords people will be searching for it by. Keep it 1-2 sentences."
    }
],
```

To access data nested in arrays with the `t` function, you can use this syntax: `<h2>{t("home:services.0.heading")}</h2>`, where 
* `home:` is the name of the json namespace file
* `0` here is the `[0]` index of the array.
* `.heading` is tkey object key to access

The t function is re-exported from i18next and benefits from type-safety automatically. Have a look at [i18next docs](https://www.i18next.com/) to learn more.

5. getLocalePath
Create hrefs using `getLocalePath` to allow you get the right url for the current locale.

```jsx
---
import { getLocalePath } from "i18n:astro"
---
// This link will take you to "/contact" or "/fr/contact" depending on the current locale
<a href={getLocalePath("/contact")} class="cs-button-solid">Dynamic link</a>
```

6. Localized slugs for routes and blog posts
Localizing slugs has benefits: it increases user experience by proving them with page names that are in their language, and it improves SEO.

#### Localizing slugs for routes
We use the `pages` object in the i18n config.
```diff
i18n({
      defaultLocale: "en",
      locales: ["fr", "en"],
      client: {
        data: true,
        paths: true,
      },
      + pages: {
			+ 	"/about": {
			+ 		fr: "/a-propos",
			+ 	}
			+ },
    }),
```

#### Localizing slugs for blog posts
The process is a bit different here. 
 * rename your blog markdown files to the desired localized slug (e.g. `deuxieme-article-en-francais.md`, `second-blog-in-english.md`)
 * create a `defaultLocaleVersion` front-matter entry in the blog posts that are not in the default locale. This entry will be used to match each blog post to its counterparts in other locales. For example, in the `deuxieme-article-en-francais.md` file, I add `defaultLocaleVersion: en/second-post-in-english` to the front-matter.

<a name="Custom Picture component"></a>

### Custompicturecomponent

Astro provides two built-in components that you can use to display and optimize your images. 
 * The <Picture> component allows you to display responsive images and work with different formats and sizes. 
 * The <Image> component will optimize your images and allow you to pass in different formats and quality properties.

If you want to replicate the `<picture>` elements with multiple `srcset` found in many Stitches, you can use our custom `<CSPicture />` component located in `/src/Components/TemplateComponents`.  

It uses <a href="https://docs.astro.build/en/recipes/build-custom-img-component/">Astro's `getImage()` function</a> to create a custom image component that displays different source images based on media queries.

> Note: the component will automatically convert your .jpg files to .webp! 

```JSX

---
// Import the component and all the images you want to use with it
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

It is currently set up to 
1. accept 3 images (mobile, desktop and fallback) that can be not only different sizes, crops but also completely different assets, as demnnstrated here.
2. accept mobile and desktop media width if you want to adjust these sizes on a case by case basis.

You can of course adjust the sizes of attributes baased on your customization's needs directly in the component.


<a name="astroContentCollections"></a>

### Astro content collections

In `/src`, you will see a `content.config.ts` file. This is where you can configure [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/). This step is **not necessary**, but it will supercharge your Astro pages and content. Collections help to 
  * organize your documents, 
  * validate your frontmatter, 
  * provide automatic TypeScript type-safety for all of your content,

This template already has Content Collections configured for immediate use of the blog content, but you could use them to power up the Portfolio or Gallery for example.

<a name="preloadingimages"></a>

### Preloading images
THis kit takes advantage of the [preload attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload) to fetch images above the fold with higher priority, resulting in improved performances and reducing flashes of unstyled content. Preloaded images are used on the index page for the hero image as well as on all other pages in the Landing component.

You will notice this snippet at the top of every `.astro` page:

```jsx
---
// Optimize our landing image and pass it as props to the BaseLayout (for preloading) and Landing (for rendering)
import {getOptimizedImage} from "../js/utils"
import landingImage from "../assets/images/landing.jpg" // <-- THE PATH TO THE ASSET YOU WANT TO PRELOAD - The asset must live in src
const optimizedImage = await getOptimizedImage(landingImage)
---
```

You only need to change the path of the asset you want to preload. The rest is managed behind the scenes.


<a name="deployment"></a>

## Deployment
0. Before you deploy, it is recommended to test the build. Run `npm run build` to build the project. Once done, run `npm run preview` which you can access on http://localhost:4321/. This allows you to test your website as if it was deployed on your host.
1. Ensure the astro.config.mjs, client.json, robots.txt and \_redirects have been filled out and updated. 
2. Netlify is the recommended hosting provider. If you choose another one, make sure to modify the `_redirects` code to handle the 404 page. 
Navigate to your Netlify Admin Panel, click _Add new site | Import an existing project_
3. Follow the instructions to connect your GitHub repository to Netlify and deploy.


<a name="acknowledgments"></a>

## Acknowledgments

The author would like to acknowledge:
* [Cedar Studios](https://github.com/cedar-studios) - Their [Intermediate-Astro-Kit-LESS](https://github.com/cedar-studios/Intermediate-Astro-Kit-LESS/tree/master) is the base of this template.
* [CodeStitch](https://codestitch.app/) - The UI was built with their stitches.
* [Starlight](https://starlight.astro.build/) - The ThemeProvider and Select components are derived from Starlight



<a name="Conclusion"></a>

## Conclusion
I hope that this kit will prove useful to you. If you have any questions or would like to connect, feel free to reach out on [Twitter](https://twitter.com/BuckyBuck135) or at `buckybuck` on Discord.

Happy coding!
***Geoffrey***
