---
description: HyperFormula® - Complex Calculations Made Easy
---

# HyperFormula guide

<div class="iframe-container">
  <iframe 
    src="https://www.youtube.com/embed/JJXUmACTDdk?controls=0" 
    frameborder="0" 
    allow="accelerometer; 
    encrypted-media; 
    gyroscope; 
    picture-in-picture" 
    allowfullscreen>
  </iframe>
</div>

## What is HyperFormula?

HyperFormula is a headless spreadsheet built on top of TypeScript. It serves as a parser and evaluator of Excel formulas for web applications. You can use it in a browser or as a service, with Node.js as your back-end technology.

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
- Actively maintained by the team at [Handsontable - JavaScript Data Grid](https://handsontable.com/)

HyperFormula comes with a huge library of [{{ $page.functionsCount }} built-in functions](/guide/built-in-functions.md)
grouped into categories:
- Array manipulation
- Date and time
- Engineering
- Financial
- Information
- Logical
- Lookup and reference
- Math and trigonometry
- Matrix functions
- Operator
- Statistical
- Text

The functions use A1 notation and are compatible with popular spreadsheet software like
Excel or Google Sheets, which means that you can easily transfer
the data and formulas between them.

## What can it be used for?

HyperFormula doesn't assume any existing user interface, making it a great general-purpose library that can be used in various business applications. Here are some examples:

- Business logic builders
- Forms and form builders
- Computation notebooks
- Smart documents
- Educational apps
- Online calculators

## Resources

* [Basic usage](/guide/basic-usage.md)
* [Configuration options](/guide/configuration-options.md)
* [Built-in functions](/guide/built-in-functions.md)
* [Custom functions](/guide/custom-functions.md)
* [Key concepts](/guide/key-concepts.md)
* [Performance](/guide/performance.md)

<br>

This documentation is licensed under 
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
