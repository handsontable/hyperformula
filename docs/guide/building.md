---
tags:
  - UMD
  - ESM
  - bundles
  - TypeScript typings
  - Jest
  - Karma
  - ESLint
---

# Building

The build process uses Webpack and Babel, as well as npm tasks
listed in package.json. During this process, the source located in
the `src/*` directory is transformed into the output files.

The library is developed in TypeScript and the exact configuration options can
be found in `hyperformula/tsconfig.json`.

This repository is an npm workspace: the engine is the `hyperformula` package, and
the documentation portal in `docs/` installs separately. From the repository root:

```bash
npm ci               # the engine and its toolchain
npm run docs:install # the documentation portal, only if you are building the docs
```

The commands below are the engine's own scripts. Run them from the repository
root, where each is forwarded to the package, or from `hyperformula/` directly.
Only `bundle-all` and the `test:*`, `verify:*` and `docs:*` entry points are
forwarded from the root; for anything else, add `--workspace=hyperformula` or
work inside `hyperformula/`.

## Output formats

The build produces the following output formats, all declared as
entry points in `package.json`:

* `commonjs/` - CommonJS modules (main entry, used by Node.js and bundlers)
* `es/` - ES modules (`.mjs` files, used by tree-shaking bundlers)
* `dist/` - UMD bundles for direct use in the browser
* `typings/` - TypeScript declaration files (`.d.ts`)

**For UMD versions which reside in CDN:**

* `./dist/hyperformula.js` - a full version which does not have
dependencies, they need to be added manually
* `./dist/hyperformula.min.js` - a minified version which does not
have  dependencies, they need to be added manually
* `./dist/hyperformula.full.js` - a full version with dependencies
* `./dist/hyperformula.full.min.js` - a minified version with
dependencies

## Build the project

To build the project you can use the following commands:

* `npm run bundle-all`  - generates development and production
builds, verifies the version. Forwarded from the repository root.

The individual steps are scripts of the `hyperformula` package, so run them with
`--workspace=hyperformula` from the root, or from inside `hyperformula/`:

* `npm run bundle:es` - transpiles files into the `import/export`
format , builds ES6 version
* `npm run bundle:cjs` - builds CommonJS version
* `npm run bundle:development` - generates development build
* `npm run bundle:production` - generates production build
* `npm run bundle:languages` - builds the languages
* `npm run bundle:typings` - generates TypeScript typing, only emits ‘.d.ts’ declaration files

We use the Node 22 LTS in the build-chain and recommend this version for building. Note that for using (not building) HyperFormula, a wider range of Node versions is supported.

## Verify the build

`npm run verify-bundles` is forwarded from the repository root; the individual
checks are package scripts, so run them with `--workspace=hyperformula` or from
inside `hyperformula/`:

* `verify-bundles` - runs all verify commands
* `verify:umd` - verifies UMD version
* `verify:umd:min` - verifies UMD minified version without dependencies
* `verify:umd:full` - verifies UMD version with dependencies
* `verify:umd:full.min` - verifies minified UMD version with dependencies
* `verify:cjs` - verifies CommonJS version with dependencies
* `verify:publish-package` -  checks if npm built the package correctly
* `verify:typings` - verifies TypeScript typings

## Build the documentation

Most likely, you will want to document the code. You can use the following commands to generate the documentation:

* `npm run docs:build` - builds the docs
* `npm run docs:dev` - serves the development version of the docs locally

## Run the tests

::: tip
HyperFormula main test suite is maintained outside of this repository. You can find more information [here](https://github.com/handsontable/hyperformula/blob/master/test/README.md).
:::

The tests are done with Jest and Karma. The same test suite should
pass in both of them because the library might be used
[server-side](server-side-installation) or in a browser, so you have
to be sure that both environments are fine.

* `npm run test` - runs the linter and all tests
* `npm run test:jest` - runs unit tests
  * To run a test suite that matches a word, add a Jest `-t` flag. For example: `npm run test:jest -- -t 'SUMIF'` runs only the tests that match the word `SUMIF` within `describe()` or `it()`.
  * To run a specific test suite, pass the file name. For example: `npm run test:jest 'function-sumif.spec.ts'` runs only the unit tests from the file `function-sumif.spec.ts`.
* `npm run test:browser` - runs tests in **karma** once and closes all open browsers
  * To run a specific `spec` file or a test suite you can add a Karma `--spec` flag. For example: `npm run test:browser.debug --workspace=hyperformula -- --spec=matrix.spec.ts` runs `matrix.spec.ts` browser tests only
* `npm run test:browser.debug --workspace=hyperformula` - runs test in **karma** only in Chrome until you exit the process. It watches changes in `src` and `test` directories and rebuilds them automatically. This one is not forwarded from the root.

## Run the linter

You can use the following commands to lint the code, so it meets the required standards. ESLint is used as the tool of choice in this case.

* `npm run lint` - lints the code
* `npm run lint:fix` - automatically fixes lint problems
