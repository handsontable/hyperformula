# Compatibility

HyperFormula is designed to follow the [OpenDocument Standard](https://docs.oasis-open.org/office/OpenDocument/v1.3/os/part4-formula/OpenDocument-v1.3-os-part4-formula.html)
while maintaining the compatibility with other popular spreadsheet software:
- _Microsoft Excel_,
- _Google Sheets_.

In certain situations, it is not possible to be consistent with all 3 products due to:
* inconsistencies between OpenDocument Standard, _Microsoft Excel_ and _Google Sheets_,
* limitations of _Microsoft Excel_ or _Google Sheets_,
* [technical limitations](technical-limitations.md) of HyperFormula in its current development stage.

## Configuration

#### Separator characters

In other spreadsheet software separators depend on the configured language and locale. You might want to set them up according to your internationalization settings.

_Microsoft Excel_ for en-US locale uses `,` (a comma) as both function argument separator and thousands separator and applies a context-based heuristic check to distinguish between them. HyperFormula requires `functionArgSeparator` and `thousandSeparator` to be different from each other, hence it is not possible to achieve the full compatibility with _Microsoft Excel_ with American English locale.

In HyperFormula separator characters can be configured using the following parameters:
- [functionArgSeparator](../api/interfaces/configparams.md#functionargseparator),
- [decimalSeparator](../api/interfaces/configparams.md#decimalseparator),
- [thousandSeparator](../api/interfaces/configparams.md#thousandseparator),
- [arrayRowSeparator](../api/interfaces/configparams.md#arrayrowseparator),
- [arrayColumnSeparator](../api/interfaces/configparams.md#arraycolumnseparator).

#### Date and time formats

Date and time formats are also locale-dependent. The easiest way to configure them in HyperFormula is by setting the following parameters:
- [dateFormats](../api/interfaces/configparams.md#dateFormats),
- [timeFormats](../api/interfaces/configparams.md#timeFormats),
- [nullYear](../api/interfaces/configparams.md#nullYear).

However, not all date and time formats can be configured that way. If you want to add a custom format, you can implement the following methods:
- [parseDateTime](../api/interfaces/configparams.md#parseDateTime),
- [stringifyDateTime](../api/interfaces/configparams.md#stringifyDateTime),
- [stringifyDuration](../api/interfaces/configparams.md#stringifyDuration).

#### Comparing strings

In _Microsoft Excel_, string comparison is by default **case-insensitive** and **accent-sensitive**.

Parameters related to the [string comparison](types-of-operators.md#comparing-strings) in HyperFormula:
- [caseSensitive](../api/interfaces/configparams.md#casesensitive),
- [accentSensitive](../api/interfaces/configparams.md#accentsensitive),
- [caseFirst](../api/interfaces/configparams.md#casefirst),
- [ignorePunctuation](../api/interfaces/configparams.md#ignorepunctuation),
- [localeLang](../api/interfaces/configparams.md#localelang).

#### Criterion parameter 

The criterion parameter in functions `SUMIF`, `COUNTIF`, etc. is interpreted according to the configuration options:
- [matchWholeCell](../api/interfaces/configparams.md#matchwholecell),
- [useRegularExpressions](../api/interfaces/configparams.md#useregularexpressions),
- [useWildcards](../api/interfaces/configparams.md#usewildcards).

The default values for these options make HyperFormula behave consistently with _Microsoft Excel_. 

#### `TRUE` and `FALSE` constants

_Microsoft Excel_ has 2 constant values (keywords) for the boolean values `TRUE` and `FALSE`. In HyperFormula the same effect can be achieved by defining them as named expressions using functions [TRUE() and FALSE()](built-in-functions.md):

```js
hfInstance.addNamedExpression('TRUE', '=TRUE()');
hfInstance.addNamedExpression('FALSE', '=FALSE()');
```

#### Array arithmetics

_Microsoft Excel_, unlike _Google Sheets_, has array arithmetics enabled by default. In HyperFormula it can be configured by setting [useArrayArithmetic](../api/interfaces/configparams.md#useArrayArithmetic) to `true`.

#### Handling whitespace inside formulas

_Microsoft Excel_ ignores all whitespace characters inside formulas. In HyperFormula it can be configured by setting [ignoreWhiteSpace](../api/interfaces/configparams.md#ignoreWhiteSpace) to `'any'`.

#### Handling formulas that evaluate to an empty value

Some formulas might evaluate to an empty value (null). To be consistent with _Microsoft Excel_, HyperFormula must be configured to treat the result of such formulas as zero. For that you can use the [evaluateNullToZero](../api/interfaces/configparams.md#evaluatenulltozero) option.

#### Leap year bug

_Microsoft Excel_ incorrectly acts as if year 1900 were a leap year. This behavior can be mimicked in HyperFormula by setting the following configuration parameters:
- [leapYear1900](../api/interfaces/configparams.md#leapyear1900),
- [nullDate](../api/interfaces/configparams.md#nulldate).

#### Numerical precision

Both HyperFormula and _Microsoft Excel_ perform the automatic rounding of the floating-point numbers. This feature can be controlled using options:
- [smartRounding](../api/interfaces/configparams.md#smartrounding),
- [precisionEpsilon](../api/interfaces/configparams.md#precisionepsilon).

### Full config for the compatibility with _Microsoft Excel_

::: tip
This configuration makes HyperFormula mimic the default behavior of _Microsoft Excel_ with en-US locale (American English) as closely as possible given the limitations at the current development stage.
:::

```js
// define options
const options = {
  functionArgSeparator: ',', // SAME AS DEFAULT
  decimalSeparator: '.', // SAME AS DEFAULT
  thousandSeparator: '', // SAME AS DEFAULT
  arrayColumnSeparator: ',', // SAME AS DEFAULT
  arrayRowSeparator: ';', // SAME AS DEFAULT
  dateFormats: ['MM/DD/YYYY', 'MM/DD/YY', 'YYYY/MM/DD'],
  timeFormats: ['hh:mm', 'hh:mm:ss.sss'], // SAME AS DEFAULT
  nullYear: 30, // SAME AS DEFAULT
  caseSensitive: false, // SAME AS DEFAULT
  accentSensitive: true,
  ignorePunctuation: false, // SAME AS DEFAULT 
  localeLang: 'en', // SAME AS DEFAULT
  useWildcards: true, // SAME AS DEFAULT
  useRegularExpressions: false, // SAME AS DEFAULT
  matchWholeCell: true, // SAME AS DEFAULT
  useArrayArithmetic: true,
  ignoreWhiteSpace: 'any',
  evaluateNullToZero: true,
  leapYear1900: true,
  nullDate: { year: 1899, month: 12, day: 31 },
  smartRounding: true, // SAME AS DEFAULT
};

// call the static method to build a new instance
const hfInstance = HyperFormula.buildEmpty(options);

// define TRUE and FALSE constants
hfInstance.addNamedExpression('TRUE', '=TRUE()');
hfInstance.addNamedExpression('FALSE', '=FALSE()');
```

## Incompatibilities with other popular spreadsheet software

### General functionalities

Here is a non-exclusive list of implementation differences between HyperFormula, _Google Sheets_ and _Microsoft Excel_.

| Functionality                                      | Examples                                                                  | HyperFormula                                                                                                                                                                                                                                                                                           | Google Sheets                                                                                                                     | Microsoft Excel                                          |
|----------------------------------------------------|---------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------|
| Dependency collection                              | A1:=IF(FALSE(),A1,0)<br><br>ISREF(A1)                                     | Dependencies are collected during the parsing phase which finds cycles that wouldn’t appear in the evaluation.<br><br>`CYCLE` error for both examples.                                                                                                                                                 | Dependencies are collected during evaluation.<br><br>`0` for both examples.                                                       | Same as _Google Sheets_.                                 |
| Named expressions and named ranges                 | SALARY:=$A$10 COST:=10*$B$5+100<br>PROFIT:=SALARY-COST<br>A1:=SALARY-COST | Only absolute addresses are allowed<br>(e.g. SALARY:= $A$10).<br><br>Named expressions can be global or scoped to one sheet only.<br><br>They can contain other named expressions.                                                                                                                     | Named expressions are not available.<br><br>Named ranges can be used to create aliases for addresses and ranges.                  | Named ranges and scoped named expressions are available. |
| Applying a scalar value to a function taking range | COLUMNS(A1)                                                               | `CellRangeExpected` error.                                                                                                                                                                                                                                                                             | Treats the element as length-1 range. Returns 1 for the example.                                                                  | Same as _Google Sheets_.                                 |
| Coercion of explicit arguments                     | VARP(2, 3, 4, TRUE(), FALSE(), "1",)                                      | 1.9592, based on the behavior of _Microsoft Excel_.                                                                                                                                                                                                                                                    | GoogleSheets implementation is not consistent with the standard (see also VAR.S, STDEV.P and STDEV.S function.)                   | 1,9592                                                   |
| Ranges created with `:`                            | A1:A2<br><br>A$1:$A$2<br><br>A:C<br><br>1:2<br><br>Sheet1!A1:A2           | Allowed ranges consist of two addresses (A1:B5), columns (A:C) or rows (3:5).<br>They cannot be mixed or contain named expressions.                                                                                                                                                                    | Everything allowed.                                                                                                               | Same as _Google Sheets_.                                 |
| Formatting inside the TEXT function                | TEXT(A1,"dd-mm-yy")<br><br>TEXT(A1,"###.###”)                             | Not all formatting options are supported,<br>e.g. only some date formatting options: (`hh`, `mm`, `ss`, `am`, `pm`, `a`, `p`, `dd`, `yy`, and `yyyy`).<br><br>No currency formatting inside the TEXT function.                                                                                         | A wide variety of options for string formatting is supported.                                                                     | Same as _Google Sheets_.                                 |
| Enabling array arithmetic                          | =ARRAYFORMULA(A2:A5*B2:B5)                                                | By default, array arithmetic is disabled globally.<br><br>The ARRAYFORMULA function enables array arithmetic for the formula inside the function.<br><br>To enable array arithmetic globally, [set the `useArrayArithmetic` option to `true`](../api/interfaces/configparams.html#usearrayarithmetic). | By default, array arithmetic is disabled globally.<br><br>The ARRAYFORMULA function enables array arithmetic inside the function. | By default, array arithmetic is enabled globally.        |
| Cell references inside inline arrays               | ={A1, A2}                                                                 | The array's value is calculated but not updated when the cells' values change.                                                                                                                                                                                                                         | The array's value is calculated and updated when the cells' values change.                                                        | ERROR: invalid array                                     |
| SPLIT function                                     | =SPLIT("Lorem ipsum dolor", 0)                                            | This function works differently from _Google Sheets_ version but should be sufficient to achieve the same functionality in most scenarios. Read SPLIT function description on [the Built-in Functions page](built-in-functions.html#text).                                                             | Different syntax and return value.                                                                                                | No such function.                                        |

### Built-in functions

Some built-in functions are implemented differently than in _Google Sheets_ or _Microsoft Excel_.

To remove the differences, you can create custom implementations of those functions.

| Function      | Example                                                     | HyperFormula | Google Sheets | Microsoft Excel |
|---------------|-------------------------------------------------------------|-------------:|--------------:|----------------:|
| TBILLEQ       | =TBILLEQ(0, 180, 1.9)                                       |      38,5278 |           NUM |             NUM |
| TBILLEQ       | =TBILLEQ(0, 180, 2)                                         |       0,0000 |           NUM |          0,0000 |
| TBILLEQ       | =TBILLEQ("1/2/2000", "31/1/2001", 0.1)                      |       0,1128 |         VALUE |           VALUE |
| TBILLEQ       | =TBILLEQ(0, 360, 0.1)                                       |       0,1127 |        0,1097 |          0,1097 |
| TBILLEQ       | =TBILLEQ(0, 365, 0.1)                                       |       0,1128 |        0,1098 |          0,1098 |
| GCD           | =GCD(1000000000000000000.0)                                 |          NUM |         1E+18 |             NUM |
| COMBIN        | =COMBIN(1030, 0)                                            |          NUM |           NUM |          1,0000 |
| RRI           | =RRI(1, -1, -1)                                             |       0,0000 |           NUM |          0,0000 |
| DAYS          | =DAYS(-1, 0)                                                |          NUM |       -1,0000 |             NUM |
| DAYS          | =DAYS(0, -1)                                                |          NUM |        1,0000 |             NUM |
| DATEDIF       | =DATEDIF(-1, 0, "Y")                                        |          NUM |        0,0000 |             NUM |
| RATE          | =RATE(12, -100, 400, 0, 1)                                  |      -1,0000 |           NUM |             NUM |
| LCMP          | =LCM(1000000, 1000001, 1000002, 1000003)                    |          NUM |   5,00003E+23 |             NUM |
| TBILLPRICE    | =TBILLPRICE(0, 180, 1.9)                                    |       5,0000 |           NUM |          5,0000 |
| TBILLPRICE    | =TBILLPRICE(0, 180, 2)                                      |       0,0000 |           NUM |          0,0000 |
| NPV           | =NPV(1, TRUE(), 1)                                          |       0,7500 |        0,5000 |          0,7500 |
| NPV           | =NPV(1,B1) where B1 = true                                  |       0,5000 |        0,0000 |          0,0000 |
| POISSON.DIST  | =POISSON.DIST(-0.01, 0, FALSE())                            |          NUM |        1,0000 |             NUM |
| POISSON.DIST  | =POISSON.DIST(0, -0.01, FALSE())                            |          NUM |           NUM |          1,0101 |
| DB            | =DB(1000000, 100000, 6, 7, 7)                               |   15845,1000 |           NUM |      15845,0985 |
| BETA.DIST     | =BETA.DIST(1, 2, 3)                                         |          N/A |        1,0000 |             NUM |
| BETA.DIST     | =BETA.DIST(0, 1, 1, FALSE())                                |          NUM |        0,0000 |             NUM |
| BETA.DIST     | =BETA.DIST(0.6, 1, 1, FALSE(), 0.6, 0.7)                    |          NUM |        0,0000 |          0,0000 |
| BETA.DIST     | =BETA.DIST(0.7, 1, 1, FALSE(), 0.6, 0.7)                    |          NUM |        0,0000 |          0,0000 |
| GAMMA         | =GAMMA(-2.5)                                                |      -0,9453 |           NUM |         -0,9453 |
| BINOM.DIST    | =BINOM.DIST(0.5, 0.4, 1,   FALSE())                         |          N/A |           NUM |          1,0000 |
| NEGBINOM.DIST | =NEGBINOM.DIST(0, 1, 0, FALSE())                            |       0,0000 |           N/A |             NUM |
| NEGBINOM.DIST | =NEGBINOM.DIST(0, 1, 1, FALSE())                            |       1,0000 |           N/A |             NUM |
| T.INV         | =T.INV(0, 1)                                                |          NUM |           NUM |           DIV/0 |
| BETA.INV      | =BETA.INV(1, 1, 1)                                          |       1,0000 |        1,0000 |             NUM |
| WEIBULL.DIST  | =WEIBULL.DIST(0, 1, 1, FALSE())                             |       1,0000 |        1,0000 |          0,0000 |
| HYPGEOM.DIST  | =HYPGEOM.DIST(12.1, 12, 20, 40, TRUE())                     |          NUM |           N/A |          1,0000 |
| HYPGEOM.DIST  | =HYPGEOM.DIST(12.1, 20, 12, 40, TRUE())                     |          NUM |           N/A |          1,0000 |
| HYPGEOM.DIST  | =HYPGEOM.DIST(1, 2, 3, 4)                                   |          N/A |        0,5000 |             NUM |
| HYPGEOM.DIST  | =HYPGEOM.DIST(4, 12, 20, 40, TRUE())                        |       0,1504 |           N/A |          0,1504 |
| TDIST         | =TDIST(0, 1, 1.5)                                           |          NUM |        0,5000 |          0,5000 |
| T.INV.2T      | =T.INV.2T(0, 1)                                             |          NUM |           NUM |           DIV/0 |
| T.DIST        | =T.DIST(1, 0.9, FALSE())                                    |          NUM |           NUM |           DIV/0 |
| AVEDEV        | =AVEDEV(TRUE(), FALSE())                                    |       0,4444 |        0,0000 |          0,4444 |
| LARGE         | =LARGE(TRUE(), 1)                                           |          NUM |           NUM |          1,0000 |
| COUNTA        | =COUNTA(1,)                                                 |       2,0000 |        1,0000 |          2,0000 |
| XNPV          | =XNPV(-0.9, A2:D2, A3:D3)<br>where 2nd and 3rd row: 1,2,3,4 |      10,1272 |   10,12716959 |             NUM |
| SKEW          | =SKEW(TRUE(), FALSE())                                      |       1,7321 |         DIV/0 |          1,7321 |
| HARMEAN       | =HARMEAN(TRUE(), "4")                                       |       1,6000 |        4,0000 |          1,6000 |
| GEOMEAN       | =GEOMEAN(TRUE(), "4")                                       |       2,0000 |        4,0000 |          2,0000 |
| CHISQ.TEST    | =CHISQ.TEST(A1:C2, A1:F1)                                   |          N/A |           N/A |           DIV/0 |
| BINOM.INV     | =BINOM.INV(1, 0.8, 0.2)                                     |       0,0000 |        1,0000 |          1,0000 |
| BINOM.INV     | =BINOM.INV(-0.001, 0.5, 0.5)                                |          NUM |        0,0000 |             NUM |
| BINOM.INV     | =BINOM.INV(10, 0, 0.5)                                      |       0,0000 |           NUM |             NUM |
| BINOM.INV     | =BINOM.INV(10, 1, 0.5)                                      |      10,0000 |           NUM |             NUM |
| DEVSQ         | =DEVSQ(A2, A3)                                              |       0,0000 |        0,0000 |             NUM |
| NORMSDIST     | =NORMSDIST(0, TRUE())                                       |          0.5 |  Wrong number |    Wrong number |
