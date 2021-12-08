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
  ['0', '=SUM(1,2,3)', '52'],
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

#### Error Types
This page is a list of errors thrown by the HyperFormula instance that may be thrown depending on the method used.

An example of how you can handle an error: adding a sheet which name is already taken:
```javascript
// variable used to carry the message for the user
let messageUsedInUI;

// attempt to add a sheet
try {
  hfInstance.addSheet('MySheet1');

// whoops! there is already a sheet named 'MySheet1'
} catch (e) {

  // notify the user that a sheet with an ID of 5 does not exist
  if (e instanceof SheetNameAlreadyTakenError) {
     messageUsedInUI = 'Sheet name already taken';
  }
  // a generic error message, just in case
  else {
     messageUsedInUI = 'Something went wrong';
  }
}
```
