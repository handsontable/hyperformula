<br>
<p align="center">
  <a href="https://handsontable.github.io/hyperformula/">
    <img src="https://raw.githubusercontent.com/handsontable/hyperformula/master/github-hf-logo-blue.svg" width="350" height="71" alt="HyperFormula - A headless spreadsheet, a parser and evaluator of Excel formulas"/>
  </a>
</p>

<p align="center">
  <strong>A headless spreadsheet • A parser and evaluator of Excel formulas</strong>
</p>

<p align="center">
  <a href="https://github.com/handsontable/hyperformula/actions?query=workflow%3ATest+branch%3Amaster"><img src="https://img.shields.io/github/workflow/status/handsontable/hyperformula/Test" alt="GitHub Workflow Status"></a>
  <a href="https://app.fossa.io/projects/git%2Bgithub.com%2Fhandsontable%2Fhyperformula?ref=badge_shield"><img src="https://app.fossa.io/api/projects/git%2Bgithub.com%2Fhandsontable%2Fhyperformula.svg?type=shield" alt="FOSSA Status"></a>
  <a href="https://lgtm.com/projects/g/handsontable/hyperformula/context:javascript"><img src="https://img.shields.io/lgtm/grade/javascript/g/handsontable/hyperformula.svg?logo=lgtm&amp;logoWidth=18" alt="Language grade: JavaScript"></a>
  <a href="https://snyk.io/test/github/handsontable/hyperformula?targetFile=package.json"><img src="https://snyk.io/test/github/handsontable/hyperformula/badge.svg?targetFile=package.json" alt="Known Vulnerabilities"></a>
  <a href="https://github.com/handsontable/hyperformula/graphs/contributors"><img src="https://img.shields.io/github/contributors/handsontable/hyperformula" alt="GitHub contributors"></a>
  <a href="https://codecov.io/gh/handsontable/hyperformula"><img src="https://codecov.io/gh/handsontable/hyperformula/branch/master/graph/badge.svg?token=5k9ZQv8azO" alt="codecov"></a>
</p>

---

HyperFormula is a headless spreadsheet built on top of TypeScript. It is a parser and evaluator of Excel formulas for web applications. You can use it in a browser or as a service, with Node.js as your back-end technology.
- High-speed Excel formula parsing and evaluating
- A library of [380+ built-in functions](https://handsontable.github.io/hyperformula/guide/built-in-functions.html) available in 16 languages
- Support for [custom functions](https://handsontable.github.io/hyperformula/guide/custom-functions.html)
- Function syntax [compatible with Excel and Google Sheets](https://handsontable.github.io/hyperformula/guide/known-limitations.html#google-sheets-and-microsoft-excel)
- [Support for Node.js](https://handsontable.github.io/hyperformula/guide/server-side-installation.html#install-with-npm-or-yarn)
- Support for [undo/redo](https://handsontable.github.io/hyperformula/guide/undo-redo.html)
- Support for [CRUD operations](https://handsontable.github.io/hyperformula/guide/basic-operations.html)
- Support for [clipboard](https://handsontable.github.io/hyperformula/guide/clipboard-operations.html)
- Support for [named expressions](https://handsontable.github.io/hyperformula/guide/named-expressions.html)
- Support for [data sorting](https://handsontable.github.io/hyperformula/guide/sorting-data.html)
- Support for [React](https://handsontable.github.io/hyperformula/guide/integration-with-react.html), [Angular](https://handsontable.github.io/hyperformula/guide/integration-with-angular.html), and [Vue.js](https://handsontable.github.io/hyperformula/guide/integration-with-vue.html)
- Open-source license
- Actively maintained by the team that stands behind [Handsontable - JavaScript Data Grid](https://handsontable.com/)

## Documentation

- [Explainer video](https://www.youtube.com/watch?v=JJXUmACTDdk)
- [Installation](https://handsontable.github.io/hyperformula/guide/client-side-installation.html)
- [Basic usage](https://handsontable.github.io/hyperformula/guide/basic-usage.html)
  - [Demo with React](https://handsontable.github.io/hyperformula/guide/integration-with-react.html)
  - [Demo with Angular](https://handsontable.github.io/hyperformula/guide/integration-with-angular.html)
  - [Demo with Vue.js](https://handsontable.github.io/hyperformula/guide/integration-with-vue.html)
- [API Reference](https://handsontable.github.io/hyperformula/api/)
- [Configuration options](https://handsontable.github.io/hyperformula/guide/configuration-options.html)
- [List of built-in functions](https://handsontable.github.io/hyperformula/guide/built-in-functions.html)
- [Key concepts](https://handsontable.github.io/hyperformula/guide/key-concepts.html)

## Installation and usage

Install the library from [npm](https://www.npmjs.com/package/hyperformula):

```bash
npm install hyperformula
```

Once installed, you can use it like this:

```js
import { HyperFormula } from 'hyperformula';

// define the options
const options = {
  licenseKey: 'gpl-v3',
};

// define the data
const data = [['10', '20', '30', '=SUM(A1:C1)']];

// build an instance with defined options and data 
const hfInstance = HyperFormula.buildFromArray(data, options);

// call getCellValue to get the calculation results
const mySum = hfInstance.getCellValue({ col: 3, row: 0, sheet: 0 });

// print the result in the browser's console
console.log(mySum);
```

[Run this code in CodeSandbox](https://codesandbox.io/s/github/handsontable/hyperformula-demos/tree/develop/basic-usage)

## What can it be used for?

HyperFormula doesn't assume any existing user interface, making it a great general-purpose library that can be used in various business applications. Here are some examples:

- Spreadsheets
- Business logic builders
- Forms and form builders
- Computation notebooks
- Smart documents
- Educational apps
- Online calculators

## Contributing

Help us build the fastest and most flexible calculation engine for
business web apps. Please read the [Contributing Guide](https://handsontable.github.io/hyperformula/guide/contributing.html) before making a pull request.

## License

HyperFormula is available under the open source license ([GPLv3](https://github.com/handsontable/hyperformula/blob/master/gpl-3.0.txt)).

To buy a commercial license, please write to us at sales@handsontable.com

## Copyrights
© 2022 [Handsoncode](https://handsontable.com)
