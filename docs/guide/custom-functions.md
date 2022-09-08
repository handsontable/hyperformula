# Custom functions

Expand the function library of your application, by adding custom functions.

**Contents:**
[[toc]]

## Add a custom function

As an example, let's create a function that returns the number of letters in the word "HyperFormula".

<iframe
  src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/2.1.x/custom-functions?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview"
  style="width:100%; height:300px; border:0; border-radius: 4px; overflow:hidden;"
  title="handsontable/hyperformula-demos: custom-functions"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts">
</iframe>

### 1. Create a function plugin

Import `FunctionPlugin`, and extend it with a new class. For example:

```javascript
import { FunctionPlugin } from 'hyperformula';

// let's call the function plugin `CountHF`
export class CountHF extends FunctionPlugin {
  
}
```

### 2. Define your function's ID and method

In your function plugin, in the static `implementedFunctions` property, define an object that contains your custom function.

The name of that object becomes the ID by which [translations](#function-translations), [aliases](#function-aliases), and other elements refer to your function.
Make the ID unique among all HyperFormula functions ([built-in](built-in-functions.md#list-of-available-functions) and custom).

Then, in your function's object, define a `method` property, which maps your function to an implementation method (we'll define it later on).

```javascript
CountHF.implementedFunctions = {
  // let's define the function's ID as `HYPER`
  HYPER: {
    // we'll define the `hyper` method later on
    method: 'hyper',
  },
};
```

::: tip
In `implementedFunctions`, you can also define your [custom function options](#custom-function-options) and [argument validation options](#argument-validation-options).
:::

::: tip
To define multiple functions in a single function plugin, add them all to the `implementedFunctions` object.
```js
CountHF.implementedFunctions = {
  HYPER: {
    //...
  },
  SUPER: {
    //...
  },
};
```
:::

### 3. Add your function's names

In your function plugin, in the static `translations` property, define your function's names in every language you want to support. Your end users use these names to call your function inside formulas.

If you support just one language, you still need to define the name of your function in that language.

::: tip
Function names are case-insensitive, as they are all normalized to uppercase.
:::

```javascript
CountHF.translations = {
  enGB: {
    // in English, let's set the function's name to `HYPER`
    HYPER: 'HYPER',
  },
};
```

### 4. Implement your function's logic

In your function plugin, add a method that implements your function's calculations. Your method needs to:
* Take two optional arguments: `ast` and `state`.
* Return the results of your calculations.

```javascript
export class CountHF extends FunctionPlugin {
  hyper(ast, state) {
    return 'Hyperformula'.length;
  }
}
```

To benefit from HyperFormula's automatic validations, wrap your method in the built-in `runFunction()` method, which:
* Verifies the format of the values returned by your function.
* Validates your function's parameters against your [custom function options](#custom-function-options).
* Validates arguments passed to your function against your [argument validation options](#argument-validation-options).

```javascript
export class CountHF extends FunctionPlugin {
  hyper(ast, state) {
    return this.runFunction(ast.args, state, this.metadata('HYPER'), () => 'Hyperformula'.length);
  }
}
```

### 5. Register your function plugin

Register your function plugin (and its translations) so that HyperFormula can recognize it.

Use the `registerFunctionPlugin()` method:

```javascript
HyperFormula.registerFunctionPlugin(CountHF, CountHF.translations);
```

### 6. Use your custom function inside a formula

Now, you can use your HYPER function inside a formula:

```javascript
// prepare spreadsheet data
const data = [['=HYPER()']];

// build a HyperFormula instance where you can use your function directly
const hfInstance = HyperFormula.buildFromArray(data);

// read the value of cell A1
const result = hfInstance.getCellValue({ sheet: 0, col: 0, row: 0 });

// open the browser's console to see the results
console.log(result);
```

### Full example

```javascript
import { FunctionPlugin } from 'hyperformula';

export class CountHF extends FunctionPlugin {
  hyper(ast, state) {
    return this.runFunction(ast.args, state, this.metadata('HYPER'), () => 'Hyperformula'.length);
  }
}

CountHF.implementedFunctions = {
  HYPER: {
    method: 'hyper',
  },
};

CountHF.translations = {
  enGB: {
    HYPER: 'HYPER',
  },
};

HyperFormula.registerFunctionPlugin(CountHF, CountHF.translations);
```

## Custom function options

You can configure your custom function to:
* Use the [array arithmetic mode](arrays.md).
* Treat reference or range arguments as arguments that don't create dependency.
* Inline range arguments to scalar arguments.
* Get recalculated with each sheet shape change.
* Be a [volatile](volatile-functions.md) function.
* Repeat a specified number of last arguments indefinitely.
* Never get vectorized.

In your function plugin, in the static `implementedFunctions` property, add your function's options:

```javascript
MyFunctionPlugin.implementedFunctions = {
  MY_FUNCTION: {
    method: 'myFunctionMethod',
    // set options for `MY_FUNCTION`
    arrayFunction: false,
    doesNotNeedArgumentsToBeComputed: false,
    expandRanges: false,
    isDependentOnSheetStructureChange: false,
    isVolatile: true,
    repeatLastArgs: 4,
  },
};
```

You can set the following options for your function:

| Option                              | Type    | Description                                                                                                                                  |
| ----------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `arrayFunction`                     | Boolean | `true`: the function enables the [array arithmetic mode](arrays.md) in its arguments and nested expressions.                                 |
| `doesNotNeedArgumentsToBeComputed`  | Boolean | `true`: the function treats reference or range arguments as arguments that don't create dependency (other arguments are properly evaluated). |
| `expandRanges`                      | Boolean | `true`: ranges in the function's arguments are inlined to (possibly multiple) scalar arguments.                                              |
| `isDependentOnSheetStructureChange` | Boolean | `true`: the function gets recalculated with each sheet shape change (e.g., when adding/removing rows or columns).                            |
| `isVolatile`                        | Boolean | `true`: the function is [volatile](volatile-functions.md).                                                                                   |
| `repeatLastArgs`                    | Number  | For functions with a variable number of arguments: sets how many last arguments can be repeated indefinitely.                                |

### Argument validation options

You can set rules for your function's argument validation.

In your function plugin, in the static `implementedFunctions` property, next to other options add an array called `parameters`:

```javascript
MyFunctionPlugin.implementedFunctions = {
  MY_FUNCTION: {
    method: 'myFunctionMethod',
    // set argument validation options for `MY_FUNCTION`
    parameters: [{
      passSubtype: false,
      defaultValue: 10,
      optionalArg: false,
      minValue: 5,
      maxValue: 15,
      lessThan: 15,
      greaterThan: 5,
    }],
  }
};
```

You can set the following argument validation options:

| Option         | Type                                      | Description                                                                                                                                                                                                                      |
| -------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `passSubtype`  | Boolean                                   | `true`: arguments are passed with full type information (e.g., for numbers: `Date` or `DateTime` or `Time` or `Currency` or `Percentage`).                                                                                       |
| `defaultValue` | `InternalScalarValue` \| `RawScalarValue` | If set: if an argument is missing, its value defaults to `defaultValue`.                                                                                                                                                         |
| `optionalArg`  | Boolean                                   | `true`: if an argument is missing, and no `defaultValue` is set, the argument defaults to `undefined` (instead of throwing an error).<br><br>Setting this option to `true` is the same as setting `defaultValue` to `undefined`. |
| `minValue`     | Number                                    | If set: numerical arguments need to be greater than or equal to `minValue`.                                                                                                                                                      |
| `maxValue`     | Number                                    | If set: numerical arguments need to be less than or equal to `maxValue`.                                                                                                                                                         |
| `lessThan`     | Number                                    | If set: numerical argument need to be less than `lessThan`.                                                                                                                                                                      |
| `greaterThan`  | Number                                    | If set: numerical argument need to be greater than `greaterThan`.                                                                                                                                                                |

#### Handling missing arguments

Both the `defaultValue` and `optionalArg` options let you decide what happens when a user doesn't pass enough valid arguments to your custom function.

Setting a `defaultValue` for an argument always makes that argument optional. But, the `defaultValue` option automatically replaces any missing arguments with `defaultValue`, so your custom function is unaware of the actual number of valid arguments passed.

If you don't want to set any `defaultValue` (because, for example, your function's behavior depends on the number of valid arguments passed), use the `optionalArg` setting instead.

## Function aliases

You can assign multiple aliases to a single custom function.

In your function plugin, in the static `aliases` property, add aliases for your function:

```javascript
MyFunctionPlugin.aliases = {
  // `=MY_ALIAS()` will work the same as `=MY_FUNCTION()`
  'MY_ALIAS': 'MY_FUNCTION'
};
```

::: tip
For each alias of your function, define a translation, even if you want to support only one language.
```js
MyFunctionPlugin.translations = {
  enGB: {
    'MY_FUNCTION': 'MY_FUNCTION',
    'MY_ALIAS': 'MY_ALIAS',
  },
};
```
:::

## Function name translations

You can configure the name of your function with multiple translations.
Your end users call your function by referring to those translations.

In your function plugin, in the static `translations` property, define your function's names,
in every language that you want to support.

::: tip
Function names are case-insensitive, as they are all normalized to uppercase.
:::

```javascript
MyFunctionPlugin.translations = {
  enGB: {
    // formula in English: `=MY_FUNCTION()`
    'MY_FUNCTION': 'MY_FUNCTION'
  },
  deDE: {
    // formula in German: `=MEINE_FUNKTION()`
    'MY_FUNCTION': 'MEINE_FUNKTION'
  }
};

// register your function plugin and translations
HyperFormula.registerFunctionPlugin(MyFunctionPlugin, MyFunctionPlugin.translations);
```

You can also define `translations` as a standalone object:

```js
export const MyFunctionNameTranslations = {
  enGB: {
    'MY_FUNCTION': 'MY_FUNCTION'
  },
  deDE: {
    'MY_FUNCTION': 'MEINE_FUNKTION'
  }
};

// register your function plugin and translations
HyperFormula.registerFunctionPlugin(MyFunctionPlugin, MyFunctionNameTranslations);
```

::: tip
Before using a translated function name, remember to [register and set the language](localizing-functions.md).
:::

## Returning errors

If you want your custom function to return an error, check the [API reference](../api) for the HyperFormula [error types](types-of-errors.md).

:::tip
All HyperFormula [error types](types-of-errors.md) support optional custom error messages. Put them to good use: let your users know what caused the error and how to avoid it in the future.
:::

For example, if you want to return a `#DIV/0!` error with your custom error message, use the [`CellError` class](../api/classes/cellerror.md), and the [DIV_BY_ZERO](../api/enums/errortype.md#div-by-zero) error type:

```javascript
// import `CellError` and `ErrorType`
import { FunctionPlugin, CellError, ErrorType } from 'hyperformula';

export class MyFunctionPlugin extends FunctionPlugin {
  myFunctionMethod(ast, state) {
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
