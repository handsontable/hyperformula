# Custom functions

HyperFormula enables you to create custom functions you may want to
use in your application.

This guide explains step-by-step how to create a custom function that
returns the number of letters in the word 'HyperFormula'. It will be
invoked by typing `"=HYPER()"` or `"=HAJPER()"` (localized to Polish).

HyperFormula doesn't enforce a naming convention of the function.
However, all names will be normalized to the upper-case, so they
are not case-sensitive.

## Custom class definition

First, you need to import `FunctionPlugin` and extend it with your
own class. Here is how you can do that:

```javascript
// import FunctionPlugin
import { FunctionPlugin } from 'hyperformula';

// start creating a class
export class CountHF extends FunctionPlugin {

}
```

## implementedFunction property

Your newly created class should have a static `implementedFunctions`
property that defines functions this plugin contains. This will keep
a set of function names that call corresponding methods.

The keys are canonical function IDs which are also used to find
corresponding translations in translation packages. Inside of them,
there is also an object which contains the corresponding method.

```javascript
import { FunctionPlugin } from 'hyperformula';

export class CountHF extends FunctionPlugin {

  // define functions inside this plugin
  public static implementedFunctions = {
    'HYPER': {
      // this method's functionality will be defined below
      method: 'hyper',
    }
  }
}
```

### Optional parameters

Using optional parameters, you can configure your function to:
* Use the [array arithmetic mode](arrays.md)
* Treat reference or range arguments as arguments that don't create dependency
* Inline range arguments to scalar arguments
* Get recalculated with each sheet shape change
* Be a [volatile](volatile-functions.md) function
* Repeat indefinitely a specified number of last arguments
* Never get vectorized

```javascript
import { FunctionPlugin } from 'hyperformula';

export class CountHF extends FunctionPlugin {

  public static implementedFunctions = {
    'HYPER': {
      method: 'hyper',
      // set your optional parameters
      arrayFunction: false,
      doesNotNeedArgumentsToBeComputed: false,
      expandRanges: false,
      isDependentOnSheetStructureChange: false,
      isVolatile: true,
      repeatLastArgs: 4,
    }
  }
}
```

You can set the following optional parameters:

| Option | Type | Description |
| --- | --- | --- |
| `arrayFunction` | Boolean | If set to `true`, the function enables the [array arithmetic mode](arrays.md) in its arguments and nested expressions. |
| `doesNotNeedArgumentsToBeComputed` | Boolean | If set to `true`, the function treats reference or range arguments as arguments that don't create dependency.<br><br>Other arguments are properly evaluated. |
| `expandRanges` | Boolean | If set to `true`, ranges in the function's arguments are inlined to (possibly multiple) scalar arguments. |
| `isDependentOnSheetStructureChange` | Boolean | If set to `true`, the function gets recalculated with each sheet shape change (e.g. when adding/removing rows or columns). |
| `isVolatile` | Boolean | If set to `true`, the function is [volatile](volatile-functions.md). |
| `repeatLastArgs` | Number | For functions with a variable number of arguments: sets how many last arguments can be repeated indefinitely. |

### Argument validation options

In an optional `parameters` object, you can set rules for your function's argument validation.

```javascript
import { FunctionPlugin } from 'hyperformula';

export class CountHF extends FunctionPlugin {

  public static implementedFunctions = {
    'HYPER': {
      method: 'hyper',
      // set your argument validation options
      parameters: {
        passSubtype: false,
        defaultValue: 10,
        optionalArg: false,
        minValue: 5,
        maxValue: 15,
        lessThan: 15,
        greaterThan: 5
      },
    }
  }
}
```

You can set the following argument validation options:

