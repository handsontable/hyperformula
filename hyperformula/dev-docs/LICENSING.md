# License key handling

`hyperformula/src/license/` reads the license key, maps its capability tokens to built-in functions (`functionCapabilities.ts`) and to public API features (`featureCapabilities.ts`), and gates function calls and API methods.

A gated function or feature is gated on every path that reaches it, an alias included. A refused function call evaluates to `#LIC!`; a refused API method throws `LicenseCapabilityMissingError`. A path that bypasses the gate is a bug, unless the pull request records it as a deliberate decision.

## The license capability table

`hyperformula/src/license/functionCapabilities.ts` decides which license keys can call a built-in function. Add every new built-in either to its group in `FUNCTION_GROUPS` or, if it belongs to no group, to `UNGROUPED_FUNCTIONS`. An ungrouped function is granted only by `fun:all` and by its own `fun:<name>` token. Both lists use canonical names: an alias needs no entry, because it is gated as its canonical function.

A built-in missing from the table escapes the entitlement check: every key that lets formulas evaluate can call it, including a key that grants no functions. The completeness check in the private test suite (`unit/license/capability-registry.spec.ts`) fails on such a function, but the public smoke tests do not.

Group names are part of the license key format, so never rename a group or remove a function from one. Adding a function to a group grants it to every key that already carries that group's token.

## The vendored key reader

`hyperformula/src/license/handsontable-license-key-parser/` is a copy of the entitlement-key reader published by the `handsontable/license-key` repository, taken whole from a tagged release. Don't edit it: fix the problem upstream and take the copy again, as described in `PROVENANCE.md` in that directory. ESLint ignores the directory, and codecov leaves it out of the coverage statuses.

Nothing may live in it that upstream does not ship, other than the files `upstream.json` lists under `own_files`. That is why its `AGENTS.md`, which comes from upstream, has no `CLAUDE.md` symlink beside it.

`npm run check:license-key-parser-drift --workspace=hyperformula` compares the copy with the pinned upstream commit and fails on any difference or on a newer upstream tag. It needs read access to the upstream repository, so it runs in its own CI workflow (`.github/workflows/vendored-parser.yml`) rather than in `npm run test` or `npm run lint`.

## The license check skip on handsontable.com

On `handsontable.com` and its one-label subdomains, `resolveLicense()` reads no key: every key, a missing one included, resolves as valid and unrestricted, and prints nothing. That is how the live examples of the documentation run without a key. The test is `isLicenseCheckSkipped()` in `licenseResolution.ts`, the same as Handsontable's `_ignored()`: it reads `location.host`, so it never applies in Node, and it never matches a look-alike host. Its tests are Jest-only (`unit/license/domain-skip.spec.ts`), because Karma's browser has a `location` that cannot be replaced.

## The internal test key

Everything in the repository that builds an engine for a test, a build script, the docs build or the formula editor demo uses the HyperFormula internal test key: an entitlement key that grants `fun:all` and `feat:all`, for builds released on or before 2036-11-04. Its text says in capitals that it is not licensed for production. It is issued with `npm run generate-internal-test-key` in the private `handsontable/license-key` repository, from `HYPERFORMULA_INTERNAL_TEST_RECORD`.

The key is written out once per consumer, and nowhere else:

| Constant | Read by |
|---|---|
| `hyperformula/test/_setupFiles/testLicenseKey.ts` | the test bootstrap (the default `licenseKey` of every test engine), the smoke tests, the private test suite, `docs/script/generate-builtin-functions-doc.ts` |
| `hyperformula/script/test-license-key.js` | `script/check-file.js` |
| `docs/src/test-license-key.mjs` | `docs/src/docs-data.mjs`, and the preview builds of the docs |
| `hyperformula-ui/demo/shared/test-license-key.ts` | the formula editor demo, which the end-to-end suite runs |
| `performance/testLicenseKey.ts` in the private suite | the benchmarks and the compatibility check, which the performance workflow also runs against the base branch's engine |

`hyperformula/test/test-license-key.spec.js` fails when the constants disagree, or when the key appears in any other file. To renew the key, issue it again upstream and paste it into every constant.

A docs build on Cloudflare Workers Builds for any branch other than `master` is a preview: `docs/src/preview-license-key.mjs` writes the key into the script of every live example, after the pages are built, so the examples run on the preview URL. The code a page shows and the StackBlitz project keep the placeholder. Every build then checks its output: a production build must not hold the key anywhere, and a preview build only in the example scripts.
