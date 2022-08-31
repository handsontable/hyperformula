# HyperFormula documentation

HyperFormula comes with a dedicated, regularly-updated documentation portal.

View the documentation's latest production version at https://handsontable.com/docs/hyperformula.

## About HyperFormula documentation

The HyperFormula documentation is built with [VuePress](https://vuepress.vuejs.org/), a Vue-powered Static Site Generator.

When editing the docs, you can use features described [here](https://vuepress.vuejs.org/guide/markdown.html).

## Getting started with HyperFormula documentation

To start a local HyperFormula docs server:

1. Make sure you're running [Node.js](https://nodejs.org/en/) 14+.
2. From the main `hyperformula` directory, install the docs dependencies:
    ```bash
    npm install
    ```
3. From the main `hyperformula` directory, build HyperFormula:
   ```bash
   npm run bundle-all
   ```
4. From the main `hyperformula` directory, create a dev build of the docs and start your local docs server:
   ```bash
   npm run docs:dev
   ```
5. In your browser, go to: http://localhost:8080/hyperformula/.

## HyperFormula documentation npm scripts

From the `hyperformula` directory, you can run the following npm scripts:

* `npm run docs:dev` - Starts a local docs server at http://localhost:8080/hyperformula/.
* `npm run docs:build` - Builds the docs output into `/docs/.vuepress/dist`.

## HyperFormula docs directory structure

```bash
docs                            # All documentation files
├── .vuepress                   # All VuePress files
│   ├── components              # Vue components
│   ├── dist                    # The docs output. Both the docs and the API reference are built into this folder.
│   ├── public                  # Public assets
│   ├── styles                  # Style-related files
│   ├── subtheme                # Subtheme files
│   ├── templates               # HTML templates
│   ├── config.js               # VuePress configuration
│   ├── enhanceApp.js           # VuePress app-level enhancements
│   └── highlight.js            # Code highlight configuration
├── api                         # The API reference files, generated automatically from JsDoc. Do not edit!
├── guide                       # The docs source files: Markdown content
├── api-template.md             # The API reference welcome page
├── index.md                    # The main docs portal welcome page
└── README.md                   # The file you're looking at right now!
```
