<a href="https://handsontable.github.io/hyperformula/">
<img src="./github-hf-logo-blue.svg" width="250" height="51" alt="HyperFormula"/>
</a>

### HyperFormula is an open source, spreadsheet-like calculation engine ⚡

## Description

HyperFormula allows you to perform spreadsheet-like calculations in your
web applications. It is written in TypeScript and supports all major
JavaScript frameworks. You can use it in a browser or as a service with
Node.js as your back-end technology.

The engine comes with a built-in, localized
[library of functions](https://handsontable.github.io/hyperformula/guide/built-in-functions.html)
grouped into different categories, and covers most user-triggered actions
such as [CRUD operations](https://handsontable.github.io/hyperformula/guide/basic-operations.html),
[undo/redo](https://handsontable.github.io/hyperformula/guide/undo-redo.html),
and [clipboard operations](https://handsontable.github.io/hyperformula/guide/clipboard-operations.html).
It also supports the use of cross-sheet references,
[named expressions](https://handsontable.github.io/hyperformula/guide/named-ranges.html),
different [data types](https://handsontable.github.io/hyperformula/guide/types-of-values.html),
and [custom functions](https://handsontable.github.io/hyperformula/guide/custom-functions.html).

## Documentation

- [Explainer video](https://www.youtube.com/watch?v=JJXUmACTDdk) /
[Blog post](https://handsontable.com/blog/articles/2020/6/introducing-hyperformula-fast-javascript-calculation-engine)
- Demos
  - [JavaScript](https://handsontable.github.io/hyperformula/guide/demo.html)
  - [React](https://handsontable.github.io/hyperformula/guide/integration-with-react.html)
  - [Vue.js](https://handsontable.github.io/hyperformula/guide/integration-with-vue.html)
  - Angular (coming soon)
- [Installation](https://handsontable.github.io/hyperformula/guide/client-side-installation.html)
- [Basic usage](https://handsontable.github.io/hyperformula/guide/basic-usage.html)
- [API Reference](https://handsontable.github.io/hyperformula/api/)
- [Configuration options](https://handsontable.github.io/hyperformula/guide/configuration-options.html)
- [List of built-in functions](https://handsontable.github.io/hyperformula/guide/built-in-functions.html)
- [Key concepts](https://handsontable.github.io/hyperformula/guide/key-concepts.html)
- [Contact](https://handsontable.github.io/hyperformula/guide/contact.html)

## Getting started

Install the library from [npm](https://www.npmjs.com/package/hyperformula):

```js
npm install hyperformula
```

Once properly installed, you can use it like this:

```js
import { HyperFormula } from 'hyperformula';

// define the options
const options = {
  licenseKey: 'agpl-v3',
  precisionRounding: 10
};

// define the data
const data = [['10', '20', '30' '=SUM(A1:C1)']];

// build an instance with defined options and data 
const hfInstance = HyperFormula.buildFromArray(data, options);

// call getCellValue to get the calculation results
const mySum = hfInstance.getCellValue({ col: 3, row: 0, sheet: 0 });

// print the result in the browser's console
console.log(mySum);
```

[View this code online](https://codesandbox.io/s/github/handsontable/hyperformula-demos/tree/develop/basic-usage)

## What can it be used for?

HyperFormula doesn't assume any existing user interface, which makes it
a great general-purpose library that can be used in various business
applications. Here are some examples:

- Smart documents
- Educational apps
- Computation notebooks
- Data grid components
- Business logic builders
- Forms and form builders
- Spreadsheets
- Online calculators
- Low connectivity apps

## Contributing

Help us to build the fastest and most flexible calculation engine for
business web apps. Please read the [Contributing Guide]() before
making a pull request.

Your help is much appreciated in any of the following topics:

- Making pull requests
  - Adding new functions
  - Adding new features
  - Improving the quality of the existing code
  - Improving performance
  - Improving documentation and public API
- Reporting bugs
- Suggesting improvements
- Suggesting new features

## License

HyperFormula is a triple-licensed software. You can use it under the
open source [AGPLv3 license](https://github.com/handsontable/hyperformula/blob/master/agpl-3.0.txt),
or a [free license](https://github.com/handsontable/hyperformula/blob/master/non-commercial-license.pdf)
in all your non-commercial projects. There is also a
[commercial license](https://handsontable.github.io/hyperformula/guide/contact.html),
and support services available.

## Authors

Created by [Handsontable](https://handsontable.com), [NavAlgo](https://www.navalgo.com/en/),
and [Contributors](https://github.com/handsontable/hyperformula/graphs/contributors).

© 2020 Handsoncode