# Internationalization overview

Configure HyperFormula to work with your language and local conventions.

::: tip
By default HyperFormula uses en-GB locale (British English).
:::

**Contents:**
[[toc]]

## Overview

Internationalization support in HyperFormula includes:
- localization of function names and errors;
- different formats of:
  - date,
  - time,
  - numbers;
- custom currency symbols;
- string comparison conventions (including accents);
- compatibility with locale-dependent syntax differences in other spreadsheet software.


## Configuration

- language
- functionArgSeparator, decimalSeparator, thousandSeparator
- accentSensitive, localeLang (in the context of string comparison)
- dateFormats, timeFormats, parseDateTime, stringifyDateTime, stringifyDuration (date/time format), link to guide about date/time formats
- currencySymbol

- `language: 'enUS'` (add this language and make sure there are no differences in function names between 'enGB' and 'enUS')
- `dateFormats: ['MM/DD/YYYY', 'MM/DD/YY']`
- make sure `timeFormats: ['hh:mm', 'hh:mm:ss.sss']` accepts AM/PM notation, add this information to the API reference
- `decimalSeparator` cannot be set to `,` because it must be different from `functionArgSeparator`
- `localeLang: 'en-US'` (make sure it works)

Full config for Excel (enUS) -> link to compatibility

## Demo

This demo presents the configuration of HyperFormula for en-US locale.

// TODO correct link
<iframe src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/2.1.x/basic-operations?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview" style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;" title="handsontable/hyperformula-demos: basic-operations" allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking" sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>
