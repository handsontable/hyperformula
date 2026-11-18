---
title: "Migrating from 3.x to 4.0"
tags:
  - migration
  - migrate
  - upgrade
  - breaking changes
  - v4.0
  - FILTER
---

To upgrade your HyperFormula version from 3.x.x to 4.0.0, follow this guide.

## The `FILTER` function

HyperFormula 4.0 reads the `include` argument of `FILTER`, its second argument, as Microsoft Excel does. Text in it returns `#VALUE!`, and an error in it is returned:

| Value in `include` | 3.x | 4.0 |
|:-------------------|:----|:----|
| `TRUE`, a non-zero number | The row is kept | The row is kept |
| `FALSE`, `0`, a blank cell | The row is dropped | The row is dropped |
| Text, such as `"x"` or the empty text `""` | The row is dropped | `#VALUE!` |
| The text `"TRUE"` | The row is kept | `#VALUE!` |
| An error, such as `#DIV/0!` | The row is dropped | The error |

If a condition column can hold text, for example `=IF(B1>0, TRUE(), "")`, return `FALSE()` instead of `""`. Conditions after `include`, which HyperFormula accepts in addition to Excel, still drop such rows.
