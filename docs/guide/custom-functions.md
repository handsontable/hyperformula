# Custom functions

Expand the function library of your application by adding custom functions.

**Contents:** [[toc]]

## Add a simple custom function

As an example, let's create a custom function `GREET` that accepts a person's
first name as a string argument and returns a personalized greeting.

### 1. Create a function plugin

Import `FunctionPlugin`, and extend it with a new class. For example:

```js
import { FunctionPlugin } from 'hyperformula';

// let's call the function plugin `MyCustomPlugin`
export class MyCustomPlugin extends FunctionPlugin {}
```

### 2. Define your function's ID, method, and metadata

In your function plugin, in the static `implementedFunctions` property, define
an object that declares the functions provided by this plugin.

The name of that object becomes the ID by which
[translations](#function-name-translations), [aliases](#function-aliases), and
other elements reference your function. Make the ID unique among all HyperFormula
functions ([built-in](built-in-functions.md#list-of-available-functions) and
custom).

In your function's object, you can specify:

- A `method` property (required), which maps your function to the implementation
  method (we'll define it later on),
- A `parameters` array that describes the arguments accepted by your function
  and [validation options](#argument-validation-options) for each argument,
- Other [custom function options](#function-options).

```js
import { FunctionPlugin, FunctionArgumentType } from 'hyperformula';

MyCustomPlugin.implementedFunctions = {
  // let's define the function's ID as `GREET`
  GREET: {
    method: 'greet',
    parameters: [{ argumentType: FunctionArgumentType.STRING }],
  },
};
```

::: tip
To define multiple functions in a single function plugin, add them all
to the `implementedFunctions` object.

```js
MyCustomPlugin.implementedFunctions = {
  FUNCTION_A: {
    //...
  },
  FUNCTION_B: {
    //...
  },
};
```
:::

### 3. Add your function's names

In a separate object, define your function's names in every
[language](#function-name-translations) that you want to support.

::: tip
Even if you support just a single language, you still need to define a translation for it.
:::

```js
export const MyCustomPluginTranslations = {
  enGB: {
    GREET: 'GREET',
  },
  enUS: {
    GREET: 'GREET',
  },
  // repeat for all languages used in your system
};
```

### 4. Implement your function's logic

In your function plugin, add a method that implements your function's
calculations. Your method needs to:

- Take two optional arguments: `ast` and `state`.
- Return the results of your calculations.

Wrap your implementation in the built-in `runFunction()` method, which:

- Evaluates the arguments of your custom function.
- Validates the number of arguments against the
  [`parameters` array](#function-options).
- Coerces the argument values to types set in the
  [`parameters` array](#argument-validation-options).
- Handles optional arguments and default values according to options set in the
  [`parameters` array](#argument-validation-options).
- Validates the arguments of your custom function against the
  [argument validation options](#argument-validation-options).
- Duplicates the arguments according to the
  [`repeatLastArgs` option](#function-options).
- Handles the [array arithmetic mode](arrays.md#array-arithmetic-mode).
- Performs
  [function vectorization](arrays.md#passing-arrays-to-scalar-functions-vectorization).
- Performs [argument broadcasting](arrays.md#broadcasting).

```js
export class MyCustomPlugin extends FunctionPlugin {
  greet(ast, state) {
    return this.runFunction(
      ast.args,
      state,
      this.metadata('GREET'),
      (firstName) => {
        return `👋 Hello, ${firstName}!`;
      }
    );
  }
}
```

### 5. Register your function plugin

Register your function plugin and its translations so that HyperFormula can
recognize it. You need to do this **before** you create your HyperFormula instance.

Use the
[`registerFunctionPlugin()`](../api/classes/hyperformula.md#registerfunctionplugin)
method:

```js
HyperFormula.registerFunctionPlugin(MyCustomPlugin, MyCustomPluginTranslations);
```

### 6. Use your custom function in a formula

Now, you're ready to use your GREET function in a formula.

```js
// build a HyperFormula instance where you can use your function directly
const hfInstance = HyperFormula.buildFromArray([['Anthony', '=GREET(A1)']]);

// read the value of cell B1
const result = hfInstance.getCellValue({ sheet: 0, col: 1, row: 0 });

// cell B1 should evaluate to 'Anthony'
console.log(result);
```

### Full example

The complete implementation of this custom function is also included in the
[demo](#working-demo).

```js
import { FunctionPlugin, FunctionArgumentType } from 'hyperformula';

export class MyCustomPlugin extends FunctionPlugin {
  greet(ast, state) {
    return this.runFunction(
      ast.args,
      state,
      this.metadata('GREET'),
      (firstName) => {
        return `👋 Hello, ${firstName}!`;
      }
    );
  }
}

MyCustomPlugin.implementedFunctions = {
  GREET: {
    method: 'greet',
    parameters: [{ argumentType: FunctionArgumentType.STRING }],
  },
};

export const MyCustomPluginTranslations = {
  enGB: {
    GREET: 'GREET',
  },
  enUS: {
    GREET: 'GREET',
  },
};

HyperFormula.registerFunctionPlugin(MyCustomPlugin, MyCustomPluginTranslations);
```

## Advanced custom function example

In a more advanced example, we'll create a custom function `DOUBLE_RANGE` that
takes a range of numbers and returns the range of the same size with all the
numbers doubled.

### Accept a range argument

To accept a range argument, declare it in the `parameters` array:

```js
MyCustomPlugin.implementedFunctions = {
  DOUBLE_RANGE: {
    method: 'doubleRange',
    parameters: [{ argumentType: FunctionArgumentType.RANGE }],
  },
};
```

The range arguments are passed to the implementation method as instances of the
[`SimpleRangeValue` class](../api/classes/simplerangevalue.md):

```js
export class MyCustomPlugin extends FunctionPlugin {
  doubleRange(ast, state) {
    return this.runFunction(
      ast.args,
      state,
      this.metadata('DOUBLE_RANGE'),
      (range) => {
        const rangeData = range.data;
        // ...
      }
    );
  }
}
```

### Return an array of data

A function can return multiple values in the form of an [array](arrays.md). To
do that, use [`SimpleRangeValue` class](../api/classes/simplerangevalue.md):

```js
export class MyCustomPlugin extends FunctionPlugin {
  doubleRange(ast, state) {
    return this.runFunction(
      ast.args,
      state,
      this.metadata('DOUBLE_RANGE'),
      (range) => {
        const resultArray = //...
        return SimpleRangeValue.onlyValues(resultArray);
      },
    );
  }
}
```

A function that returns an array will cause the `VALUE!` error unless you also
declare a companion method for the array size. To do that, provide the
`arraySizeMethod` that calculates the size of the result array based on the
function arguments and returns an instance of the
[`ArraySize` class](../api/classes/arraysize.md).

::: tip
When you use your custom function in a formula, `arraySizeMethod` is triggered every time the formula changes, but not when the dependencies of the formula change.
This can cause unexpected behavior if the size of the result array depends on the values in the referenced cells.
:::

```js
export class MyCustomPlugin extends FunctionPlugin {
  doubleRangeResultArraySize(ast, state) {
    const arg = ast?.args?.[0];

    if (arg?.start == null || arg?.end == null) {
      return ArraySize.scalar();
    }

    const width = arg.end.col - arg.start.col + 1;
    const height = arg.end.row - arg.start.row + 1;

    return new ArraySize(width, height);
  }
}

MyCustomPlugin.implementedFunctions = {
  DOUBLE_RANGE: {
    method: 'doubleRange',
    arraySizeMethod: 'doubleRangeResultArraySize',
    parameters: [{ argumentType: FunctionArgumentType.RANGE }],
  },
};
```

### Validate the arguments and return an error

To handle invalid inputs, the custom function should return an instance of the
[`CellError` class](../api/classes/cellerror.md) with the relevant
[error type](types-of-errors.md). Errors are localized according to your
[language settings](localizing-functions.md).

```js
if (rangeData.some((row) => row.some((val) => typeof rawValue !== 'number'))) {
  return new CellError(
    'VALUE',
    'Function DOUBLE_RANGE operates only on numbers.'
  );
}
```

::: tip
All HyperFormula [error types](types-of-errors.md) support optional
custom error messages. Put them to good use: let your users know what caused the
error and how to avoid it in the future.
:::

### Test your function

To make sure your function works correctly, add unit tests. Use a JavaScript
testing library of your choice.

```js
it('works for a range of numbers', () => {
  HyperFormula.registerFunctionPlugin(
    MyCustomPlugin,
    MyCustomPluginTranslations
  );

  const engine = HyperFormula.buildFromArray(
    [[1, '=DOUBLE_RANGE(A1:A3)'], [2], [3]],
    { licenseKey: 'gpl-v3' }
  );

  expect(engine.getCellValue({ sheet: 0, row: 0, col: 1 })).toEqual(2);
  expect(engine.getCellValue({ sheet: 0, row: 1, col: 1 })).toEqual(4);
  expect(engine.getCellValue({ sheet: 0, row: 2, col: 1 })).toEqual(6);
});

it('returns a VALUE error if the range argument contains a string', () => {
  HyperFormula.registerFunctionPlugin(
    MyCustomPlugin,
    MyCustomPluginTranslations
  );

  const engine = HyperFormula.buildFromArray(
    [[1, '=DOUBLE_RANGE(A1:A3)'], ['I should not be here'], [3]],
    { licenseKey: 'gpl-v3' }
  );

  expect(engine.getCellValueType({ sheet: 0, row: 0, col: 1 })).toEqual(
    'ERROR'
  );
  expect(engine.getCellValue({ sheet: 0, row: 0, col: 1 }).value).toEqual(
    '#VALUE!'
  );
});
```

## Working demo

This demo contains the implementation of both the
[`GREET`](#add-a-simple-custom-function) and
[`DOUBLE_RANGE`](#advanced-custom-function-example) custom functions.

<iframe
  :src="`https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/2.7.x/custom-functions?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview&v=${$page.buildDateURIEncoded}`"
  style="width:100%; height:1070px; border:0; border-radius: 4px; overflow:hidden;"
  title="handsontable/hyperformula-demos: react-demo"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts">
</iframe>

## Function options

You can set the following options for your function:

| Option                              | Type    | Description                                                                                                                                                                                                                                   |
|-------------------------------------|---------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `method` (required)                 | String  | Name of the method that implements the custom function logic.                                                                                                                                                                                 |
| `parameters`                        | Array   | Specification of the arguments accepted by the function and their [validation options](#argument-validation-options).                                                                                                                         |
| `arraySizeMethod`                   | String  | Name of the method that calculates the size of the result array. Not required for functions that never return an array.                                                                                                                       |
| `returnNumberType`                  | String  | If the function returns a numeric value, this option indicates how to interpret the returned number.<br/>Possible values: `NUMBER_RAW, NUMBER_DATE, NUMBER_TIME, NUMBER_DATETIME, NUMBER_CURRENCY, NUMBER_PERCENT`.<br/>Default: `NUMBER_RAW` |
| `repeatLastArgs`                    | Number  | For functions with a variable number of arguments: sets how many last arguments can be repeated indefinitely.<br/>Default: `0`                                                                                                                |
| `expandRanges`                      | Boolean | `true`: ranges in the function's arguments are inlined to (possibly multiple) scalar arguments.<br/>Default: `false`                                                                                                                          |
| `isVolatile`                        | Boolean | `true`: the function is [volatile](volatile-functions.md).<br/>Default: `false`                                                                                                                                                               |
| `isDependentOnSheetStructureChange` | Boolean | `true`: the function gets recalculated with each sheet shape change (e.g., when adding/removing rows or columns).<br/>Default: `false`                                                                                                        |
| `doesNotNeedArgumentsToBeComputed`  | Boolean | `true`: the function treats reference or range arguments as arguments that don't create dependency (other arguments are properly evaluated).<br/>Default: `false`                                                                             |
| `arrayFunction`                     | Boolean | `true`: the function enables the [array arithmetic mode](arrays.md) in its arguments and nested expressions.<br/>Default: `false`                                                                                                             |
| `vectorizationForbidden`            | Boolean | `true`: the function will never get [vectorized](arrays.md#passing-arrays-to-scalar-functions-vectorization).<br/>Default: `false`                                                                                                            |

You can set the options in the static `implementedFunctions` property of your
function plugin:

```javascript
MyCustomPlugin.implementedFunctions = {
  MY_FUNCTION: {
    method: 'myFunctionMethod',
    parameters: [
      {
        // your argument validation options
      },
    ],
    arraySizeMethod: 'myArraySizeMethod',
    returnNumberType: 'NUMBER_RAW',
    repeatLastArgs: 0,
    expandRanges: false,
    isVolatile: false,
    isDependentOnSheetStructureChange: false,
    doesNotNeedArgumentsToBeComputed: false,
    arrayFunction: false,
    vectorizationForbidden: false,
  },
};
```

### Argument validation options

You can set the following argument validation options:

| Option                    | Type                                      | Description                                                                                                                                                                                                                                        |
|---------------------------|-------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `argumentType` (required) | `FunctionArgumentType`                    | Expected type of the function argument. See [possible values](#types-of-the-function-argument).                                                                                                                                                    |
| `defaultValue`            | `InternalScalarValue` or `RawScalarValue` | If set: if an argument is missing, its value defaults to `defaultValue`.                                                                                                                                                                           |
| `passSubtype`             | Boolean                                   | `true`: arguments are passed with full type information (e.g., for numbers: `Date` or `DateTime` or `Time` or `Currency` or `Percentage`).<br/>Default: `false`                                                                                    |
| `optionalArg`             | Boolean                                   | `true`: if an argument is missing, and no `defaultValue` is set, the argument defaults to `undefined` (instead of throwing an error).<br/>Default: `false`<br/>Setting this option to `true` is the same as setting `defaultValue` to `undefined`. |
| `minValue`                | Number                                    | If set: numerical arguments need to be greater than or equal to `minValue`.                                                                                                                                                                        |
| `maxValue`                | Number                                    | If set: numerical arguments need to be less than or equal to `maxValue`.                                                                                                                                                                           |
| `lessThan`                | Number                                    | If set: numerical argument needs to be less than `lessThan`.                                                                                                                                                                                       |
| `greaterThan`             | Number                                    | If set: numerical argument needs to be greater than `greaterThan`.                                                                                                                                                                                 |

In your function plugin, in the static `implementedFunctions` property, add an
array called `parameters`:

```js
MyCustomPlugin.implementedFunctions = {
  MY_FUNCTION: {
    method: 'myFunctionMethod',
    parameters: [
      {
        argumentType: FunctionArgumentType.STRING,
        defaultValue: 10,
        passSubtype: false,
        optionalArg: false,
        minValue: 5,
        maxValue: 15,
        lessThan: 15,
        greaterThan: 5,
      },
    ],
  },
};
```

### Types of the function argument

| Type      | Description                                                                                              | Example                                      |
|-----------|----------------------------------------------------------------------------------------------------------|----------------------------------------------|
| `NUMBER`  | A general numeric value such as floating-point number, date/time value, currency value or percent value. | `3`, `3.14`, `$100`, `1939/09/01`, `4:45 AM` |
| `INTEGER` | An integer.                                                                                              | `42`                                         |
| `COMPLEX` | A text representing a complex value.                                                                     | `"-3+4i"`                                    |
| `STRING`  | A text value.                                                                                            | `"aaa"`                                      |
| `BOOLEAN` | A logical value.                                                                                         | `=TRUE()`                                    |
| `NOERROR` | Any non-range and non-error value.                                                                       | All of the above                             |
| `SCALAR`  | Any non-range value.                                                                                     | All of the above                             |
| `RANGE`   | Multiple values as a range of cells or an inline array.                                                  | `A1:B100`, `{1, 2}`                          |
| `ANY`     | Any value.                                                                                               | All of the above                             |

### Handling missing arguments

Both the `defaultValue` and `optionalArg` options let you decide what happens
when a user doesn't pass enough valid arguments to your custom function.

Setting a `defaultValue` for an argument always makes that argument optional.
But, the `defaultValue` option automatically replaces any missing arguments with
`defaultValue`, so your custom function is unaware of the actual number of valid
arguments passed.

If you don't want to set any `defaultValue` (because, for example, your
function's behavior depends on the number of valid arguments passed), use the
`optionalArg` setting instead.

## Function name translations

You can add translations of your function's name in multiple languages. Your end
users use the translated names to call your function inside formulas.

In a separate object, define the translations of your custom functions' names in
every language you want to support. Function names are case-insensitive, as they
are all normalized to uppercase.

::: tip
Even if you support just a single language, you still need to define a translation for it.
:::

```js
export const MyCustomPluginTranslations = {
  enGB: {
    // formula in English: `=MY_FUNCTION()`
    MY_FUNCTION: 'MY_FUNCTION',
  },
  deDE: {
    // formula in German: `=MEINE_FUNKTION()`
    MY_FUNCTION: 'MEINE_FUNKTION',
  },
  // repeat for all languages used in your system
};

// register your function plugin and translations
HyperFormula.registerFunctionPlugin(MyCustomPlugin, MyCustomPluginTranslations);
```

::: tip
Before using a translated function name, remember to
[register and set the language](localizing-functions.md).
:::

## Function aliases

You can also assign multiple aliases to a single custom function.

In your function plugin, in the static `aliases` property, add aliases for your
function:

```js
MyCustomPlugin.aliases = {
  // `=MY_ALIAS()` will work the same as `=MY_FUNCTION()`
  MY_ALIAS: 'MY_FUNCTION',
};
```

::: tip
For each alias of your function, define a translation, even if you want
to support only one language.

```js
MyCustomPlugin.translations = {
  enGB: {
    MY_FUNCTION: 'MY_FUNCTION',
    MY_ALIAS: 'MY_ALIAS',
  },
};
```
:::
