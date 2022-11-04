# Localizing functions

You can localize a function's ID and error
messages. Currently, the library supports 17 languages with British English
as the default.

To change the language all you need to do is import and
register the language like so:

```javascript
// import the French language pack
import frFR from 'hyperformula/es/i18n/languages/frFR';

// register the language
HyperFormula.registerLanguage('frFR', frFR);
```

::: tip
To import the language packs, use the module-system-specific dedicated bundles at:
* **ES**: `hyperformula/es/i18n/languages/`
* **CommonJS**: `hyperformula/commonjs/i18n/languages/`
* **UMD**: `hyperformula/dist/languages/`

For the UMD build, the languages are accessible through `HyperFormula.languages`, e.g. `HyperFormula.languages.frFR`.
:::

Then set it inside it the [configuration options](configuration-options.md):

```javascript
// configure the instance
const options = {
  language: 'frFR'
};
```

Language pack names should be passed as strings. They follow a
naming convention that incorporates two standards: ISO-639 and
ISO-3166-1. The pattern is `languageCOUNTRY`, for
example `enUS`, `enGB`, `frFR`,  etc.

You can freely use the localized names: `SUM` can be written as
`SOMME` and the functionality of the function will remain the same.

Here are some example functions and their translations in French:

```javascript
// localized functions
functions: {
  MATCH: 'EQUIV',
  CORREL: 'COEFFICIENT.CORRELATION',
  AVERAGE: 'MOYENNE'
},
```

Same goes for the [errors](types-of-errors.md) displayed inside
cells when something goes wrong:

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
}
```

## Localizing custom functions

You can translate your own [custom functions](custom-functions) into
different languages too. You need to define the translations and register the corresponding language pack after registering a plugin:

```javascript
const translations = {
  'enGB': {
    'HYPER': 'HYPER'
  },
  'enUS': {
    'HYPER': 'HYPER'
  },
  'plPL': {
    'HYPER': 'HAJPER'
  }
}
```

### List of supported languages
| Language name    | Language code |
|:-----------------|:--------------|
| British English  | enGB          |
| American English | enUS          |
| Czech            | csCZ          |
| Danish           | daDK          |
| Dutch            | nlNL          |
| Finnish          | fiFI          |
| French           | frFR          |
| German           | deDE          |
| Hungarian        | huHU          |
| Italian          | itIT          |
| Norwegian        | nbNO          |
| Polish           | plPL          |
| Portuguese       | ptPT          |
| Russian          | ruRU          |
| Spanish          | esES          |
| Swedish          | svSE          |
| Turkish          | trTR          |

## Demo

<iframe
  src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/2.1.x/localizing-functions?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview"
  style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
  title="handsontable/hyperformula-demos: localizing-functions"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts">
</iframe>
