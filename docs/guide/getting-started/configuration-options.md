# Configuration options

HyperFormula can be customized through easy-to-setup `options`. A full list of options, along with their descriptions and default values, are available in the configuration section of the API reference.

The only mandatory option is `licenseKey`. It has a [dedicated section](license-key.md) in which all possible types of keys are described.

Below you can see the example of a configuration object and the static method called to initiate a new instance of HyperFormula.

```javascript
// define options 
const options = {
    licenseKey: 'agpl-v3',
    precisionRounding: 10,
    nullDate: { year: 1900, month: 1, day: 1 },
    functionArgSeparator: '.'
};

// call the static method to build a new instance
const hfInstance = HyperFormula.buildEmpty(options);

```

