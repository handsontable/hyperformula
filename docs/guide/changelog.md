# Changelog

### 0.1.0

Release date: June 23, 2020 🎉

* Core functionality of the engine; 
* Support for data types: String, Error, Number, Date, Time, DateTime, Duration, Distinct Logical; 
* Support for logical operators: =, <>, >, <, >=, <=; 
* Support for arithmetic operators: +, -, \*, /, %; 
* Support for text operator: &; 
* CRUD operations: - modifying the value of a single cell,  - adding/deleting row/column,  - reading the value or formula from the selected cell,  - moving a cell or a block of cells,  - deleting a subset of rows or columns,  - recalculating and refreshing of a worksheet;  - batching CRUD operations,  - support for wildcards and regex inside criterion functions like SUMIF, COUNTIF,  - named expressions support,  - support for cut, copy, paste,  - undo/redo support;
* The following functions: DATE\(\), DAYS\(\), ASIN\(\), COS\(\), E\(\), ERFC\(\), LOG\(\), PI\(\), SIN\(\), TAN\(\), AND\(\), AVERAGEA\(\), BASE\(\), BIN2HEX\(\), BITAND\(\), BITOR\(\), BITXOR\(\), CHAR\(\), CONCATENATE\(\), COUNTBLANK\(\), COUNTIFS\(\), COUNTIF\(\), DEC2BIN\(\), DEC2OCT\(\), DEGREES\(\), EVEN\(\), INT\(\), ISODD\(\), MAXA\(\), MIN\(\), MOD\(\), ODD\(\), ROUND\(\), ROUNDUP\(\), SUM\(\), SUMIFS\(\), SUMSQ\(\), XOR\(\), FALSE\(\), DAY\(\), ACOS\(\), ATAN\(\), COT\(\), ERF\(\), LN\(\), LOG10\(\), POWER\(\), SQRT\(\), ABS\(\), AVERAGE\(\), AVERAGEIF\(\), BIN2DEC\(\), BIN2OCT\(\), BITLSHIFT\(\), BITRSHIFT\(\), CEILING\(\), CODE\(\), CORREL\(\), COUNTA\(\), COUNTUNIQUE\(\), DEC2HEX\(\), DECIMAL\(\), DELTA\(\), IF\(\), ISEVEN\(\), MAX\(\), MEDIAN\(\), MINA\(\), NOT\(\), OR\(\), ROUNDDOWN\(\), SPLIT\(\), SUMIF\(\), SUMPRODUCT\(\), TRUNC\(\), TRUE\(\); 
* Support for volatile functions;
* Cultures supports - can be configured according to the application need;
* Custom functions support;
* Set [OpenDocument v1.2](http://docs.oasis-open.org/office/v1.2/OpenDocument-v1.2-part2.html) as a standard to follow;
*  Error handling:  - Division by zero: \#DIV/0!  - Unknown function name: \#NAME?,  - Wrong type of argument in a function or wrong type of operator: \#VALUE!,  - Invalid numeric values: \#NUM!,  - No value available: \#N/A,  - Cyclic dependency: \#CYCLE!,  - Wrong address reference: \#REF; 
* Built-in function translations support for 16 languages: csCZ, daDK, deDE, enGB, esES, fiFI, frFR, huHU, itIT, nbNO, nlNL, plPL, ptPT, ruRU, svSE and trTR.

