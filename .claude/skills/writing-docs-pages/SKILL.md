---
name: writing-docs-pages
description: Use when creating or editing a page in the HyperFormula documentation portal, adding a guide, or updating the API reference. Covers what is generated versus hand-written, sidebar registration, running the portal, and the writing rules.
---

## 1. Read the relevant files from `dev-docs/`

| File | Why |
|---|---|
| [`DOCS-CONTENT-GUIDE.md`](../../../dev-docs/DOCS-CONTENT-GUIDE.md) | How to write the page: structure, chunking, language, code examples, site conventions, and the self-review checklist to run before finishing |
| [`DOC-STANDARDS.md`](../../../dev-docs/DOC-STANDARDS.md) | When documentation is required, which files are generated, describing HyperFormula rather than Excel, and the portal's rules |
| [`FUNCTION-CATALOGUE.md`](../../../hyperformula/dev-docs/FUNCTION-CATALOGUE.md) | Only when the change concerns the built-in functions page, which is generated from the catalogue |

And [`docs/README.md`](../../../docs/README.md), for what the portal contains and how to run it.

## 2. Work through them in order

1. Change the source, not the output — [Generated files](../../../dev-docs/DOC-STANDARDS.md#generated-files).
2. Write the page — [`DOCS-CONTENT-GUIDE.md`](../../../dev-docs/DOCS-CONTENT-GUIDE.md), [Describing behaviour](../../../dev-docs/DOC-STANDARDS.md#describing-behaviour), and [The documentation portal](../../../dev-docs/DOC-STANDARDS.md#the-documentation-portal), sidebar entry included.
3. Run the portal and look at the page — [`docs/README.md`](../../../docs/README.md).
4. Run the self-review checklist at the end of [`DOCS-CONTENT-GUIDE.md`](../../../dev-docs/DOCS-CONTENT-GUIDE.md#self-review-checklist-run-before-finishing-any-page).
