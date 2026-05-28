---
title: HyperFormula
description: HyperFormula® - An open-source headless spreadsheet for business web apps
head:
  - tag: style
    content: 'h1#_top { display: none; }'
---

<br>
<br>
<p align="center">
  <a href="https://hyperformula.handsontable.com/">
    <img src="https://raw.githubusercontent.com/handsontable/hyperformula/master/github-hf-logo-blue.svg" width="350" height="71" alt="HyperFormula - A headless spreadsheet, a parser and evaluator of Excel formulas"/>
  </a>
</p>

<p align="center">
  <strong>An open-source headless spreadsheet for business web apps</strong>
</p>

<p align="center">
  <a href="https://npmjs.com/package/hyperformula"><img src="https://img.shields.io/npm/dt/hyperformula.svg" alt="npm total downloads"></a>
  <a href="https://npmjs.com/package/hyperformula"><img src="https://img.shields.io/npm/dm/hyperformula.svg" alt="npm monthly downloads"></a>
  <a href="https://github.com/handsontable/hyperformula/graphs/contributors"><img src="https://img.shields.io/github/contributors/handsontable/hyperformula" alt="GitHub contributors"></a>
  <a href="https://snyk.io/test/github/handsontable/hyperformula?targetFile=package.json"><img src="https://snyk.io/test/github/handsontable/hyperformula/badge.svg?targetFile=package.json" alt="Known Vulnerabilities"></a>
  <br>
  <a href="https://app.fossa.io/projects/git%2Bgithub.com%2Fhandsontable%2Fhyperformula?ref=badge_shield"><img src="https://app.fossa.io/api/projects/git%2Bgithub.com%2Fhandsontable%2Fhyperformula.svg?type=shield" alt="FOSSA Status"></a>
  <a href="https://github.com/handsontable/hyperformula/actions?query=workflow%3Abuild+branch%3Amaster"><img src="https://img.shields.io/github/actions/workflow/status/handsontable/hyperformula/build.yml?branch=master" alt="GitHub Workflow Status"></a>
  <a href="https://codecov.io/gh/handsontable/hyperformula"><img src="https://codecov.io/gh/handsontable/hyperformula/branch/master/graph/badge.svg?token=5k9ZQv8azO" alt="codecov"></a>
</p>

---

HyperFormula is a headless spreadsheet built in TypeScript, serving as both a parser and evaluator of spreadsheet formulas. It can be integrated into your browser or utilized as a service with Node.js as your back-end technology.

## What HyperFormula can be used for?

HyperFormula doesn't assume any existing user interface, making it a general-purpose library that can be used in various business applications. Here are some examples:

- Deterministic compute layer for AI & LLMs
- Calculated fields in CRM and ERP software
- Custom spreadsheet-like app
- Business logic builder
- Forms and form builder
- Educational app
- Online calculator

## Features

- [Function syntax compatible with Microsoft Excel](/docs/guide/compatibility-with-microsoft-excel) and [Google Sheets](/docs/guide/compatibility-with-google-sheets)
- High-speed parsing and evaluation of spreadsheet formulas
- [A library of ~400 built-in functions](/docs/guide/built-in-functions)
- [Support for custom functions](/docs/guide/custom-functions)
- [Support for Node.js](/docs/guide/server-side-installation#install-with-npm-or-yarn)
- [Support for undo/redo](/docs/guide/undo-redo)
- [Support for CRUD operations](/docs/guide/basic-operations)
- [Support for clipboard](/docs/guide/clipboard-operations)
- [Support for named expressions](/docs/guide/named-expressions)
- [Support for data sorting](/docs/guide/sorting-data)
- [Support for formula localization with 17 built-in languages](/docs/guide/i18n-features)
- Easy integration with any front-end or back-end application
- GPLv3 or a [commercial license](https://handsontable.com/get-a-quote)
- Maintained by the team that stands behind the [Handsontable](https://handsontable.com/) data grid

## Documentation

- [Client-side installation](/docs/guide/client-side-installation)
- [Server-side installation](/docs/guide/server-side-installation)
- [Basic usage](/docs/guide/basic-usage)
- [Configuration options](/docs/guide/configuration-options)
- [List of built-in functions](/docs/guide/built-in-functions)
- [API Reference](/docs/api)

## Integrations

- [Integration with React](/docs/guide/integration-with-react#demo)
- [Integration with Angular](/docs/guide/integration-with-angular#demo)
- [Integration with Vue](/docs/guide/integration-with-vue#demo)
- [Integration with Svelte](/docs/guide/integration-with-svelte#demo)

## Installation and usage

Install the library from [npm](https://www.npmjs.com/package/hyperformula) like so:

```bash
npm install hyperformula
```

Once installed, you can use it to develop applications tailored to your specific business needs. Here, we've used it to craft a form that calculates mortgage payments using the `PMT` formula.

```js
import { HyperFormula } from 'hyperformula';

// Create a HyperFormula instance
const hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' });

// Add an empty sheet
const sheetName = hf.addSheet('Mortgage Calculator');
const sheetId = hf.getSheetId(sheetName);

// Enter the mortgage parameters
hf.addNamedExpression('AnnualInterestRate', '8%');
hf.addNamedExpression('NumberOfMonths', 360);
hf.addNamedExpression('LoanAmount', 800000);

// Use the PMT function to calculate the monthly payment
hf.setCellContents({ sheet: sheetId, row: 0, col: 0 }, [['Monthly Payment', '=PMT(AnnualInterestRate/12, NumberOfMonths, -LoanAmount)']]);

// Display the result
console.log(`${hf.getCellValue({ sheet: sheetId, row: 0, col: 0 })}: ${hf.getCellValue({ sheet: sheetId, row: 0, col: 1 })}`);
```

[Run this code in StackBlitz](https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.3.x/mortgage-calculator)

## Contributing

Contributions are welcome, but before you make them, please read the [Contributing Guide](/docs/guide/contributing) and accept the [Contributor License Agreement](https://goo.gl/forms/yuutGuN0RjsikVpM2).

## License

HyperFormula is available under two different licenses: GPLv3 and proprietary. The proprietary license can be purchased by [contacting our team](https://handsontable.com/get-a-quote) at Handsontable.

Copyright (c) Handsoncode