| Parameter | Type | Description |
| --- | --- | --- |
| `passSubtype` | Boolean | If set to `true`, arguments are passed with full type information.<br>(e.g. for numbers: `Date` or `DateTime` or `Time` or `Currency` or `Percentage`) |
| `defaultValue` | `InternalScalarValue` \| `RawScalarValue` | If set to any value: if an argument is missing, its value defaults to `defaultValue`. |
| `optionalArg` | Boolean | If set to `true`: if an argument is missing, and no `defaultValue` is set, the argument defaults to `undefined` (instead of throwing an error).<br><br>Setting this option to `true` is the same as setting `defaultValue` to `undefined`. |
| `minValue` | Number | If set, numerical arguments need to be greater than or equal to `minValue`. |
| `maxValue` | Number | If set, numerical arguments need to be less than or equal to `maxValue`. |
| `lessThan` | Number | If set, numerical argument need to be less than `lessThan`. |
| `greaterThan` | Number | If set, numerical argument need to be greater than `greaterThan`. |

#### Handling missing arguments

The `defaultValue` and `optionalArg` options let you decide what happens when a user doesn't pass enough valid arguments to your custom function.

Setting a `defaultValue` for an argument always makes that argument optional.

But, the `defaultValue` option automatically replaces any missing arguments with `defaultValue`, so your custom function is not aware of the actual number of valid arguments passed.

If you don't want to set any `defaultValue` (because, for example, your function's behavior depends on the number of valid arguments passed), you can use the `optionalArg` setting.

## Aliases

Aliases are available since the <Badge text="v0.4.0"  vertical="middle"/> version.

If you want to include aliases (multiple names to a single implemented function) inside the plugin,
you can do this with the static `aliases` property.

The property is keyed with aliases IDs, and with values being aliased functions IDs.

```javascript
import { FunctionPlugin } from 'hyperformula';

export class CountHF extends FunctionPlugin {

  public static implementedFunctions = {
    'HYPER': {
      method: 'hyper',
    }
  }
  
  public static aliases = {
    'HYPER.ALIAS': 'HYPER'
    // HYPER.ALIAS is now an alias to HYPER
  }
}
```

## Translations

There are **two ways** of adding a translation of the custom function.

In the **first one**, you can define translations in your function
plugin as a static.

```javascript
import { FunctionPlugin } from 'hyperformula';

export class CountHF extends FunctionPlugin {

  public static implementedFunctions = {
    'HYPER': {
      method: 'hyper',
    }
  }
  
  public static aliases = {
    'HYPER.ALIAS': 'HYPER'
  }
  
  // add your translations
  public static translations = {
    'enGB': {
      'HYPER': 'HYPER'
    },
    'plPL': {
      'HYPER': 'HAJPER'
    }
  }
}
```

In the **second one**, you can keep your translation in any file you
want as a constant and import it upon registering the plugin
(or with a whole translation package).

```javascript
// inside your translations file
export const myTranslations = {
  'enGB': {
    'HYPER': 'HYPER'
  },
  'plPL': {
    'HYPER': 'HAJPER'
  }
}
```

## Implementing your custom function

For the simplicity of a basic example, you will not pass any
arguments. However, this method imposes a particular structure to
be used; there are two optional arguments, `ast` and
`state`, and the function must return the results of
the calculations.

```javascript
import { FunctionPlugin } from 'hyperformula';

export class CountHF extends FunctionPlugin {

  public static implementedFunctions = {
    'HYPER': {
      method: 'hyper',
    }
  }
  
  public static aliases = {
    'HYPER.ALIAS': 'HYPER'
  }
  
  public static translations = {
    'enGB': {
      'HYPER': 'HYPER'
    },
    'plPL': {
      'HYPER': 'HAJPER'
    }
  }
  
  // implement your custom function
  // arguments here are displayed just to show the structure
  public hyper(ast, state) {
    return 'Hyperformula'.length;
  }
}
```

### `runFunction()`

Wrap your custom function in the built-in `runFunction()` method.

