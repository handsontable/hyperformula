# Custom functions

Expand the library of functions available in your app, by implementing a custom function.

## Custom function example

Let's create a custom function that returns the number of letters in the word "HyperFormula".

### 1. Create a plugin class

Import `FunctionPlugin`, and extend it with your own plugin class:

```javascript
import { FunctionPlugin } from 'hyperformula';

export class CountHF extends FunctionPlugin {
  
}
```

### 2. Define a custom function provided by your plugin

In your newly created class, define a static property called `implementedFunctions`.

`implementedFunctions`, defines the IDs of that your plugin's functions (e.g., `HYPER`),
and maps 

Your newly created class should have a static `implementedFunctions`
property that defines functions this plugin contains and maps them to their implementations.

The keys are canonical function IDs which are also used to find
corresponding translations in translation packages.

```javascript
CountHF.implementedFunctions = {
  HYPER: {
    // we'll define this method's functionality below
    method: 'hyper',
  }
};
```

### 3. Register names for your function

Define a `translations` object with the names for your function in every language you want to support.
These names will be used to call your function inside formulas.

HyperFormula doesn't enforce a naming convention of the function.
However, all names will be normalized to upper-case, so they
are not case-sensitive.

```javascript
CountHF.translations = {
  enGB: {
    HYPER: "HYPER"
  }
};
```

### 4. Implement your custom function

For the simplicity of a basic example, our custom function takes no arguments. However, this method imposes a particular structure to
be used; there are two optional arguments, `ast` and
`state`, and the function must return the results of
the calculations.

