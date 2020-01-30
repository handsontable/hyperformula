# HyperFormula changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1] - 2020-01-28

### Added
- Core functionality of the engine;
- Support for data types: String, Error, Number, Date;
- Support for logical operators: =, <>, >, <, >=, <=;
- Support for arithmetic operators: +, -, *, /, %;
- Support for text operator: &;
- CRUD operations: 
  - modifying the value of a single cell, 
  - adding/deleting row/column, 
  - reading the value or formula from the selected cell, 
  - moving a cell or a block of cells, 
  - deleting a subset of rows or columns,
  - deleting a subset of rows or columns, 
  - recalculating and refreshing of a worksheet;
- Following formulas: DATE(), DAYS(), ASIN(), COS(), E(), ERFC(), LOG(), PI(), SIN(), TAN(), AND(), AVERAGEA(), BASE(), BIN2HEX(), BITAND(), BITOR(), BITXOR(), CHAR(), CONCATENATE(), COUNTBLANK(), COUNTIFS(), COUNTIF(), DEC2BIN(), DEC2OCT(), DEGREES(), EVEN(), INT(), ISODD(), MAXA(), MIN(), MOD(), ODD(), ROUND(), ROUNDUP(), SUM(), SUMIFS(), SUMSQ(), XOR(), FALSE(), DAY(), ACOS(), ATAN(), COT(), ERF(), LN(), LOG10(), POWER(), SQRT(), ABS(), AVERAGE(), AVERAGEIF(), BIN2DEC(), BIN2OCT(), BITLSHIFT(), BITRSHIFT(), CEILING(), CODE(), CORREL(), COUNTA(), COUNTUNIQUE(), DEC2HEX(), DECIMAL(), DELTA(), IF(), ISEVEN(), MAX(), MEDIAN(), MINA(), NOT(), OR(), ROUNDDOWN(), SPLIT(), SUMIF(), SUMPRODUCT(), TRUNC(), TRUE();
- Set http://docs.oasis-open.org/office/v1.2/OpenDocument-v1.2-part2.html as a standard to follow;
- Error handling: 
  - Division by zero: #DIV/0!
  - Unknown function name: #NAME?, 
  - Wrong type of argument in a function or wrong type of operator: #VALUE!, 
  - Invalid numeric values: #NUM!, 
  - No value available: #N/A,
  - Cyclic dependency: #CYCLE!,
  - Wrong address reference: #REF;
- Built-in formula translations support for enGB and plPL. To add new language check contribution guidelines.

