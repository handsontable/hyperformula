# Internationalization overview

::: tip
HyperFormula uses British locale by default.
:::

**Contents:**
[[toc]]

## Overview

TBP

- link to guide about function translations
- link to guide about date/time formats

## Configuration

- language
- functionArgSeparator, decimalSeparator, thousandSeparator
- accentSensitive, localeLang (in the context of string comparison)
- dateFormats, timeFormats, parseDateTime, stringifyDateTime, stringifyDuration (date/time format)
- currencySymbol

- `language: 'enUS'` (add this language and make sure there are no differences in function names between 'enGB' and 'enUS')
- `dateFormats: ['MM/DD/YYYY', 'MM/DD/YY']`
- make sure `timeFormats: ['hh:mm', 'hh:mm:ss.sss']` accepts AM/PM notation, add this information to the API reference
- `decimalSeparator` cannot be set to `,` because it must be different than `functionArgSeparator` (what about coercing strings to numbers?)
- `localeLang: 'en-US'` (make sure it works)

Full config for Excel (enUS) -> link to compatibility