Optionally, you can wrap your implementation in the built-in `runFunction()` method to make use of the automatic validations:
- It validates the function parameters according to your [optional parameter](#optional-parameters) setting.
- It validates the function parameters according to your [argument validation options](#argument-validation-options).
- It verifies the format of the values returned by your function.

```javascript
export class CountHF extends FunctionPlugin {
  // implement your custom function
  // wrap your custom function in `runFunction()`
  hyper(ast, state) {
    return this.runFunction(ast.args, state, this.metadata('HYPER'), () => 'Hyperformula'.length)
  }
}
```

### 5. Register your plugin with HyperFormula

Before you can use the newly created function, you need to
register it using `registerFunctionPlugin()` method.

```javascript
HyperFormula.registerFunctionPlugin(CountHF, CountHF.translations);
```

### 6. Use your custom function inside a formula

```javascript
// prepare a spreadsheet data
const data = [['=HYPER()']];

// build HF instance where you can use the function directly
const hfInstance = HyperFormula.buildFromArray(data);

// read the value of cell A1
const result = hfInstance.getCellValue({ sheet: 0, col: 0, row: 0 });

// open the browser's console to see the results
console.log(result);
```

### Complete custom function implementation & demo

<iframe
  src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/2.0.x/custom-functions?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview"
  style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
  title="handsontable/hyperformula-demos: custom-functions"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts">
</iframe>

## Configure the behavior of a custom function

Passing optional parameters to the `implementedFunctions` object, you can configure your function to:
* Use the [array arithmetic mode](arrays.md)
* Treat reference or range arguments as arguments that don't create dependency
* Inline range arguments to scalar arguments
* Get recalculated with each sheet shape change
* Be a [volatile](volatile-functions.md) function
* Repeat a specified number of last arguments indefinitely
* Never get vectorized

```javascript
CountHF.implementedFunctions = {
  HYPER: {
    method: 'hyper',
    // config parameters
    arrayFunction: false,
    doesNotNeedArgumentsToBeComputed: false,
    expandRanges: false,
    isDependentOnSheetStructureChange: false,
    isVolatile: true,
    repeatLastArgs: 4,
  }
};
```

You can set the following config parameters:

| Option                              | Type    | Description                                                                                                                                                  |
|-------------------------------------|---------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `arrayFunction`                     | Boolean | If set to `true`, the function enables the [array arithmetic mode](arrays.md) in its arguments and nested expressions.                                       |
| `doesNotNeedArgumentsToBeComputed`  | Boolean | If set to `true`, the function treats reference or range arguments as arguments that don't create dependency.<br><br>Other arguments are properly evaluated. |
| `expandRanges`                      | Boolean | If set to `true`, ranges in the function's arguments are inlined to (possibly multiple) scalar arguments.                                                    |
| `isDependentOnSheetStructureChange` | Boolean | If set to `true`, the function gets recalculated with each sheet shape change (e.g. when adding/removing rows or columns).                                   |
| `isVolatile`                        | Boolean | If set to `true`, the function is [volatile](volatile-functions.md).                                                                                         |
| `repeatLastArgs`                    | Number  | For functions with a variable number of arguments: sets how many last arguments can be repeated indefinitely.                                                |

## Argument validation options

In an optional `parameters` array, you can set rules for your function's argument validation.

```javascript
CountHF.implementedFunctions = {
  HYPER: {
    method: 'hyper',
    // set your argument validation options
    parameters: [{
      passSubtype: false,
      defaultValue: 10,
      optionalArg: false,
      minValue: 5,
      maxValue: 15,
      lessThan: 15,
      greaterThan: 5
    }],
  }
};
```

You can set the following argument validation options:

| Parameter      | Type                                     | Description                                                                                                                                                                                                                                |
|----------------|------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `passSubtype`  | Boolean                                  | If set to `true`, arguments are passed with full type information.<br>(e.g. for numbers: `Date` or `DateTime` or `Time` or `Currency` or `Percentage`)                                                                                     |
| `defaultValue` | `InternalScalarValue` \ `RawScalarValue` | If set to any value: if an argument is missing, its value defaults to `defaultValue`.                                                                                                                                                      |
| `optionalArg`  | Boolean                                  | If set to `true`: if an argument is missing, and no `defaultValue` is set, the argument defaults to `undefined` (instead of throwing an error).<br><br>Setting this option to `true` is the same as setting `defaultValue` to `undefined`. |
| `minValue`     | Number                                   | If set, numerical arguments need to be greater than or equal to `minValue`.                                                                                                                                                                |
| `maxValue`     | Number                                   | If set, numerical arguments need to be less than or equal to `maxValue`.                                                                                                                                                                   |
| `lessThan`     | Number                                   | If set, numerical argument need to be less than `lessThan`.                                                                                                                                                                                |
| `greaterThan`  | Number                                   | If set, numerical argument need to be greater than `greaterThan`.                                                                                                                                                                          |

### Handling missing arguments

The `defaultValue` and `optionalArg` options let you decide what happens when a user doesn't pass enough valid arguments to your custom function.

Setting a `defaultValue` for an argument always makes that argument optional.

But, the `defaultValue` option automatically replaces any missing arguments with `defaultValue`, so your custom function is not aware of the actual number of valid arguments passed.

If you don't want to set any `defaultValue` (because, for example, your function's behavior depends on the number of valid arguments passed), you can use the `optionalArg` setting.

## Aliases

Aliases are available since the <Badge text="v0.4.0" vertical="middle"/> version.

If you want to include aliases (multiple names to a single implemented function) inside the plugin,
you can do this with the static `aliases` property, which maps the aliases' IDs to the functions' IDs.

```javascript
CountHF.implementedFunctions = {
  HYPER: {
    // this method's functionality will be defined below
    method: 'hyper',
  }
};

CountHF.aliases = {
  'HYPERRR': 'HYPER'
  // HYPERRR is now an alias to HYPER
};
```

## Translations

`translations` object can be defined as a static property of a plugin class or as a separate object. It must be passed as a second argument to `registerFunctionPlugin()` function.


```javascript
// translation as a static property of a plugin class
CountHF.translations = {
  enGB: {
    'HYPER': 'HYPER'
  },
  plPL: {
    'HYPER': 'HAJPER'
  }
};

HyperFormula.registerFunctionPlugin(CountHF, CountHF.translations);
```

```js
// translations as a separate object
export const countHFTranslations = {
  enGB: {
    'HYPER': 'HYPER'
  },
  plPL: {
    'HYPER': 'HAJPER'
  }
};

HyperFormula.registerFunctionPlugin(CountHF, countHFTranslations);
```

## Returning errors

If you want your custom function to return an error, check the [API reference](../api) for the HyperFormula [error types](types-of-errors.md).

:::tip
All HyperFormula [error types](types-of-errors.md) support optional custom error messages. Put them to good use: let your users know what caused the error and how to avoid it in the future.
:::

For example, if you want to return a `#DIV/0!` error with your custom error message, use the [`CellError` class](../api/classes/cellerror.md), and the [DIV_BY_ZERO](../api/enums/errortype.md#div-by-zero) error type:

```javascript
// import `CellError` and `ErrorType`
import { FunctionPlugin, CellError, ErrorType } from "hyperformula";

export class CountHF extends FunctionPlugin {
  hyper(ast, state) {
    if (!ast.args.length) {
      // create a `CellError` instance with an `ErrorType` of `DIV_BY_ZERO`
      // with your custom error message (optional)
      return new CellError(ErrorType.DIV_BY_ZERO, 'Sorry, cannot divide by zero!');
    }
  
    return this.runFunction(ast.args, state, this.metadata('HYPER'), () => 'Hyperformula'.length)
  }
}
```

The error displays as `#DIV/0` and gets translated appropriately.

### Error localization

Errors returned by methods such as `getCellValue` are wrapped in the [`DetailedCellError` type](../api/classes/detailedcellerror.md).

`DetailedCellError` localizes the error based on your [internationalization settings](localizing-functions.md).
