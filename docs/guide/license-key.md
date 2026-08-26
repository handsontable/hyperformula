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

### Proprietary license key formats

Your proprietary license key is in one of two formats, and both work the same way:

* A classic key: 25 characters in five dash-separated groups, for example
  `1a2b3-4c5d6-7e8f9-0a1b2-3c4d5`.
* An entitlement key: a short, human-readable license text that ends with a machine-readable
  block in square brackets. Assign the whole text to the `licenseKey` option, or just the
  bracketed block — the block is the only part HyperFormula reads, so both work. The text around
  the block may be re-wrapped on its way to you (for example, by an email client) without
  affecting the key; the block itself has to arrive character for character.

### Proprietary license key validation

::: tip
HyperFormula doesn't use an internet connection to validate your proprietary license key.
:::

To determine whether a user is still entitled to use a particular
version of the software, HyperFormula compares the date in your
proprietary license key against one of two references, depending on
the license you purchased:
* The HyperFormula build date, when the key ends maintenance on a set
  date (versions released before that date keep working indefinitely)
* The current date (in UTC), when the key ends usage on a set date

This process doesn't require any connection to the server.

## Feature packages and add-ons

A proprietary license key may grant the whole library, or only part of it. If your key covers
everything you buy nothing new to think about, and neither does the GPLv3 key `gpl-v3`, which
always grants everything.

If your key grants only part of the library, then:

* A function your key doesn't include evaluates to a `#LIC!` error, in the same way as any other
  [error value](types-of-errors.md). Everything else in the sheet keeps calculating.
* An API method your key doesn't include throws a `LicenseCapabilityMissingError` when you call
  it. Getters never throw; `copy()` and `cut()` do, because they belong to the clipboard feature.
* [`getAvailableFunctions()`](../api/classes/hyperformula.md#getavailablefunctions) and
  [`getFunctionDetails()`](../api/classes/hyperformula.md#getfunctiondetails) describe only the
  functions your key includes, so a function picker built from them never offers a function that
  then fails.

Custom functions you register yourself are available whatever your key grants, as long as they use
an id of their own. The licence covers built-in ids, so a plugin registered under a built-in id your
key does not include is treated as that built-in and stays unavailable — it will not be described and
it evaluates to `#LIC!`. Pick an id the built-in catalogue does not use and this cannot happen.

Two commercial add-ons build on top of a package:

* **Spreadsheet Bundle** grants the CRUD API (adding, removing, and moving rows, columns, sheets,
  and cell contents), undo/redo, clipboard operations, and batching (`batch()` /
  `suspendEvaluation()`; `resumeEvaluation()` is deliberately never gated, so an engine can always
  leave a suspended state). It does not grant named expressions, which stay outside both add-ons.
* **Import/export** is reserved for a future release. HyperFormula doesn't have an import/export
  feature yet, so this add-on doesn't grant or restrict anything today.

In this release, not having either add-on doesn't restrict anything either: a key that names no
feature token at all is granted every feature area — CRUD, undo/redo, clipboard, named expressions
and batching — regardless of whether it names these add-ons. Every key issued today is of that
shape, so the add-on tokens describe what was sold rather than changing what the engine allows.

::: tip
To find out which package your key includes, check your order confirmation or
[contact our team](contact.md). HyperFormula deliberately reports nothing about the contents of
your key at runtime.
:::

## License key notifications

If your license key is missing, invalid, or expired, you see a
corresponding notification in the console.

In that case every licence-gated function call evaluates to a `#LIC!` error — but no API method
starts throwing, and `getAvailableFunctions()` still describes the full set of functions. A key
problem never narrows what the library reports it can do.

Arithmetic keeps working: operators such as `=A1+B1` are not function calls, so nothing gates them.
`VERSION()` and `OFFSET()` are function calls, but they are protected built-ins that sit outside the
licence system entirely, so they keep evaluating too. A sheet with a key problem therefore does not
go blank.

A **valid** key can print one notification too: if it expires on a set date and that date is
within the notice period your license carries, the console names the last day the key covers. It
is a heads-up only — nothing is restricted while a key is valid, and the message appears once.

## License key support

If you have any issues with your license key, [contact our team](contact.md).