The `runFunction()` method wraps your function's calculations and:
- Validates the [optional parameter](#optional-parameters) settings
- Validates the arguments against your [argument validation options](#argument-validation-options)
- Checks if values returned by your function are in the right format

```javascript
import { FunctionPlugin } from 'hyperformula';

export class CountHF extends FunctionPlugin {

  public static implementedFunctions = {
    'HYPER': {
      method: 'hyper',
    }
  }
  
  public static aliases = {
    'HYPER.ALIAS': 'HYPER'
  }
  
  public static translations = {
    'enGB': {
      'HYPER': 'HYPER'
    },
    'plPL': {
      'HYPER': 'HAJPER'
    }
  }
  
  // wrap your custom function in `runFunction()`
  public hyper(ast, state) {
    return this.runFunction(ast, state, this.metadata('HYPER'),
    () => 'Hyperformula'.length)
  }
}
```

### Returning errors

If you want your custom function to return an error, check the [API reference](../api) for the HyperFormula [error types](types-of-errors.md).

:::tip
All HyperFormula [error types](types-of-errors.md) support optional custom error messages. Put them to good use: let your users know what caused the error and how to avoid it in the future.
:::

For example, if you want to return a `#DIV/0!` error with your custom error message, use the [`CellError` class](../api/classes/cellerror.md), and the [DIV_BY_ZERO](../api/enums/errortype.md#div-by-zero) error type:

```javascript
// import `CellError` and `ErrorType`
import { FunctionPlugin, CellError, ErrorType } from "hyperformula";

export class CountHF extends FunctionPlugin {

  public static implementedFunctions = {
    'HYPER': {
      method: 'hyper',
    }
  }
  
  public static aliases = {
    'HYPER.ALIAS': 'HYPER'
  }
  
  public static translations = {
    'enGB': {
      'HYPER': 'HYPER'
    },
    'plPL': {
      'HYPER': 'HAJPER'
    }
  }

public hyper({ args }) {
  if (!args.length) {
    // create a `CellError` instance with an `ErrorType` of `DIV_BY_ZERO`
    // with your custom error message (optional)
    return new CellError(ErrorType.DIV_BY_ZERO, 'Sorry, cannot divide by zero!');
  }
  
  return this.runFunction(() => 'Hyperformula'.length)
}
```

The error displays as `#DIV/0`, and gets properly translated.

#### Error localization

Errors returned by methods such as `getCellValue` are wrapped in the [`DetailedCellError` type](../api/classes/detailedcellerror.md).

`DetailedCellError` localizes the error based on your [internationalization settings](localizing-functions.md).

## A complete example of the class definition

To sum up, here is a complete example of a custom `CountHF` class:

```javascript
import { FunctionPlugin, CellError, ErrorType } from "hyperformula";

export class CountHF extends FunctionPlugin {

  public static implementedFunctions = {
    'HYPER': {
      method: 'hyper',
    }
  }
  
  public static aliases = {
    'HYPER.ALIAS': 'HYPER'
  }
  
  public static translations = {
    'enGB': {
      'HYPER': 'HYPER'
    },
    'plPL': {
      'HYPER': 'HAJPER'
    }
  }
  
  public hyper({ args }) {
    if (!args.length) {
      return new CellError(ErrorType.DIV_BY_ZERO, 'Sorry, cannot divide by zero!');
    }
    
    return this.runFunction(() => 'Hyperformula'.length)
  }
}
```

## Registering a custom function

Before you can use the newly created function, you need to
register it by using `registerFunctionPlugin` like so:

```javascript
HyperFormula.registerFunctionPlugin(CountHF, CountHF.translations);
```

## Using a custom function

This is a short snippet that sums up how to use the custom function
along with translations.

```javascript
import Hyperformula, { plPL } from 'hyperformula';
import { CountHF } from './file_with_your_custom_function';

// register the language
HyperFormula.registerLanguage('plPL', plPL);

// register your custom plugin and the translation
HyperFormula.registerFunctionPlugin(CountHF, CountHF.translations);

// build HF instance where you can use the function directly
const hfInstance = HyperFormula.buildFromArray([['=HAJPER()']]);

// read the value of cell A1
const A1Value = hfInstance.getCellValue({ sheet: 0, col: 0, row: 0 });

// open the browser's console to see the results
console.log(A1Value);
```

## Demo

<iframe
     src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/1.3.x/custom-functions?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="handsontable/hyperformula-demos: custom-functions"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>
