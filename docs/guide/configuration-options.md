---
title: "Configuration options"
description: "Customize HyperFormula with configuration options passed when you create an instance, including the required license key."
tags:
  - settings
  - configure
  - ConfigParams
  - buildEmpty
---

HyperFormula can be customized through easy-to-setup `options`.

The only mandatory key is `licenseKey`. To learn how to set it and what depends on it, see
[License key](license-key.md).

Below you can see the example of a configuration object and the
static method called to initiate a new instance of HyperFormula.

[See the full list of available options &#8594;](../api/interfaces/configparams.html)

## Example

```javascript
// define options 
const options = {
    // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/?tab=hyperformula
    precisionRounding: 9,
    nullDate: { year: 1900, month: 1, day: 1 },
    functionArgSeparator: '.'
};

// call the static method to build a new instance
const hfInstance = HyperFormula.buildEmpty(options);
```