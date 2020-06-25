Welcome to HyperFormula `v{{ $page.version }}` API!

The API reference documentation provides detailed information for methods available in HyperFormula.

Current build: {{ $page.buildDate }}

### API reference index

#### HyperFormula
This section contains information about the class for creating HyperFormula instance. It enlists all available public methods alongside their descriptions, parameter types, and examples.

The snippet shows an example of a static method: the `buildFromArray` along with sample data and configuration:
```
const sheetData = [
 ['0', '=SUM(1,2,3)', '52'],
 ['=SUM(A1:C1)', '', '=A1'],
 ['2', '=SUM(A1:C1)', '91'],
];

const hfInstance = HyperFormula.buildFromArray(sheetData, options);
```

<h2>Event Types</h2>
In this section you can find information about listeting to events.

For example:

```
const hfInstance = HyperFormula.buildFromSheets({
 MySheet1: [ ['1'] ],
 MySheet2: [ ['10'] ],
});
const nameProvided = hfInstance.addSheet('MySheet3');
const generatedName = hfInstance.addSheet();
```
will trigger `sheetAdded` event.

<h2>Configuration Options</h2>
This section contains information about options which allow to configure the instance of HyperFormula.

An example set of options:
```
const options = {
    licenseKey: 'agpl-v3',
    precisionRounding: 10,
    nullDate: { year: 1900, month: 1, day: 1 },
    functionArgSeparator: '.'
};
```

<h2>Error types</h2>
This page is a list of errors thrown by HyperFormula instance.

Example error:
```
InvalidArgumentsError
```
