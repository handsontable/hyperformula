---
title: "Migrating from 3.x to 4.0"
tags:
  - migration
  - migrate
  - upgrade
  - breaking changes
  - v4.0
  - "#CALC!"
  - language packs
---

To upgrade your HyperFormula version from 3.x.x to 4.0.0, follow this guide.

## The `#CALC!` error

HyperFormula 4.0 adds the `#CALC!` error (`ErrorType.CALC`). Like Microsoft Excel, HyperFormula returns it when a function cannot calculate its result, for example when the result would be an empty array. See [Types of errors](types-of-errors.md).

### Custom language packs

Every language pack must translate the new `CALC` error. The built-in language packs already do. A custom language pack without `errors.CALC` makes `registerLanguage()` throw a `MissingTranslationError`.

Add the entry to the `errors` object of your language pack:

```javascript
errors: {
  CALC: '#CALC!',
  // ...
},
```

If Microsoft Excel shows the error under a different name in your language, use that name instead, for example `#OBL!` in Polish.

### Functions that return `#CALC!`

| Function | Case | 3.x | 4.0 |
|:---------|:-----|:----|:----|
| `FILTER` | No value meets the conditions. | `#N/A` | `#CALC!` |
| `UNIQUE` | No row or column is kept: `exactly_once` is `TRUE` and every row or column occurs more than once. | `#N/A` | `#CALC!` |
| `SEQUENCE` | The number of rows or columns is between 0 and 1, so it truncates to 0. | `#VALUE!` | `#CALC!` |
| `CONCAT` | The result is longer than 32,767 characters. | `#VALUE!` | `#CALC!` |
| `TEXTJOIN` | The result is longer than 32,767 characters. | `#VALUE!` | `#CALC!` |

Formulas that handle these errors with `IFNA()` or `ISNA()` no longer catch them. Use `IFERROR()` or `ISERROR()` instead. Likewise, if your code checks a cell's error type, check for `ErrorType.CALC` in these cases.
