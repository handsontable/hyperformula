---
tags:
  - licenseKey
  - gpl-v3
  - licence key
  - invalid license key
  - expired license key
  - console warning
  - offline validation
---

# License key

To use HyperFormula, you need to specify which [license type](licensing.md#available-licenses) you use, by entering a license key in your [configuration options](configuration-options.md).

## GPLv3 license

If you use HyperFormula under [GNU General Public License v3.0](https://github.com/handsontable/hyperformula/blob/master/LICENSE.txt) (GPLv3), in your [configuration options](configuration-options.md), assign the mandatory `licenseKey` property to a string, `gpl-v3`:

```js
const options = {
  licenseKey: 'gpl-v3',
  //... other options
}
```

## Proprietary license

To use HyperFormula under a [proprietary license](licensing.md#proprietary-license), follow these steps:

1. Contact our [Sales Team](licensing.md#proprietary-license) to purchase a proprietary license.
2. Our Sales Team sends you your proprietary license key.
3. In your [configuration options](configuration-options.md), assign the mandatory `licenseKey` property to your proprietary license key:

```js
const options = {
  // replace xxxx-xxxx-xxxx-xxxx-xxxx with your proprietary license key:
  licenseKey: 'xxxx-xxxx-xxxx-xxxx-xxxx',
  //... other options
}
```

If your key is a few sentences of text followed by a block in square brackets (`[...]`), pass the
whole key, exactly as you received it. The key covers its text, so a key cut down to the bracketed
block, or with any word changed, is invalid. Whitespace and line breaks don't matter, including a
line break saved as `\n` in a `.env` file, but keeping the key on one line is the safest choice.

### Proprietary license key validation

::: tip
HyperFormula doesn't use an internet connection to validate your proprietary license key.
:::

Which versions of HyperFormula a key covers, and for how long, follows from the
terms of your contract. Your key carries those terms, and HyperFormula applies
them locally, without any connection to a server.

## Feature packages and add-ons

A proprietary license key may grant the whole library, or only part of it.

If your key grants only part of the library, then:

* A function your key doesn't include evaluates to a `#LIC!` error, in the same way as any other
  [error value](types-of-errors.md). Everything else in the sheet keeps calculating.
* An API method your key doesn't include throws a `LicenseCapabilityMissingError` when you call
  it. Getters never throw; `copy()` and `cut()` do, because they belong to the clipboard feature.
  The matching `isItPossibleTo*()` methods, such as `isItPossibleToAddRows()`, return `false`.
* [`getAvailableFunctions()`](../api/classes/hyperformula.md#getavailablefunctions) and
  [`getFunctionDetails()`](../api/classes/hyperformula.md#getfunctiondetails) describe only the
  functions your key includes, so a function picker built from them never offers a function that
  then fails.

## License key notifications

If your license key is missing, invalid, or expired, you see a
corresponding notification in the console.

A missing or invalid key blocks the library:

* Every function call evaluates to a `#LIC!` error, except `VERSION()` and `OFFSET()`.
* Every license-gated API method throws a `LicenseCapabilityMissingError` that names the key's
  state, for example: `License key is missing. Feature crud is not available.` The gated methods
  are the ones that edit cells, rows, columns, and sheets, `copy()`, `cut()`, `paste()`, `undo()`,
  `redo()`, `batch()`, `suspendEvaluation()`, and the methods that add, change, or remove named
  expressions. Building an engine with named expressions throws the same error.
* The `isItPossibleTo*()` methods return `false` for every gated method.
* Getters and clean-up methods, such as `clearClipboard()` and `resumeEvaluation()`, keep working,
  and `getAvailableFunctions()` still describes the full set of functions.

Depending on your license terms, an expired key either blocks the library in the same way, or keeps
working with what it grants and prints an error in the console.

## License key support

If you have any issues with your license key, [contact our team](contact.md).