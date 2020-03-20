## Installation

### NPM and Yarn

You can install the latest version **HyperFormula** with popular packaging managers.

First, navigate to **your project**.

```bash
$ cd /folder_with_your_project
```

Then, inside the project folder run the installation command.

With `npm`:

```bash
$ npm install hyperformula
```

**or** with `yarn`:

```bash
$ yarn add hyperformula
```

The package should be added to your `package.json` file and installed to your `./node_modules` directory.

### jsDelivr

You can also load **HyperFormula** from `jsDelivr` and insert it directly in the `<script>` tag:

```js
<script src="https://cdn.jsdelivr.net/npm/hyperformula/dist/hyperformula.min.js"></script>
```

It will be accessible in the project as a `HyperFormula` global variable:

```js
const MY_DATA = [['=B1+C2', '1', '2'],['4', '1', '=SUM(A2:B2, C1)']];
const hf = HyperFormula.buildFromArray(MY_DATA);
```

## Use

If you chose the installation with `npm` or `yarn` you can import HyperFormula directly in the file and initialize the engine by feeding it some data:

```js
import { HyperFormula } from 'hyperformula';
const hf = HyperFormula.buildFromArray([['=B1+C2', '1', '2'],['4', '1', '=SUM(A2:B2, C1)'],
]);
```

You can see the calculation by calling a method:

```js
const cellAddress = hf.simpleCellAddressFromString('A1', 0);
const cellFormula = hf.getCellFormula(cellAddress);
const cellValue = hf.getCellValue(cellAddress);
```
