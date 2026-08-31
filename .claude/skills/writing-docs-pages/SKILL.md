---
name: writing-docs-pages
paths: docs/**
description: Use when creating or editing a page in the HyperFormula documentation portal, adding a guide, or updating the API reference. Covers what is generated versus hand-written, sidebar registration, running the portal, and the writing rules.
---

## Generated versus hand-written

| Path | Source | Editable |
|---|---|---|
| `docs/guide/*.md` | Hand-written | yes |
| `docs/guide/built-in-functions.tmpl.md` | Hand-written template | yes |
| `docs/guide/built-in-functions.md` | Generated from the template + `src/interpreter/functionMetadata/` | **no — git-ignored** |
| `docs/api/` | Generated from JSDoc by TypeDoc | **no — git-ignored** |
| `docs/.vuepress/` | Configuration, theme, components | yes |
| `docs/examples/` | Code examples embedded in guides | yes |

To change what the functions page says about a function, edit its **catalogue entry** in `src/interpreter/functionMetadata/categories/`, then run `npm run docs:generate-function-docs`.

To change the API reference, edit the **JSDoc** in `src/`, then run `npm run typedoc:build-api`.

## Running the portal

```bash
npm run bundle-all   # the portal embeds the built engine
npm run docs:dev     # http://localhost:8080/hyperformula/
```

Both `docs:dev` and `docs:build` regenerate the functions page and the API reference first.

## Adding a guide

1. Create the file in `docs/guide/`.
2. **Register it in the sidebar** under `docs/.vuepress/`. A page without a sidebar entry builds successfully and is unreachable.
3. Link to the API reference for the detail rather than restating it.

## Writing rules

Follow [`DOCS_CONTENT_GUIDE.md`](../../../DOCS_CONTENT_GUIDE.md) for style, language, and structure. Beyond it:

- **Do not duplicate the API reference.** It is the primary source of truth and holds the detail. A guide gives the overview and links.
- **Describe HyperFormula's behaviour, not Excel's.** HyperFormula deliberately deviates in places. Verify against the implementation, and record any deviation in [`docs/guide/list-of-differences.md`](../../../docs/guide/list-of-differences.md).
- Every code example must run against the current version. Examples live in `docs/examples/`; `docs/code-examples-generator.sh` derives the JavaScript variants from the TypeScript ones.

## When docs are required

Any public-API change updates the JSDoc **and** the affected guides in the same change. Any user-facing behaviour change is documented. Any breaking change adds a migration-guide section. Documentation-only changes need no changelog entry.

See [`dev-docs/DOC-STANDARDS.md`](../../../dev-docs/DOC-STANDARDS.md).
