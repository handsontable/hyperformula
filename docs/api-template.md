Welcome to the HyperFormula `v{{ $page.version }}` API!

The API reference documentation provides detailed information for methods, error types, event types, and all the configuration options available in HyperFormula.

Current build: {{ $page.buildDate }}

### API reference index

The following sections explain shortly what can be found in the left sidebar navigation menu.

#### HyperFormula
This section contains information about the class for creating HyperFormula instance. It enlists all available public methods alongside their descriptions, parameter types, and examples.

The snippet shows an example how to use `buildFromArray` which is one of [three static methods](/api/classes/hyperformula.html#factories) for creating an instance of HyperFormula:
```javascript
const sheetData = [
  ['0', '=SUM(1, 2, 3)', '52'],
  ['=SUM(A1:C1)', '', '=A1'],
  ['2', '=SUM(A1:C1)', '91'],
];

const hfInstance = HyperFormula.buildFromArray(sheetData, options);
```

#### Configuration Options
This section contains information about options that allow you to configure the instance of HyperFormula.

An example set of options:
```javascript
const options = {
  licenseKey: 'gpl-v3',
  nullDate: { year: 1900, month: 1, day: 1 },
  functionArgSeparator: '.'
};
```

#### Event Types
In this section, you can find information about all events you can subscribe to.

For example, subscribing to `sheetAdded` event:

```javascript
const hfInstance = HyperFormula.buildFromSheets({
  MySheet1: [ ['1'] ],
  MySheet2: [ ['10'] ],
});

const handler = ( ) => { console.log('baz') }

hfInstance.on('sheetAdded', handler);

const nameProvided = hfInstance.addSheet('MySheet3');
```
