# Localizing functions

You can [localize a function's](../formula-reference/built-in-functions.md) ID and error messages. Currently, the library supports 16 languages with English as the default.

To change the default language all you need to do is to import and register the language like so:

```javascript
// import the French language pack
import { frFR } from 'hyperformula';

// register the language
HyperFormula.registerLanguage('frFR', frFR);
```

Then set it inside it the [configuration options](../getting-started/configuration-options.md):

```javascript
// configure the instance
const options = {
    language: 'frFR'
};
```

Language packs names should be passed as a string. They follow a naming convention that incorporates two standards: ISO-639 and ISO-3166-1. The pattern looks like this: `languageCOUNTRY` for example: `nbNO`, `frFR`, `enGB` etc.

You can freely use the localized names: `SUM` can be written as `SOMME` and the functionality of the function will remain the same. 

Here are some example functions and their translations in French:

```javascript
// localized functions
 functions: {
   MATCH: 'EQUIV',
   CORREL: 'COEFFICIENT.CORRELATION',
   AVERAGE: 'MOYENNE'
 },
```

Same goes for the [errors](../formula-reference/types-of-errors.md) displayed inside cells when something goes wrong:

```javascript
// localized errors
  errors: {
    CYCLE: '#CYCLE!',
    DIV_BY_ZERO: '#DIV/0!',
    ERROR: '#ERROR!',
    NA: '#N/A',
    NAME: '#NOM?',
    NUM: '#NOMBRE!',
    REF: '#REF!',
    VALUE: '#VALEUR!',
  },
```

### Localizing custom functions

You can translate your own [custom functions](../advanced-topics/creating-custom-functions.md) into different languages, too. You need to define them and register while registering a plugin:

```javascript
const translations = {
    'enGB': {
      'HYPER': 'HYPER'
    },
    'plPL': {
      'HYPER': 'HAJPER'
    }
  }
```

### Demo

{% embed url="https://githubbox.com/handsontable/hyperformula-demos/tree/develop/localizing-functions" %}



