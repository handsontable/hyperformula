# Building

The build process is using Webpack and Babel and as well as npm tasks listed in package.json. During this process, the source located in the `src/*` directory is transformed into the output files.

For UMD versions which are used in CDN:

* `./dist/hyperformula.js` - a full version which does not have dependencies, they need to be added manually
* `./dist/hyperformula.min.js` - a minified version which does not have  dependencies, they need to be added manually
* `./dist/hyperformula.full.js` - a full version with dependencies
* `./dist/hyperformula.full.min.js` - a minified version with dependencies

There are also versions of builds in CommonJS, ES6, and TypeScript definitions. They are marked in the package.json file. Based on the tools used - Webpack, parsers, etc. a proper build will be respectively chosen.

The library is developed in TypeScript and the exact configuration options can be found in `tsconfig.json`. To run the commands you need to set up your environment to have `npm` or `yarn` properly installed. After that, navigate to the project and run `npm install`.

### Build the project

To build the project you can use the following commands:

* **`npm run bundle-all`**  - generates development and production builds, verifies the version;
* **`npm run bundle:es`** - transpiles files into the `import/export` format , builds ES6 version;
* **`npm run bundle:cjs`** - builds commonJS version;
* **`npm run bundle:development`** - generates development build;
* **`npm run bundle:production`** - generates production build;
* **`npm run bundle:typings`** - generates TS typing, only emits ‘.d.ts’ declaration files.

### Verify the build

By using the following commands you can verify the build:

* **`verify-bundles`** - runs all verify commands;
* **`verify:umd`** - verifies umd version;
* **`verify:umd:min`** - verifies umd minified version without dependencies;
* **`verify:umd:full`** - verifies umd version with dependencies;
* **`verify:umd:full.min`** - verifies minified umd version with dependencies;
* **`verify:publish-package`** -  checks if npm builds the package correctly.

### Build the documentation

Most likely, you will want to document the code, so you can use the following commands to generate the documentation:

* **`npm run docs`** - builds HyperFormula and then, all of the docs;
* **`npm run docs:api` -** builds API part of the documentation;
* **`npm run docs:dev`** - runs development build of docs;
* **`npm run docs:build`** - builds the docs.

