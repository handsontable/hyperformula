# Building the engine

The command reference lives in the public guide, [`docs/guide/building.md`](../../docs/guide/building.md): output formats, every `bundle:*` and `verify:*` script, the test commands, and the linter. Read that first.

This page holds only what the guide does not cover. For installing the workspace, deploying the portal, and cutting a release, see [`dev-docs/BUILD.md`](../../dev-docs/BUILD.md).

## The intermediate build

`npm run compile` runs `tsc` into `hyperformula/lib/`. Every bundle reads `lib/`, not `hyperformula/src/`, so a bundle built without recompiling ships the previous source.

`npm run bundle-all` chains `clean`, `compile`, every `bundle:*`, then `verify-bundles`. The individual `bundle:*` scripts recompile first unless `HF_COMPILE=1` is set — `script/if-ne-env.js` is what skips the redundant recompile inside `bundle-all`.

`npm run clean` removes, inside `hyperformula/`, `coverage/`, `commonjs/`, `dist/`, `es/`, `languages/`, `lib/`, `typings/`, and `test-jasmine/`.

`languages/` — the standalone UMD language packs — is a build output like the rest, and is missing from the guide's list of output formats.

## License notices in the bundles

Every `dist/` bundle starts with a banner (`BannerPlugin` in `.config/webpack/base.js`): the repository's `LICENSE.txt`, the version and release date, then the license notice of every npm package with code in that bundle. The notices are read at build time from the installed packages' `package.json` and license file, so a new or updated dependency is covered without a code change. Today that is `core-js` (the polyfills Babel adds) and `webpack` (its module shims) in every bundle, plus `chevrotain`, `regexp-to-ast` and `tiny-emitter` in the `.full` bundles, which inline them. A bundled package without a license file fails the build.

The banner is a `/*!` comment, which Terser keeps in the `.min.js` files. The vendored code in `src/interpreter/plugin/3rdparty/` carries its own `@license` header instead. `script/check-file.js` expects exactly those two `@license` comments in each bundle, so the banner must not contain the word.

## Packaging

`npm run verify:publish-package` runs `npm pack` through `script/check-publish-package.js` and checks what would actually ship. `verify-bundles` is `run-p verify:**`, so it is part of every `bundle-all`; run it on its own whenever a change touches `package.json`, `.npmignore`, or the `exports`/`typings` surface without rebuilding everything.
