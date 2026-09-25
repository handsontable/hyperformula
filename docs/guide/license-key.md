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
* [`getAvailableFunctions()`](../api/classes/hyperformula.md#getavailablefunctions) and
  [`getFunctionDetails()`](../api/classes/hyperformula.md#getfunctiondetails) describe only the
  functions your key includes, so a function picker built from them never offers a function that
  then fails.


## License key notifications

If your license key is missing, invalid, or expired, you see a
corresponding notification in the console.

In that case every licence-gated function call evaluates to a `#LIC!` error — but no API method
starts throwing, and `getAvailableFunctions()` still describes the full set of functions. A key
problem never narrows what the library reports it can do.

## License key support

If you have any issues with your license key, [contact our team](contact.md).