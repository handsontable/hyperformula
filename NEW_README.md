<h1><img src="./resources/HF_logo.png" alt="HF_Logo" style="max-width:500px"></h1>

**HyperFormula** is an open-source high-performance calculation engine for JavaScript with GPU-acceleration, spreadsheet-like syntax, and support for CRUD operations. 

The concept of HyperFormula originates from the need of efficient and flexible mechanism for function calculation inside of Handsontable.


<p style="border: 1px dashed #1C6EA4;; padding: 8px">You are welcome to contribute to this project through making pull requests, filing issues, reproducing bugs and suggesting improvements. Please read our guide for contributors for more details.</p>

## Documentation

* API reference {{LINK}}
* Quick start
* How it works
* Core features
* Benchmarks and demos
* Browser compatibility
* Contributing
* Consulting and support
* Roadmap
* License
* Dependencies
* Acknowledgements

## Quick start

Use npm to install the latest version:
```
npm install hyperformula
```

You can use yarn as well:
```
yarn add hyperformula
```

Or load it directly from [jsDelivr](https://www.jsdelivr.com/package/npm/hyperformula).

**Example of use:**

```
import { HyperFormula } from 'hyperformula';
 
const hf = HyperFormula.buildFromArray([
 ['=B1+C2', '1', '2'],
	['4', '1', '=SUM(A2:B2, C1)'],
]);
​
const A1Address = { row: 0, col: 0, sheet: 0 };
const cellFormula = hf.getCellFormula(A1Address);
​const cellValue = hf.getCellValue(A1Address);
​
console.log('Calculated value for', cellFormula, 'is', cellValue);
// Calculated value for =B1+C2 is 8
```

## How it works

// To do

## Core features

* Purely client-side, typescript code with static types
* Spreadsheet formulas syntax
* 55 of 484 built-in functions (see the list)
* High speed parser and evaluator
* Undo/redo stack
* Ready for localization
* Cross-browser support
* A1 reference style
* Support for CRUD operations (including moving rows and columns)
* Smart recalculation after each change
* Support for multiple data types
* GPU-acceleration for some formulas (MMULT, TRANSPOSE, MEDIANPOOL, MAXPOOL)
* Open source with commercial licence and consulting available;

## Benchmarks and demos

HyperFormula performance has been tested on different devices, operating systems and browsers.  Table below presents the results of Test C in which the engine performs a multiplication of two 2000x2000 matrices. The main objective is to present a significant difference in performance of MMULT operation with CPU against GPU. 

The time is specified in seconds.
In addition to this example, there are several test scenarios available at {{LINK}}

**Performance comparison output:**

|                       | GPU   | CPU    |
|-----------------------|-------|--------|
| Number of rows        | 2000  | 2000   |
| Number of columns     | 2000  | 2000   |
| Total number of cells | 4M    | 4M     |
| Number of repeats     | 100   | 100    |
| **MacBook Pro**       |       |        |
| Average total time    | 2.921 | 18.570 |
| Standard deviation    | 0.117 | 1.981  |
| **Lenovo ThinkBook**  |       |        |
| Average total time    | 3.041 | 10.543 |
| Standard deviation    | 0.138 | 0.045  |
| **Huawei Mate 20**    |       |        |
| Average total time    | 6.611 | 40.166 |
| Standard deviation    | 0.394 | 0.594  |

**Devices used in the test:**

| MacBook Pro (2015)               | Lenovo ThinkBook (2019)                | Huawei Mate 20 (2018)                                      |
|----------------------------------|----------------------------------------|------------------------------------------------------------|
| 2,7 GHz Intel Core i5            | Intel Core i5 8gen 8265U 1,6 - 3,9 GHz | Octa-core (2x2.6 GHz 2x Cortex-A76 & 4x1.8 GHz Cortex-A55) |
| 16 GB 1867 MHz DDR3              | 8 GB,RAM DDR4 2400 MHz                 | 4 GB RAM HiSilicon Kirin 980                               |
| Intel Iris Graphics 6100 1536 MB | Intel UHD Graphics 620                 | Mali-G76 MP10                                              |
| macOS Mojave, Chrome             | Windows 10 Pro, Firefox                | Android Pie (9), Chrome                                    |


## Browser compatibility

HyperFormula is compatible with two (2) last versions of modern browsers such as Chrome, Firefox, Safari, Opera, and Edge as well as mobile browsers. It supports Internet Explorer 10 and 11 with limited performance.

## Contributing

You are warmly welcome to hack on **HyperFormula** and to contribute to its development. Your help is much appreciated in any of the following topics:
* Making valuable pull requests
  * Adding new formulas
  * Adding new features
  * Improving the existing code
  * Improving performance
* Contributing to documentation and API
* Reporting bugs
* Suggesting improvements
* Requesting features


If you want to contribute to HyperFormula, be sure to read the [contribution guidelines](https://github.com/handsontable/hyperformula/blob/master/CONTRIBUTING.md). By participating in this project, you are expected to uphold our [Code of Conduct](https://github.com/handsontable/hyperformula/blob/master/CODE_OF_CONDUCT.md) (we adopted Contributors Covenant 2.0).

## Consulting and support

Do you want to extend this project by new functionalities or formulas? We are here to help! Our technology partner in this project is [Navalgo](https://www.navalgo.com/en/) - a company of which Data Science specialists helped to carry out this project from scratch.

Do not hesitate to contact us at hyperformula@handsontable.com to get more details about collaboration

## Roadmap

A plan for HyperFormula is to grow it to become a fully developed engine that covers 100% of formulas available in spreadsheets on the market such as offered by Microsoft Excel, Google Sheets or Libre Office Calc. Apart from being functional, HyperFormula is planned to be OpenFormula standard-compliant, that is, to meet all the requirements of its Evaluators. A todo list:



* Support for user-defined formulas
* Modular architecture
* Support for column sorting and filtering
* Add a total of [484 formulas](https://docs.google.com/spreadsheets/d/1jMvfY5DzMxmTiUTZB-8wwtMaKB2OqWEWqi-Ku1FogZE/edit#gid=1120069524)
* Optimize AST by implementing B-trees
* Optimize some calculations using WebWorkers
* Allow cross-sheet references
* Extend localization for more languages
* Support for named ranges
* Support for DAX formulas

## License

[GNU GPL v3](https://github.com/handsontable/hyperformula/blob/master/COPYING.md) (General Public License as published by the Free Software Foundation, either version 3 of the License, or any later version).

Since HyperFormula is an open-source project, ready to warmly welcome external contributors, we aim at distributing it under the GNU GPL v3 open license.

However, if, due to some circumstances, you prefer not to use an open-source license you can contact us at hyperformula@handsontable.com to buy a commercial license with dedicated support.

Copyright (c) Handsoncode. All rights reserved. 
All trademarks belong to their respective owners.

## Dependencies

Although HyperFormula is created to achieve full functionality with as few external dependencies as possible, it uses some packages to parse formulas. These are:

* Chevrotain (Apache 2.0)
* Moment.js (MIT)
* GPU.js (MIT)
* Core-js (MIT)
* regenerator-runtime (MIT)

## Acknowledgements

You should know that this project wouldn’t exist without co-financing from European Union funds under the European Regional Development Funds as a part of the Smart Growth Operational Programme. Project implemented as a part of the Polish National Centre for Research and Development: “Fast Track”.

* Name of the programme: Smart Growth Operational Programme 2014-2020
* Project name: "Development of the high-performance calculation engine for processing tabular data of the significant size on mobile devices and workstations using parallel computing and GPU."
* Project number: POIR.01.01.01-00-0223/18-00
* Beneficiary: Handsoncode sp. z o.o.
* Total budget: PLN 1 121 375.00 (USD ~295 000)
* Amount of grant: PLN 774 742.00 (USD ~204 000)
* Duration: 2018-2019

![Logo_NCBR](./resources/NCBR_logo.png "Logo_NCBR")

Created by [Handsoncode](https://handsoncode.net/) with ❤ and ☕ in [Tricity](https://en.wikipedia.org/wiki/Tricity,_Poland).

