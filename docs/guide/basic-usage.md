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

Then it can be imported inside your file:

```js
import { HyperFormula } from 'hyperformula';
```

### jsDelivr

You can also load **HyperFormula** from `jsDelivr` and insert it directly in the `<script>` tag:

```js
<script src="https://cdn.jsdelivr.net/npm/hyperformula/dist/hyperformula.min.js"></script>
```

It will be accessible in the project as a `HyperFormula` global variable.

## Basic use

There are three exposed methods which you can use to start working with the engine.

You can feed it with data and use `buildFromArray` or `buildFromSheets` or initiate it without data with `buildEmpty`.

Before you start, make sure you have imported **HyperFormula** in the file:

```js
import { HyperFormula } from 'hyperformula';
```

then, you can choose the method and can call it on the instance: 

### buildEmpty

```js
const myEngine = HyperFormula.buildEmpty();
```


### buildFromArray


```js
const myEngine = HyperFormula.buildFromArray();
```


### buildFromSheets


```js
const myEngine = HyperFormula.buildFromSheets();
```

### getCellFormula

### getCellValue


