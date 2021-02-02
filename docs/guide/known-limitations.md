# Known limitations

Here are the shortcomings of HyperFormula in its current development
stage:

* The number of built-in functions is growing fast but is still far
from what is offered by the most popular spreadsheet software on the
market (~450 functions on average).
* Node.js versions older than 13 don't properly compare
culture-insensitive strings. HyperFormula requires the full
International Components for Unicode (ICU) to be supported.
[Learn more](https://nodejs.org/api/intl.html#intl_embed_the_entire_icu_full_icu)
* GPU acceleration is used only by matrix functions: MMULT, MEDIANPOOL, MAXPOOL.
* GPU.js works only in browsers that support ES6. [Learn more](enabling-gpu-acceleration.md)
* Sorting and filtering are not natively supported. However,
we simulate sorting using the move operations.
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
