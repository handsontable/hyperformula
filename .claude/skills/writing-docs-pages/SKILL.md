---
name: writing-docs-pages
paths: docs/**
description: Use when creating or editing a page in the HyperFormula documentation portal, adding a guide, or updating the API reference. Covers what is generated versus hand-written, sidebar registration, running the portal, and the writing rules.
---

## 1. Read the relevant files from `dev-docs/`

| File | Why |
|---|---|
| [`DOC-STANDARDS.md`](../../../dev-docs/DOC-STANDARDS.md) | When documentation is required, what must not duplicate the API reference, and describing HyperFormula rather than Excel |
| [`FUNCTION-CATALOGUE.md`](../../../dev-docs/FUNCTION-CATALOGUE.md) | Only when the change concerns the built-in functions page, which is generated from the catalogue |
| [`BUILD.md`](../../../dev-docs/BUILD.md) | Which documentation files are generated, by which command |

And two files outside `dev-docs/`: [`docs/README.md`](../../../docs/README.md) for what the portal contains and how to run it, and [`DOCS_CONTENT_GUIDE.md`](../../../DOCS_CONTENT_GUIDE.md) for writing style and guide structure.

## 2. Change the source, not the output

| To change | Edit | Then run |
|---|---|---|
| What the functions page says about a function | its catalogue entry in `src/interpreter/functionMetadata/categories/` | `npm run docs:generate-function-docs` |
| The API reference | the JSDoc in `src/` | `npm run typedoc:build-api` |
| A guide | the file in `docs/guide/` | `npm run docs:dev` |

`docs/guide/built-in-functions.md` and `docs/api/` are git-ignored build output. Editing them is always wrong, and the edit disappears on the next build.

## 3. Run the portal

```bash
npm run bundle-all   # the portal embeds the built engine
npm run docs:dev     # http://localhost:8080/hyperformula/
```

## 4. Before you finish

- A new page needs a sidebar entry under `docs/.vuepress/`, or it builds and is unreachable.
- Link to the API reference for detail rather than restating it.
- Verify any behavioural claim against the implementation. Where HyperFormula deviates from Excel, record it in [`docs/guide/list-of-differences.md`](../../../docs/guide/list-of-differences.md).
