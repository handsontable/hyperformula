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
class CountHF extends FunctionPlugin {

}
```

## implementedFunction property

Your newly created class should have a static `implementedFunctions`
property that defines functions this plugin contains. This will keep
a set of function names that call corresponding methods.

The keys are canonical function IDs which are also used to find
corresponding translations in translation packages. Inside of them,
there is also an object which contains the corresponding method.

Optionally, you can specify if your function is volatile or not
(`false` as a default means that it is not defined).

```javascript
// import FunctionPlugin
import { FunctionPlugin } from 'hyperformula';

// start creating a class
class CountHF extends FunctionPlugin {

// define functions inside this plugin
  public static implementedFunctions = {
    'HYPER': {
    // this method's functionality will be defined in the next step
      method: 'hyper',
    // optionally, mark your function as volatile
      isVolatile: true,
    }
  };
}
```
## Aliases

If you want to include aliases (multiple names to a single implemented function) inside the plugin,
you can do this by the static `aliases` property.

The property is keyed with aliases IDs, and with values being aliased functions IDs.

```javascript
// import FunctionPlugin
import { FunctionPlugin } from 'hyperformula';

// start creating a class
class CountHF extends FunctionPlugin {

// define functions inside this plugin
  public static implementedFunctions = {
    'HYPER': {
    // this method's functionality will be defined in the next step
      method: 'hyper',
    }
  };
  public static aliases = {
    'HYPER.ALIAS': 'HYPER'
  //HYPER.ALIAS is now an alias to HYPER
  };
}
```
## Translations

There are **two ways** of adding a translation of the custom function.

In the **first one**, you can define translations in your function
plugin as a static.

```javascript
 public static translations = {
    'enGB': {
      'HYPER': 'HYPER'
    },
    'plPL': {
      'HYPER': 'HAJPER'
    }
  }
```

In the **second one**, you can keep your translation in any file you
want as a constant and import it upon registering the plugin
(or with a whole translation package).

```javascript
// inside your file with translation
export const myTranslations = {
    'enGB': {
      'HYPER': 'HYPER'
    },
    'plPL': {
      'HYPER': 'HAJPER'
    }
  }
```

## Implementing the function

For the simplicity of a basic example, you will not pass any
arguments. However, this method imposes a particular structure to
be used; there are two optional arguments, `ast` and
`formulaAddress`, and the function must return the results of
the calculations.

```javascript
// arguments here are displayed just to show the structure
public hyper(ast, formulaAddress) {
    return 'Hyperformula'.length;
  }
};
```

## A complete example of the class definition

To sum up, here is a complete example of a custom `CountHF` class:

```javascript

import { FunctionPlugin } from 'hyperformula';

export class CountHF extends FunctionPlugin {

  public static implementedFunctions = {
    'HYPER': {
      method: 'hyper',
    }
  };

  public hyper(ast, formulaAddress) {
    return 'Hyperformula'.length
    }
  };
}
```

## Registering a custom function

Before you can use the newly created function, you need to
register it by using `registerFunctionPlugin` like so:

```javascript
 import { myTranslations } from '/myTranslationFile';

 HyperFormula.registerFunctionPlugin(CountHF, myTranslations);
```

## Using a custom function

This is a short snippet that sums up how to use the custom function
along with translations.

```javascript
import Hyperformula, { plPL } from 'hyperformula';
import { CountHF } from './file_with_your_custom_function';
import { myTranslations } from '/myTranslationFile';

// register the language
HyperFormula.registerLanguage('plPL', plPL);

// register your custom plugin and the translation
HyperFormula.registerFunctionPlugin(CountHF, myTranslations);

// build HF instance where you can use the function directly
const hfInstance = HyperFormula.buildFromArray([['=HAJPER()']]);

// read the value of cell A1
const A1Value = hfInstance.getCellValue({ sheet: 0, col: 0, row: 0 });

// open the browser's console to see the results
console.log(A1Value);
```

## Demo

<iframe
     src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/0.3.x/custom-functions?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="handsontable/hyperformula-demos: custom-functions"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>
