# Configuration options

HyperFormula can be customized through easy-to-setup `options`.

The only mandatory key is `licenseKey`. It has a
[dedicated section](license-key.md) in which you can find all allowed
types of key values.

Below you can see the example of a configuration object and the
static method called to initiate a new instance of HyperFormula.

[See the full list of available options &#8594;](../api/interfaces/configparams.html)

## Example

```javascript
// define options 
const options = {
    licenseKey: 'gpl-v3',
    precisionRounding: 9,
    nullDate: { year: 1900, month: 1, day: 1 },
    functionArgSeparator: '.'
};

// call the static method to build a new instance
const hfInstance = HyperFormula.buildEmpty(options);
```

## Numeric precision options

HyperFormula provides configurable numeric precision for financial calculations.
See the [Numeric precision guide](numeric-precision.md) for detailed information.

```javascript
import HyperFormula, { RoundingMode } from 'hyperformula';

const options = {
    licenseKey: 'gpl-v3',
    // Use high-precision decimal arithmetic (default)
    numericImplementation: 'precise',
    // Number of significant digits (default: 34)
    numericDigits: 34,
    // Rounding mode (default: ROUND_HALF_UP)
    numericRounding: RoundingMode.ROUND_HALF_UP,
};

const hfInstance = HyperFormula.buildEmpty(options);
```

| Option | Type | Default | Description |
|:-------|:-----|:--------|:------------|
| `numericImplementation` | `'precise'` \| `'native'` | `'precise'` | Numeric implementation (`'precise'` for exact decimal arithmetic, `'native'` for JavaScript numbers) |
| `numericDigits` | `number` | `34` | Number of significant digits (precise mode only) |
| `numericRounding` | `RoundingMode` | `ROUND_HALF_UP` | Default rounding mode (precise mode only) |