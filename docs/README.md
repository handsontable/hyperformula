# HyperFormula docs

HyperFormula comes with a dedicated, regularly-updated documentation portal.

View the docs' latest production version at https://handsontable.github.io/hyperformula/.

## About HyperFormula docs

The HyperFormula docs are built with [VuePress](https://vuepress.vuejs.org/), a Vue-powered Static Site Generator.

Our VuePress setup:

* Publishes the docs as a sleek, responsive single-page application (SPA).
* Boasts a great search engine.
* Lets us write the docs in Markdown (and use Vue inside Markdown!).
* [COMING SOON] Versions and deploys the docs together with the software.

## Getting started with HyperFormula docs

To start a local HyperFormula docs server:

1. Get the right npm version:
   * Later than 7.5
   * Earlier than 16.0
2. From the `hyperformula` directory, install the docs dependencies:
    ```bash
    npm install
    ```
3. From the `hyperformula` directory, start your local docs server:
   ```bash
   npm run docs:dev
   ```
4. In your browser, go to: http://localhost:8080/docs/.

## HyperFormula docs npm scripts

From the `hyperformula` directory, you can run the following npm scripts:

* `npm run docs:dev` - Starts a local docs server at http://localhost:8080/docs/.
* `npm run docs:api` - Generates the HyperFormula API reference into `/docs/api`.
* `npm run docs:build` - Builds the docs output into `/docs/.vuepress/dist`.
* `npm run docs` - Builds both the API reference and the docs output.

## HyperFormula docs directory structure

```bash
docs                            # All documentation files
├── .vuepress                   # All VuePress files
│   ├── components              # Vue components
│   ├── dist                    # The docs' output. The docs and the API reference are built into this folder.
│   ├── public                  # Public assets
│   ├── styles                  # Style-related files
│   ├── subtheme                # Subtheme files
│   ├── templates               # HTML templates
│   ├── config.js               # VuePress configuration
│   ├── enhanceApp.js           # VuePress app-level enhancements
│   └── highlight.js            # Code highlight configuration
├── api                         # API reference files, generated automatically from JsDoc. Do not edit!
├── guide                       # The docs' source files: Markdown content
├── api-template.md             # API reference welcome page
├── index.md                    # Docs portal welcome page
└── README.md                   # The file you're looking at right now!
```