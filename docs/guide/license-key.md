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

To determine whether a user is still entitled to use a particular
version of the software, HyperFormula compares the time between
two dates:
* The HyperFormula build date
* The date in your proprietary license key

This process doesn't require any connection to the server.

## Feature packages and add-ons

A proprietary license key may grant the whole library, or only part of it. If your key covers
everything you buy nothing new to think about, and neither does the GPLv3 key `gpl-v3`, which
always grants everything.

If your key grants only part of the library, then:

* A function your key doesn't include evaluates to a `#LIC!` error, in the same way as any other
  [error value](types-of-errors.md). Everything else in the sheet keeps calculating.
* An API method your key doesn't include throws a `LicenseCapabilityMissingError` when you call
  it. Methods that only read data never throw.
* [`getAvailableFunctions()`](../api/classes/hyperformula.md#getavailablefunctions) and
  [`getFunctionDetails()`](../api/classes/hyperformula.md#getfunctiondetails) describe only the
  functions your key includes, so a function picker built from them never offers a function that
  then fails.

Custom functions you register yourself are available whatever your key grants, as long as they use
an id of their own. The licence covers built-in ids, so a plugin registered under a built-in id your
key does not include is treated as that built-in and stays unavailable — it will not be described and
it evaluates to `#LIC!`. Pick an id the built-in catalogue does not use and this cannot happen.

::: tip
To find out which package your key includes, check your order confirmation or
[contact our team](contact.md). HyperFormula deliberately reports nothing about the contents of
your key at runtime.
:::

## License key notifications

If your license key is missing, invalid, or expired, you see a
corresponding notification in the console.

In that case every function call evaluates to a `#LIC!` error — but no API method starts throwing,
and `getAvailableFunctions()` still describes the full set of functions. A key problem never
narrows what the library reports it can do.

Arithmetic keeps working: operators such as `=A1+B1` are not function calls and are unaffected, as
are `VERSION()` and `OFFSET()`, which sit outside the licence system entirely. So a sheet with a
key problem does not go blank — it keeps producing values wherever no function is called.

## License key support

If you have any issues with your license key, [contact our team](contact.md).