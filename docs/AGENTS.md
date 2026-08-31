# `docs/` — the documentation portal

A [VuePress](https://vuepress.vuejs.org/) site. Everything here is public, user-facing output.

## Layout

| Path | What it is | Editable |
|---|---|---|
| `guide/` | Hand-written guides | yes |
| `guide/built-in-functions.tmpl.md` | Template for the generated functions page | yes |
| `guide/built-in-functions.md` | **Generated** from the template plus the function metadata catalogue | **no — git-ignored** |
| `api/` | **Generated** from JSDoc by TypeDoc | **no — git-ignored** |
| `.vuepress/` | Configuration, theme, components, sidebar | yes |
| `examples/` | Code examples embedded in guides | yes |
| `code-examples-generator.sh` | Generates the JavaScript variants of TypeScript examples | yes |

## Never edit generated output

`docs/api/` comes from the JSDoc in `src/` — fix the JSDoc, then run `npm run typedoc:build-api`.

`docs/guide/built-in-functions.md` comes from `built-in-functions.tmpl.md` and the metadata catalogue in `src/interpreter/functionMetadata/` — fix the catalogue entry, then run `npm run docs:generate-function-docs`. It is git-ignored; never commit it.

A missing `docs/api/` folder means it has not been built yet. Run `npm run docs:build`.

## Writing

Follow [`DOCS_CONTENT_GUIDE.md`](../DOCS_CONTENT_GUIDE.md) for style, language, and guide structure. The rules that apply beyond the portal — JSDoc, changelog, migration guides — are in [`dev-docs/DOC-STANDARDS.md`](../dev-docs/DOC-STANDARDS.md).

Two rules worth repeating here:

- **Do not duplicate the API reference.** It holds the detail and is the primary source of truth. A guide gives the high-level overview and **links** to the reference.
- **Describe HyperFormula's behaviour, not Excel's.** Verify against the implementation, and record deviations in [`guide/list-of-differences.md`](guide/list-of-differences.md).

## Running it

```bash
npm run bundle-all   # the portal embeds the built engine
npm run docs:dev     # http://localhost:8080/hyperformula/
```

`docs:dev` and `docs:build` both regenerate the functions page and the API reference first. Details in [`README.md`](README.md) and [`dev-docs/BUILD.md`](../dev-docs/BUILD.md).

## Adding a guide

A new page needs a sidebar entry in `.vuepress/` as well as the file — otherwise it builds and is unreachable.

## Deployment

The portal is served by a Cloudflare Worker: `npm run docs:build:cf` composes the assets through `script/prepare-cf-assets.js`, then `docs:deploy:cf` or `docs:preview:cf` calls `wrangler`. The Worker entry point is [`worker/index.js`](../worker/index.js).
