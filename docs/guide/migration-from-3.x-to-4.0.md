---
title: "Migrating from 3.x to 4.0"
tags:
  - migration
  - migrate
  - upgrade
  - breaking changes
  - v4.0
  - gpl-v3
  - license key
  - "#LIC!"
---

To upgrade your HyperFormula version from 3.x.x to 4.0.0, follow this guide.

## The `gpl-v3` license key no longer works

HyperFormula 4.0.0 is available only under a commercial license. It no longer accepts the `gpl-v3` license key.

With `licenseKey: 'gpl-v3'`, HyperFormula 4.0.0 reads the key as invalid:

* Every function call evaluates to a `#LIC!` error, except `VERSION()` and `OFFSET()`.
* License-gated API methods throw a `LicenseCapabilityMissingError`.
* You see a warning in the console.

For details, see [Invalid license key](license-key.md#invalid-license-key).

### Get a license key

For a commercial license key or a free trial, contact us via [handsontable.com/pricing](https://handsontable.com/pricing/?tab=hyperformula).

Then, in your [configuration options](configuration-options.md), replace `gpl-v3` with your license key:

```js
const hf = HyperFormula.buildEmpty({
  // replace 'your-license-key' with your license key
  licenseKey: 'your-license-key',
});
```

### Keep using `gpl-v3`

To keep using the `gpl-v3` license key, don't upgrade: stay on HyperFormula 3.5.0, which won't be maintained any more.
HyperFormula 3.5.0 and earlier versions remain available under the GNU General Public License v3.0 (GPLv3).
