<a href="https://handsontable.github.io/hyperformula/">
<img src="./github-hf-logo-blue.svg" width="250" height="51" alt="HyperFormula"/>
</a>

### HyperFormula is an open source, spreadsheet-like calculation engine ⚡

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/handsontable/hyperformula/Test)](https://github.com/handsontable/hyperformula/actions?query=workflow%3ATest+branch%3Amaster)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fhandsontable%2Fhyperformula.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fhandsontable%2Fhyperformula?ref=badge_shield)
[![codecov](https://codecov.io/gh/handsontable/hyperformula/branch/master/graph/badge.svg?token=5k9ZQv8azO)](https://codecov.io/gh/handsontable/hyperformula)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/handsontable/hyperformula.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/handsontable/hyperformula/context:javascript)
[![Known Vulnerabilities](https://snyk.io/test/github/handsontable/hyperformula/badge.svg?targetFile=package.json)](https://snyk.io/test/github/handsontable/hyperformula?targetFile=package.json)
[![GitHub contributors](https://img.shields.io/github/contributors/handsontable/hyperformula)](https://github.com/handsontable/hyperformula/graphs/contributors)


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
  - [Vue](https://handsontable.github.io/hyperformula/guide/integration-with-vue.html)
  - [Angular](https://handsontable.github.io/hyperformula/guide/integration-with-angular.html)
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

Help us build the fastest and most flexible calculation engine for
business web apps. Please read the [Contributing Guide](https://handsontable.github.io/hyperformula/guide/contributing.html) before
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

HyperFormula is available under the [GPLv3 license](https://github.com/handsontable/hyperformula/blob/master/gpl-3.0.txt).

If you need a commercial license or support and maintenance services, [contact our Sales Team](https://handsontable.com/get-a-quote).

## Acknowledgments 

You should know that this project wouldn’t exist without co-financing from European Union funds under the European Regional Development Funds as a part of the Smart Growth Operational Programme. Project implemented as a part of the Polish National Centre for Research and Development: “Fast Track”.

- Name of the programme: Smart Growth Operational Programme 2014-2020
- Project name: “Development of the high-performance calculation engine for processing tabular data of the significant size on mobile devices and workstations using parallel computing and GPU.”
- Project number: POIR.01.01.01-00-0223/18-00
- Beneficiary: Handsoncode sp. z o.o.
- Total budget: PLN 1 117 275.87 (USD ~295 000)
- Amount of grant: PLN 771 807.73 (USD ~204 000)
- Duration: 2018-2019

![eu-funds](docs/.vuepress/public/eu-logos.png)

## Authors

Created by [Handsontable](https://handsontable.com), [NavAlgo](https://www.navalgo.com/en/),
and [Contributors](https://github.com/handsontable/hyperformula/graphs/contributors).

© 2021 Handsoncode
