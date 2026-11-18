---
title: "Migrating from 3.x to 4.0"
tags:
  - migration
  - migrate
  - upgrade
  - breaking changes
  - v4.0
  - language packs
---

To upgrade your HyperFormula version from 3.x.x to 4.0.0, follow this guide.

## Function names in the Polish and Turkish language packs

HyperFormula 4.0 changes two function names to the ones Microsoft Excel uses:

| Language pack | Name | 3.x | 4.0 |
|:--------------|:-----|:----|:----|
| `plPL` | `ROCZ.PRZYCH` | `PDURATION` | `DURATION` |
| `plPL` | `O.CZAS.TRWANIA` | `#NAME?` | `PDURATION` |
| `trTR` | `DEĞER` | `VALUE` | `PRICE` |
| `trTR` | `SAYIYAÇEVİR` | `#NAME?` | `VALUE` |

A Polish or Turkish formula with an old name now calls `DURATION` or `PRICE`, which take different arguments, so it returns `#N/A`. In the formulas you store in these languages, replace `ROCZ.PRZYCH` with `O.CZAS.TRWANIA`, and `DEĞER` with `SAYIYAÇEVİR`. Formulas in other languages are not affected.
