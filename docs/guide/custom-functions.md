# Custom functions

HyperFormula enables you to create custom functions you may want to use your application.

This guide explains step-by-step how to create a custom function that returns the number of letters in the word 'HyperFormula'. It will be later on invoked by typing `"=HYPER()"` or `"=HAJPER()"` \(localized to Polish\).

HyperFormula doesn't enforce a naming convention of the function. However, all names will be normalized to the upper-case, so they are not case-sensitive.

### Custom class definition

First, you need to import `FunctionPlugin` and extend it with your own class. Here is how you can do that:

```javascript
// import the FunctionPlugin
import { FunctionPlugin } from 'hyperformula';

// start creating a class
class CountHF extends FunctionPlugin {

}
```

### implementedFunction property

Your newly created class should have a static `implementedFunctions` property that defines functions this plugin contains. This will keep a set of functions names that call corresponding methods.

The keys are canonical function IDs which are also used to find corresponding translations in translation packages. Inside of them, there is also an object which contains the corresponding method. 

Optionally, you can precise if your function is volatile or not \(false as a default means that it is not defined\).

```javascript
// import the FunctionPlugin
import { FunctionPlugin } from 'hyperformula';

// start creating a class
class CountHF extends FunctionPlugin {

// define functions inside this plugin
  public static implementedFunctions = {
    'HYPER': {
    // this method functionality will be defined in next step
      method: 'hyper',
    // optionally, mark your function as volatile
      isVolatile: true,
    }
  };
}
```

### Translations

There are **two ways** of adding a translation of the custom function. 

In the **first one**, you can define translations in your function plugin as a static.

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

In the **second one**, you can keep your translation in any file you want as a const and import it upon registering the plugin \(or with a whole translation package\).

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

### Implementing the function

For the simplicity of a basic example, you will not pass any arguments. However, this method imposes a particular structure to be used - there are two optional arguments: `ast` and `formulaAddress`, and the function must return the results of the calculations.

```javascript
// here arguments are displayed just to show the structure
public hyper(ast, formulaAddress) {
    return 'Hyperformula'.length;
  }
};
```

### A complete example of the class definition

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

### Registering a custom function

After having this set up you can finally use the newly created function. You need to register it first by using `registerFunctionPlugin` like so:

```javascript
 import { myTranslations } from '/myTranslationFile';
 
 HyperFormula.registerFunctionPlugin(CountHF, myTranslations);
```

### Using custom function

This is a short snippet that sums up how to use the custom function along with translations.

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

// read the value of A1 cell
const A1Value = hfInstance.getCellValue({ sheet: 0, col: 0, row: 0 });

// use the console to see the results!
console.log(A1Value);
```

### Demo

\[ DEMO \]

