---
name: writing-docs-pages
paths: docs/**
description: Use when creating or editing a page in the HyperFormula documentation portal, adding a guide, or updating the API reference. Covers what is generated versus hand-written, sidebar registration, running the portal, and the writing rules.
---

What the portal contains, what is generated, and how to add a page are in [`docs/README.md`](../../../docs/README.md). The rules that govern documentation anywhere in the repository are in [`DOC-STANDARDS.md`](../../../dev-docs/DOC-STANDARDS.md). Writing style is [`DOCS_CONTENT_GUIDE.md`](../../../DOCS_CONTENT_GUIDE.md).

## Change the source, not the output

| To change | Edit | Then run |
|---|---|---|
| What the functions page says about a function | its catalogue entry in `src/interpreter/functionMetadata/categories/` | `npm run docs:generate-function-docs` |
| The API reference | the JSDoc in `src/` | `npm run typedoc:build-api` |
| A guide | the file in `docs/guide/` | `npm run docs:dev` |

`docs/guide/built-in-functions.md` and `docs/api/` are git-ignored build output. Editing them is always wrong, and the edit disappears on the next build.

## Run it

```bash
npm run bundle-all   # the portal embeds the built engine
npm run docs:dev     # http://localhost:8080/hyperformula/
```

## Before you finish

- A new page needs a sidebar entry under `docs/.vuepress/`, or it builds and is unreachable.
- Link to the API reference for detail rather than restating it.
- Verify any behavioural claim against the implementation. Where HyperFormula deviates from Excel, record it in [`docs/guide/list-of-differences.md`](../../../docs/guide/list-of-differences.md).
