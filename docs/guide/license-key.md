---
title: "License key"
tags:
  - licenseKey
  - gpl-v3
  - licence key
  - invalid license key
  - expired license key
  - missing license key
  - "#LIC!"
  - console warning
  - offline validation
---

HyperFormula needs a license key. You pass it in the `licenseKey` [configuration option](configuration-options.md).

## Get a license key

To get a license key, visit [handsontable.com/pricing](https://handsontable.com/pricing/?tab=hyperformula) or email [sales@handsontable.com](mailto:sales@handsontable.com).

## Set the license key

In your [configuration options](configuration-options.md), set the `licenseKey` property to your license key:

```js
import { HyperFormula } from 'hyperformula';

const hf = HyperFormula.buildEmpty({
  // replace 'your-license-key' with your license key
  licenseKey: 'your-license-key',
});
```

If your key is a few sentences of text followed by a block in square brackets (`[...]`), pass the
whole key, exactly as you received it. The key covers its text, so a key cut down to the bracketed
block, or with any word changed, is invalid. Whitespace and line breaks don't matter, including a
line break saved as `\n` in a `.env` file, but keeping the key on one line is the safest choice.

### The license key in code examples

The code examples in this documentation don't contain a license key. Each one has this commented-out line instead:

```js
// licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/?tab=hyperformula
```

To run an example in your own project, uncomment the line and replace `your-license-key` with your license key.
Without a key, functions return `#LIC!` and license-gated methods, such as `addSheet()` and `copy()`, throw a `LicenseCapabilityMissingError`. See [Missing license key](#missing-license-key).

The live examples on handsontable.com run without a license key: HyperFormula doesn't check the license key on handsontable.com.

## License key validation

:::tip
HyperFormula doesn't use an internet connection to validate your license key.
:::

Which versions of HyperFormula a key covers, and for how long, follows from the
terms of your contract. Your key carries those terms, and HyperFormula applies
them locally, without any connection to a server.

HyperFormula reads the key every time you build an engine or change its configuration. If the key is missing, invalid, or
expired, you see a message in the console. Each case is described below.

## What depends on the license key

### Missing license key

If you don't set `licenseKey`, or set it to an empty string, the library is blocked and you see a warning in the console:

* Every function call evaluates to a `#LIC!` error, except `VERSION()` and `OFFSET()`.
* Every license-gated API method throws a `LicenseCapabilityMissingError` that names the key's
  state, for example: `License key is missing. Feature crud is not available. If you need any
  help, contact us at sales@handsontable.com.` The gated methods
  are the ones that edit cells, rows, columns, and sheets, `copy()`, `cut()`, `paste()`, `undo()`,
  `redo()`, `batch()`, `suspendEvaluation()`, and the methods that add, change, or remove named
  expressions. Building an engine with named expressions throws the same error.
* The `isItPossibleTo*()` methods return `false` for every gated method, and
  `isThereSomethingToUndo()` and `isThereSomethingToRedo()` return `false`.
* Getters and clean-up methods, such as `clearClipboard()` and `resumeEvaluation()`, keep working,
  and `getAvailableFunctions()` still describes the full set of functions.

Formulas without a function call, such as `=A1+B1`, keep calculating.

### Invalid license key

If HyperFormula can't read your key, or your key doesn't include HyperFormula, the key is invalid. The library is blocked in the same way as with a
[missing key](#missing-license-key), and you see a warning in the console.

The `gpl-v3` key is invalid. For details, see [Migrating from 3.x to 4.0](migration-from-3.x-to-4.0.md).

### Expired license key

If your key doesn't cover the version of HyperFormula you installed, or its term has ended, you see a message in the console.
Depending on your license terms, an expired key either blocks the library in the same way as a
[missing key](#missing-license-key), or keeps working with what it grants.

To keep using HyperFormula, renew your license key, or install a version that your key covers.

### Function or feature not included in your license key

A license key may grant the whole library, or only part of it.

If your key grants only part of the library, then:

* A function your key doesn't include evaluates to a `#LIC!` error, in the same way as any other
  [error value](types-of-errors.md). Everything else in the sheet keeps calculating.
* An API method your key doesn't include throws a `LicenseCapabilityMissingError` when you call
  it. Getters never throw; `copy()` and `cut()` do, because they belong to the clipboard feature.
  The matching `isItPossibleTo*()` methods, such as `isItPossibleToAddRows()`, return `false`,
  and so do `isThereSomethingToUndo()` and `isThereSomethingToRedo()` when your key doesn't
  include undo and redo.
* [`getAvailableFunctions()`](../api/classes/hyperformula.md#getavailablefunctions) and
  [`getFunctionDetails()`](../api/classes/hyperformula.md#getfunctiondetails) describe only the
  functions your key includes, so a function picker built from them never offers a function that
  then fails.

To get a key that includes more, see [Get a license key](#get-a-license-key).

## License key support

If you have any issues with your license key, [contact our team](contact.md).
