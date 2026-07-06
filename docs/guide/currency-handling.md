# Currency handling

HyperFormula treats currency through **two independent mechanisms**:

- **Currency input** — recognizing currency literals (e.g. `"100 zł"`) when they appear in cell values, so they become numeric values tagged as currency rather than strings. Controlled by [`currencySymbol`](../api/interfaces/configparams.md#currencysymbol).
- **Currency output** — rendering numbers as currency strings via the `TEXT` function. Simple `$`-prefixed formats work out of the box; richer locale-aware patterns plug in through [`stringifyCurrency`](../api/interfaces/configparams.md#stringifycurrency).

The two mechanisms are orthogonal — configure both for full coverage. HyperFormula ships with no currency data and no currency-library dependency, so you stay in control of which symbols are recognized and how they render.

## Currency input

By default, HyperFormula recognizes `$` as a currency symbol in cell input. To add more (for example Polish złoty), pass an array of recognized symbols to [`currencySymbol`](../api/interfaces/configparams.md#currencysymbol):

```javascript
const hf = HyperFormula.buildFromArray(
  [['100 zł', '=A1 * 1.23']],
  { currencySymbol: ['$', 'zł'] }
);

console.log(hf.getCellValue({ sheet: 0, col: 0, row: 0 }));            // 100
console.log(hf.getCellValueDetailedType({ sheet: 0, col: 0, row: 0 })); // 'NUMBER_CURRENCY'
console.log(hf.getCellValue({ sheet: 0, col: 1, row: 0 }));            // 123
```

Notes:

- The symbol can appear as a **prefix** (`"$100"`) or as a **suffix** (`"100 zł"`). Both forms are recognized.
- Each entry in `currencySymbol` is a literal string — no regular expressions. To support multiple locales, list every symbol you want recognized.
- Detected literals are exposed as numeric values; the currency tag is available via [`getCellValueDetailedType()`](../api/classes/hyperformula.md#getcellvaluedetailedtype) as `NUMBER_CURRENCY`.

`currencySymbol` controls **only** how HyperFormula parses input. It does not influence what the `TEXT` function returns — that is governed by the format string and the [`stringifyCurrency`](#currency-output) callback described below.

## Currency output

The `TEXT` function renders a number with a format string. HyperFormula's built-in number formatter handles the simplest currency-shaped patterns out of the box; richer patterns need a [`stringifyCurrency`](../api/interfaces/configparams.md#stringifycurrency) callback.

### Default behavior

With no `stringifyCurrency` configured, the built-in formatter handles simple `$`-prefixed formats — `"$0.00"`, `"$0"`, and `"$#.00"`:

```javascript
const hf = HyperFormula.buildFromArray([
  [1234.5, '=TEXT(A1, "$0.00")'],
  [1234.5, '=TEXT(A2, "$#.00")'],
]);

console.log(hf.getCellValue({ sheet: 0, col: 1, row: 0 })); // "$1234.50"
console.log(hf.getCellValue({ sheet: 0, col: 1, row: 1 })); // "$1234.50"
```

A non-`$` symbol used purely as a suffix (no thousands grouping, no decimal-comma) also passes through unchanged:

```javascript
const hf = HyperFormula.buildFromArray([[1234.5, '=TEXT(A1, "0.00 zł")']]);
console.log(hf.getCellValue({ sheet: 0, col: 1, row: 0 })); // "1234.50 zł"
```

Configure `stringifyCurrency` when your formula corpus needs more advanced currency formats. E.g.:

- thousands grouping (`"$#,##0.00"`),
- non-`$` symbols with grouping (`"[$€-2] #,##0.00"`, `"[$zł-415] #,##0.00"`),
- locale-specific decimal separators (e.g. the Polish `"1234,50 zł"` pattern — the built-in formatter always emits `.` as the decimal),
- accounting two-section formats (`"$#,##0.00;($#,##0.00)"`).

### Custom currency formatting

The callback contract:

```ts
stringifyCurrency: (value: number, currencyFormat: string) => string | undefined
```

The function receives the raw number and the format string passed to `TEXT`. Return a formatted string to override the built-in formatter, or `undefined` to fall through to it.

#### Minimal example

```javascript
// Recognize "$..."-prefixed formats and ignore the rest:
const stringifyCurrency = (value, fmt) =>
  fmt.startsWith('$') ? `$${value.toFixed(2)}` : undefined;

const hf = HyperFormula.buildFromArray([
  [1234.5, '=TEXT(A1, "$#,##0.00")'],
], { stringifyCurrency });

console.log(hf.getCellValue({ sheet: 0, col: 1, row: 0 })); // "$1234.50"
```

This callback handles `$`-prefixed formats and falls through (returns `undefined`) for everything else. For any format the callback opts out of, HyperFormula proceeds to the next handler in the dispatch chain: the default date / duration formatters, then the built-in number formatter, and finally the raw format string if nothing matched.

#### Reference table

Side-by-side comparison of the default formatter, the docs adapter from the section below, and Excel:

| Format | Without callback | With adapter callback (section below) |
|---|---|---|
| `"$0.00"` | `"$1234.50"` | `"$1234.50"` |
| `"$#.00"` | `"$1234.50"` | `"$1234.50"` |
| `"$#,##0.00"` | `"$1235,##0.00"` (no grouping) | `"$1,234.50"` |
| `"[$€-2] #,##0.00"` | `"[$€-2] 1235,##0.00"` (no grouping) | `"1.234,50 €"` |
| `"$#,##0.00;($#,##0.00)"` (value `-1234.5`) | `"$-1235,##0.00;($#,##0.00)"` (no grouping) | `"($1,234.50)"` |

#### Error behavior

If your callback throws, HyperFormula propagates the exception. Wrap your formatter in `try/catch` if it can fail, and return `undefined` as the opt-out signal for unsupported formats — throwing is reserved for unexpected errors.

#### Example: `Intl.NumberFormat` adapter (zero dependencies)

This adapter handles a representative subset of Excel currency format strings using native [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat). Extend the `LCID_TO_LOCALE` map to cover more locales — see the [MS-LCID](https://learn.microsoft.com/openspecs/windows_protocols/ms-lcid) specification for canonical identifiers.

<!-- snippet:currency-adapter -->
```javascript
// Minimal Excel-format-string → Intl.NumberFormat adapter.
// Extend the LCID_TO_LOCALE map and CURRENCY_RULES list to cover more formats.

const LCID_TO_LOCALE = {
  '-409': { locale: 'en-US', currency: 'USD' },  // USD
  '-2':   { locale: 'de-DE', currency: 'EUR' },  // EUR (generic)
  '-411': { locale: 'ja-JP', currency: 'JPY' },  // JPY
  '-415': { locale: 'pl-PL', currency: 'PLN' },  // PLN
  '-809': { locale: 'en-GB', currency: 'GBP' },  // GBP
}

const CURRENCY_RULES = [
  // [$SYMBOL-LCID] #,##0[.00] — Excel's locale-tagged currency.
  // SYMBOL portion requires at least one character (`+`, not `*`) so that
  // locale-only modifiers like `[$-409]` (used on date/time formats) are
  // NOT misclassified as currency by this adapter.
  {
    pattern: /^\[\$([^\-\]]+)-([0-9A-Fa-f]+)\]\s*#,##0(\.0+)?$/,
    build: (match) => {
      const lcid = '-' + match[2]
      const fractionDigits = (match[3] || '.').length - 1
      const entry = LCID_TO_LOCALE[lcid] || { locale: 'en-US', currency: 'USD' }
      return new Intl.NumberFormat(entry.locale, {
        style: 'currency',
        currency: entry.currency,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      })
    },
  },
  // $#,##0.00 — USD shorthand
  {
    pattern: /^\$#,##0(\.0+)?$/,
    build: (match) => new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: (match[1] || '.').length - 1,
      maximumFractionDigits: (match[1] || '.').length - 1,
    }),
  },
]

// Accounting: $#,##0.00;($#,##0.00) — positive;negative with parentheses.
// Note: when both sections are plain (e.g. `$#,##0.00;$#,##0.00`), Excel
// honors the negative section AS-IS without auto-prepending `-` — the
// format author explicitly opted out of automatic sign. This adapter
// mirrors that behavior.
function tryAccountingFormat(value, format) {
  const sections = format.split(';')
  if (sections.length !== 2) return undefined
  const isNegative = value < 0
  const section = sections[isNegative ? 1 : 0]
  const parenMatch = /^\(\$#,##0(\.0+)?\)$/.exec(section)
  const plainMatch = /^\$#,##0(\.0+)?$/.exec(section)
  if (!parenMatch && !plainMatch) return undefined
  const fractionDigits = ((parenMatch || plainMatch)[1] || '.').length - 1
  const nf = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
  const formatted = nf.format(Math.abs(value))
  return isNegative && parenMatch ? `(${formatted})` : formatted
}

export const customStringifyCurrency = (value, currencyFormat) => {
  if (typeof currencyFormat !== 'string') return undefined
  const accounting = tryAccountingFormat(value, currencyFormat)
  if (accounting !== undefined) return accounting

  for (const rule of CURRENCY_RULES) {
    const match = rule.pattern.exec(currencyFormat)
    if (match) return rule.build(match).format(value)
  }
  // Not a recognized currency format — let HyperFormula fall through
  // to the built-in number formatter.
  return undefined
}
```
<!-- /snippet:currency-adapter -->

#### Limitations of the reference adapter

The adapter above is a compact, illustrative example — not a complete Excel format engine. Two things are worth calling out before you rely on it:

- **It uses each currency's CLDR locale conventions, not your HyperFormula config.** Output is produced by `Intl.NumberFormat`, so the thousands grouping and decimal separator come from the currency's locale (e.g. `pl-PL` → `1 234,50 zł`, `de-DE` → `1.234,50 €`). The adapter does **not** read HyperFormula's [`decimalSeparator`](../api/interfaces/configparams.md#decimalseparator) / [`thousandSeparator`](../api/interfaces/configparams.md#thousandseparator) config. If you need the currency output to honor those settings instead, use the [config-aware variant](#config-aware-variant) below.
- **It recognizes only a representative subset of format shapes.** It handles LCID-tagged formats (`[$SYM-LCID] #,##0.00`), `$`-shorthand (`$#,##0.00`), and simple two-section accounting (`$#,##0.00;($#,##0.00)`). For any other shape it returns `undefined`, so HyperFormula falls through to its built-in number formatter — which cannot expand `#,##0` thousands grouping nor interpret multi-section `;` formats, producing incorrect output for those patterns.

| Format string | Handled by the reference adapter? |
|---|---|
| `[$USD-409] #,##0.00` | Yes — LCID-tagged |
| `$#,##0.00` | Yes — `$`-shorthand |
| `$#,##0.00;($#,##0.00)` | Yes — two-section accounting |
| `$#,##0.00;[Red]($#,##0.00)` | No — color section `[Red]` not parsed |
| `$#,##0.00;-$#,##0.00` | No — explicit `-$` negative section not parsed |
| `#,##0.00;-#,##0.00` | No — multi-section without `$` not parsed |
| `#,##0.00 "zł"` | No — quoted-literal suffix not parsed |

For the "No" rows the adapter returns `undefined` and HyperFormula's built-in formatter takes over; because that formatter does not expand `#,##0` grouping or handle `;` sections, the rendered result will not match Excel. Extend `CURRENCY_RULES` (or swap in a format library — see [When to swap in a library](#when-to-swap-in-a-library)) if you need those shapes.

Then plug it into your [configuration options](configuration-options.md):

```javascript
const options = {
    stringifyCurrency: customStringifyCurrency,
}

const hf = HyperFormula.buildFromArray([
  [1234.5, '=TEXT(A1, "[$€-2] #,##0.00")'],
  [12345.5, '=TEXT(A2, "[$zł-415] #,##0.00")'],
  [-1234.5, '=TEXT(A3, "$#,##0.00;($#,##0.00)")'],
], options)
```

```javascript
console.log(hf.getCellValue({ sheet: 0, col: 1, row: 0 })) // "1.234,50 €"
console.log(hf.getCellValue({ sheet: 0, col: 1, row: 1 })) // "12 345,50 zł"
console.log(hf.getCellValue({ sheet: 0, col: 1, row: 2 })) // "($1,234.50)"
```

::: tip
The output values above contain non-breaking spaces (U+00A0 or U+202F depending on locale and ICU/CLDR version) as locale-appropriate separators. The comments show them as regular spaces for readability. When comparing programmatically, normalize with `.replace(/[  ]/g, ' ')` if you need ASCII-space output.
:::

#### What is an LCID tag?

Excel can mark a currency format with a [Microsoft Locale Identifier](https://learn.microsoft.com/openspecs/windows_protocols/ms-lcid) (LCID) so the symbol carries locale context. The syntax is `[$SYMBOL-LCID]` followed by the number template — for example `[$zł-415] #,##0.00` means *"Polish złoty, hex LCID `415` = `pl-PL`"*, and `[$€-2] #,##0.00` means *"euro, generic"*. The adapter above parses the LCID to pick the matching `Intl.NumberFormat` locale and ISO 4217 currency code.

**Excel resolves LCID tags natively** — no extra configuration is required. For example, `[$€-2] #,##0.00` automatically uses European grouping and decimal separators and produces `1.234,50 €`; `[$zł-415] #,##0.00` uses `pl-PL` and produces `1 234,50 zł`. HyperFormula's built-in formatter does not resolve LCID tags; the adapter above replicates that behavior via `Intl.NumberFormat`.

#### When to swap in a library

The adapter above covers a small but representative subset of Excel currency format strings (LCID-tagged, USD shorthand, accounting two-section) in under one page of code, with a fall-through path for everything else. If you need:

- Arbitrary Excel-style format strings beyond this subset,
- Precision-safe arithmetic on currency values (e.g. cents as integers),
- ISO 4217 currency metadata for dozens of currencies,

consider wrapping [`Dinero.js` v2](https://v2.dinerojs.com/) or your own format library inside the callback. The contract is the same: `(value: number, currencyFormat: string) => string | undefined`. Return `undefined` for any format string you don't want to handle and HyperFormula will fall back to its built-in number formatter.

#### Config-aware variant

The reference adapter above renders separators using each currency's CLDR locale (see [Limitations](#limitations-of-the-reference-adapter)). Use this variant instead if you want the currency output to honor the separators from your HyperFormula config: it wraps the same `Intl.NumberFormat` logic but post-processes the result so the thousands and decimal separators match the [`thousandSeparator`](../api/interfaces/configparams.md#thousandseparator) / [`decimalSeparator`](../api/interfaces/configparams.md#decimalseparator) you set on the engine.

`makeStringifyCurrency` is a small factory: pass it the same separators you configure on HyperFormula and it returns a `stringifyCurrency` callback.

```javascript
const LCID_TO_LOCALE = {
  '-409': { locale: 'en-US', currency: 'USD' },  // USD
  '-2':   { locale: 'de-DE', currency: 'EUR' },  // EUR (generic)
  '-411': { locale: 'ja-JP', currency: 'JPY' },  // JPY
  '-415': { locale: 'pl-PL', currency: 'PLN' },  // PLN
  '-809': { locale: 'en-GB', currency: 'GBP' },  // GBP
}

// Factory: build a stringifyCurrency that honors HyperFormula's configured
// separators instead of the currency locale's CLDR defaults.
export function makeStringifyCurrency({ decimalSeparator = '.', thousandSeparator = ',' } = {}) {
  // Swap the locale's own group/decimal separators for the configured ones.
  // A space placeholder avoids a multi-character swap re-colliding.
  const reseparate = (formatted, locale) => {
    const parts = new Intl.NumberFormat(locale).formatToParts(11111.1)
    const localeGroup = (parts.find((p) => p.type === 'group') || {}).value
    const localeDecimal = (parts.find((p) => p.type === 'decimal') || {}).value
    let out = formatted
    if (localeGroup) out = out.split(localeGroup).join(' ')
    if (localeDecimal) out = out.split(localeDecimal).join(decimalSeparator)
    return out.split(' ').join(thousandSeparator)
  }

  const formatWith = (value, locale, currency, fractionDigits) => {
    const nf = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })
    return reseparate(nf.format(value), locale)
  }

  return (value, currencyFormat) => {
    if (typeof currencyFormat !== 'string') return undefined

    const lcidMatch = /^\[\$([^\-\]]+)-([0-9A-Fa-f]+)\]\s*#,##0(\.0+)?$/.exec(currencyFormat)
    if (lcidMatch) {
      const fractionDigits = (lcidMatch[3] || '.').length - 1
      const entry = LCID_TO_LOCALE['-' + lcidMatch[2]] || { locale: 'en-US', currency: 'USD' }
      return formatWith(value, entry.locale, entry.currency, fractionDigits)
    }

    const usdMatch = /^\$#,##0(\.0+)?$/.exec(currencyFormat)
    if (usdMatch) {
      const fractionDigits = (usdMatch[1] || '.').length - 1
      return formatWith(value, 'en-US', 'USD', fractionDigits)
    }

    // Not a recognized currency format — fall through to the built-in formatter.
    return undefined
  }
}
```

Configure it with the same separators you pass to HyperFormula:

```javascript
const decimalSeparator = ','
const thousandSeparator = ' '

const options = {
  decimalSeparator,
  thousandSeparator,
  stringifyCurrency: makeStringifyCurrency({ decimalSeparator, thousandSeparator }),
}

const hf = HyperFormula.buildFromArray([
  [1234.5, '=TEXT(A1, "$#,##0.00")'],
  [12345.5, '=TEXT(A2, "[$zł-415] #,##0.00")'],
], options)
```

```javascript
console.log(hf.getCellValue({ sheet: 0, col: 1, row: 0 })) // "$1 234,50"
console.log(hf.getCellValue({ sheet: 0, col: 1, row: 1 })) // "12 345,50 zł"
```

Because the separators are taken from the factory arguments rather than the currency locale, configuring the engine with comma-decimal / space-thousands produces `1 234,50`-style output regardless of which currency's locale `Intl` selected. The same opt-out rule applies: any format the factory does not recognize returns `undefined` and HyperFormula falls back to its built-in number formatter.

## Related configuration

- [`stringifyDateTime`](../api/interfaces/configparams.md#stringifydatetime) / [`stringifyDuration`](../api/interfaces/configparams.md#stringifyduration) — sister callbacks for date and duration formatting. Combine with `stringifyCurrency` when your formulas mix date/time and currency formats.
