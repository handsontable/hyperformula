# Known limitations

This pages lists known limitations of HyperFormula in its current development stage:

* Node.js versions older than 13 don't properly compare
culture-insensitive strings. HyperFormula requires the full
International Components for Unicode (ICU) to be supported.
[Learn more](https://nodejs.org/api/intl.html#intl_embed_the_entire_icu_full_icu)
* Multiple workbooks are not supported. One instance of HyperFormula
can handle only one workbook with multiple worksheets at a time.
* For cycle detection, all possible dependencies between cells are
taken into account, even if some of them could be omitted after
the full evaluation of expressions and condition statements. The
most prominent example of this behavior is the "IF" function which
returns a cycle error regardless of whether TRUE or FALSE causes
a circular reference.
* There is no data validation against named ranges. For example,
you can't compare the arguments in a formula like this:
=IF(firstRange>secondRange; TRUE; FALSE).
* There is no relative referencing in named ranges.
* The library doesn't offer (at least not yet) the following features:
  * 3D references
  * Constant arrays
  * Dynamic arrays
  * Asynchronous functions
  * Structured references ("Tables")
  * Relative named expressions
  * Functions cannot use UI metadata (e.g. hidden rows for SUBTOTAL).

## Nuances of the implemented functions
* We immediately instantiate references to single cells to their values instead of treating them as 1-length ranges, which slightly changes behavior of some functions (e.g. NPV).
* SUBTOTAL function does not ignore nested subtotals.
* CHISQ.INV, CHISQ.INV.RT, CHISQ.DIST.RT, CHIDIST, CHIINV and CHISQ.DIST (CHISQ.DIST in CDF mode): Running time grows linearly with the value of the second parameter, degrees_of_freedom (slow for values>1e7).
* GAMMA.DIST, GAMMA.INV, GAMMADIST, GAMMAINV (GAMMA.DIST and GAMMADIST in CDF mode): Running time grows linearly with the value of the second parameter, alpha (slow for values>1e7). 
* For certain inputs, the RATE function might have no solutions, or have multiple solutions. Our implementation uses an iterative algorithm (Newton's method) to find an approximation for one of the solutions to within `1e-7`. If the approximation is not found after 50 iterations, the RATE function returns the `#NUM!` error.

## Google Sheets and Microsoft Excel

In certain situations, HyperFormula behaves differently than Google Sheets or Microsoft Excel.

The inconsistencies are due to:
* Known limitations of Microsoft Excel or Google Sheets.
* Known limitations of HyperFormula in its current development stage.
* Inconsistencies between Microsoft Excel and Google Sheets.

| Functionality                                        | Examples                                                                  | HyperFormula                                                                                                                                                                                                   | Google Sheets                                                                                                                    | Excel                                                               |
|------------------------------------------------------|---------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------|
| Dependency collection                                | A1:=IF(FALSE(),A1,0)<br><br>ISREF(A1)                                     | Dependencies are collected during the parsing phase which finds cycles that wouldn’t appear in the evaluation.<br><br>`CYCLE` error for both examples.                                                         | Dependencies are collected during evaluation.<br><br>`0` for both examples.                                                      | Same as Google Sheets.                                              |
| Named expressions and named ranges                   | SALARY:=$A$10 COST:=10*$B$5+100<br>PROFIT:=SALARY-COST<br>A1:=SALARY-COST | Only absolute addresses are allowed<br>(e.g. SALARY:= $A$10).<br><br>Named expressions can be global or scoped to one sheet only.<br><br>They can contain other named expressions.                             | Named expressions are not available.<br><br>Named ranges can be used to create aliases for addresses and ranges.                 | Named ranges and scoped named expressions are available.            |
| Applying a scalar value to a function taking range   | COLUMNS(A1)                                                               | `CellRangeExpected` error.                                                                                                                                                                                     | Treats the element as length-1 range. Returns 1 for the example.                                                                 | Same as Google Sheets.                                              |
| Coercion of explicit arguments                       | VARP(2, 3, 4, TRUE(), FALSE(), "1",)                                      | 1.9592, based on the behavior of Excel.                                                                                                                                                                        | GoogleSheets implementation is not consistent with the standard (see also VAR.S, STDEV.P and STDEV.S function.)                  | 1,9592                                                              |
| Ranges created with `:`                              | A1:A2<br><br>A$1:$A$2<br><br>A:C<br><br>1:2<br><br>Sheet1!A1:A2           | Allowed ranges consist of two addresses (A1:B5), columns (A:C) or rows (3:5).<br>They cannot be mixed or contain named expressions.                                                                            | Everything allowed.                                                                                                              | Same as Google Sheets.                                              |
| Formatting inside the TEXT function                  | TEXT(A1,"dd-mm-yy")<br><br>TEXT(A1,"###.###”)                             | Not all formatting options are supported,<br>e.g. only some date formatting options: (`hh`, `mm`, `ss`, `am`, `pm`, `a`, `p`, `dd`, `yy`, and `yyyy`).<br><br>No currency formatting inside the TEXT function. | A wide variety of options for string formatting is supported.                                                                    | Same as Google Sheets.                                              |
| Enabling array arithmetic                            | =ARRAYFORMULA(A2:A5*B2:B5)                                                | By default, array arithmetic is disabled globally.<br><br>The ARRAYFORMULA function enables array arithmetic for the formula inside the function.<br><br>To enable array arithmetic globally, [set the `useArrayArithmetic` option to `true`](../api/interfaces/configparams.html#usearrayarithmetic).  | By default, array arithmetic is disabled globally.<br><br>The ARRAYFORMULA function enables array arithmetic inside the function.   | By default, array arithmetic is enabled globally. |

### Built-in function implementation differences

Some built-in functions are implemented differently than in Google Sheets or Microsoft Excel.

To remove the differences, you can create custom implementations of those functions.

| Function      | Example                                                    | HyperFormula | Google Sheets |     Microsoft Excel |
|---------------|------------------------------------------------------------|-------------:|-------------:|-----------:|
| TBILLEQ       | =TBILLEQ(0, 180, 1.9)                                      |      38,5278 |          NUM |        NUM |
| TBILLEQ       | =TBILLEQ(0, 180, 2)                                        |       0,0000 |          NUM |     0,0000 |
| TBILLEQ       | =TBILLEQ("1/2/2000", "31/1/2001", 0.1)                  |       0,1128 |        VALUE |      VALUE |
| TBILLEQ       | =TBILLEQ(0, 360, 0.1)                                      |       0,1127 |       0,1097 |     0,1097 |
| TBILLEQ       | =TBILLEQ(0, 365, 0.1)                                      |       0,1128 |       0,1098 |     0,1098 |
| GCD           | =GCD(1000000000000000000.0)                                |          NUM |        1E+18 |        NUM |
| COMBIN        | =COMBIN(1030, 0)                                           |          NUM |          NUM |     1,0000 |
| RRI           | =RRI(1, -1, -1)                                            |       0,0000 |          NUM |     0,0000 |
| DAYS          | =DAYS(-1, 0)                                               |          NUM |      -1,0000 |        NUM |
| DAYS          | =DAYS(0, -1)                                               |          NUM |       1,0000 |        NUM |
| DATEDIF       | =DATEDIF(-1, 0, "Y")                                       |          NUM |       0,0000 |        NUM |
| RATE          | =RATE(12, -100, 400, 0, 1)                                 |      -1,0000 |          NUM |        NUM |
| LCMP          | =LCM(1000000, 1000001, 1000002, 1000003)                   |          NUM |  5,00003E+23 |        NUM |
| TBILLPRICE    | =TBILLPRICE(0, 180, 1.9)                                   |       5,0000 |          NUM |     5,0000 |
| TBILLPRICE    | =TBILLPRICE(0, 180, 2)                                     |       0,0000 |          NUM |     0,0000 |
| NPV           | =NPV(1, TRUE(), 1)                                         |       0,7500 |       0,5000 |     0,7500 |
| NPV           | =NPV(1,B1) where B1 = true                                 |       0,5000 |       0,0000 |     0,0000 |
| POISSON.DIST  | =POISSON.DIST(-0.01, 0, FALSE())                           |          NUM |       1,0000 |        NUM |
| POISSON.DIST  | =POISSON.DIST(0, -0.01, FALSE())                           |          NUM |          NUM |     1,0101 |
| DB            | =DB(1000000, 100000, 6, 7, 7)                              |   15845,1000 |          NUM | 15845,0985 |
| BETA.DIST     | =BETA.DIST(1, 2, 3)                                        |          N/A |       1,0000 |        NUM |
| BETA.DIST     | =BETA.DIST(0, 1, 1, FALSE())                               |          NUM |       0,0000 |        NUM |
| BETA.DIST     | =BETA.DIST(0.6, 1, 1, FALSE(), 0.6, 0.7)                   |          NUM |       0,0000 |     0,0000 |
| BETA.DIST     | =BETA.DIST(0.7, 1, 1, FALSE(), 0.6, 0.7)                   |          NUM |       0,0000 |     0,0000 |
| GAMMA         | =GAMMA(-2.5)                                               |      -0,9453 |          NUM |    -0,9453 |
| BINOM.DIST    | =BINOM.DIST(0.5, 0.4, 1,   FALSE())                        |          N/A |          NUM |     1,0000 |
| NEGBINOM.DIST | =NEGBINOM.DIST(0, 1, 0, FALSE())                           |       0,0000 |          N/A |        NUM |
| NEGBINOM.DIST | =NEGBINOM.DIST(0, 1, 1, FALSE())                           |       1,0000 |          N/A |        NUM |
| T.INV         | =T.INV(0, 1)                                               |          NUM |          NUM |      DIV/0 |
| BETA.INV      | =BETA.INV(1, 1, 1)                                         |       1,0000 |       1,0000 |        NUM |
| WEIBULL.DIST  | =WEIBULL.DIST(0, 1, 1, FALSE())                            |       1,0000 |       1,0000 |     0,0000 |
| HYPGEOM.DIST  | =HYPGEOM.DIST(12.1, 12, 20, 40, TRUE())                    |          NUM |          N/A |     1,0000 |
| HYPGEOM.DIST  | =HYPGEOM.DIST(12.1, 20, 12, 40, TRUE())                    |          NUM |          N/A |     1,0000 |
| HYPGEOM.DIST  | =HYPGEOM.DIST(1, 2, 3, 4)                                  |          N/A |       0,5000 |        NUM |
| HYPGEOM.DIST  | =HYPGEOM.DIST(4, 12, 20, 40, TRUE())                       |       0,1504 |          N/A |     0,1504 |
| TDIST         | =TDIST(0, 1, 1.5)                                          |          NUM |       0,5000 |     0,5000 |
| T.INV.2T      | =T.INV.2T(0, 1)                                            |          NUM |          NUM |      DIV/0 |
| T.DIST        | =T.DIST(1, 0.9, FALSE())                                   |          NUM |          NUM |      DIV/0 |
| AVEDEV        | =AVEDEV(TRUE(), FALSE())                                  |       0,4444 |       0,0000 |     0,4444 |
| LARGE         | =LARGE(TRUE(), 1)                                          |          NUM |          NUM |     1,0000 |
| COUNTA        | =COUNTA(1,)                                                |       2,0000 |       1,0000 |     2,0000 |
| XNPV          | =XNPV(-0.9, A2:D2, A3:D3)<br>where 2nd and 3rd row: 1,2,3,4 |      10,1272 |  10,12716959 |        NUM |
| SKEW          | =SKEW(TRUE(), FALSE())                                    |       1,7321 |        DIV/0 |     1,7321 |
| HARMEAN       | =HARMEAN(TRUE(), "4")                                      |       1,6000 |       4,0000 |     1,6000 |
| GEOMEAN       | =GEOMEAN(TRUE(), "4")                                      |       2,0000 |       4,0000 |     2,0000 |
| CHISQ.TEST    | =CHISQ.TEST(A1:C2, A1:F1)                                  |          N/A |          N/A |      DIV/0 |
| BINOM.INV     | =BINOM.INV(1, 0.8, 0.2)                                    |       0,0000 |       1,0000 |     1,0000 |
| BINOM.INV     | =BINOM.INV(-0.001, 0.5, 0.5)                               |          NUM |       0,0000 |        NUM |
| BINOM.INV     | =BINOM.INV(10, 0, 0.5)                                     |       0,0000 |          NUM |        NUM |
| BINOM.INV     | =BINOM.INV(10, 1, 0.5)                                     |      10,0000 |          NUM |        NUM |
| DEVSQ         | =DEVSQ(A2, A3)                                             |       0,0000 |       0,0000 |        NUM |
| NORMSDIST     | =NORMSDIST(0, TRUE())                                      |          0.5 | Wrong number | Wrong number | 
