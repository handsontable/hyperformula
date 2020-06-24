# Built-in functions

### Overview

HyperFormula comes with an extensive library of pre-built functions. You can use them to create complex formulas for any business application. Formula syntax and logic of function are similar to what is considered a standard in modern spreadsheet software. That is because a spreadsheet is probably the most universal software ever created. We wanted the same flexibility for HyperFormula but without the constrains of the spreadsheet UI.

All implemented functions are grouped into 8 different categories:

* Date and time
* Engineering
* Information
* Logical
* Lookup and reference
* Math and trigonometry
* Statistical
* Text

_Some categories such as compatibility, cube, database, and financial are yet to be supported._

### Language packs

HypeFormula provides translation packs for 16 languages thus making it easier to create localized applications. The supported languages are: English \(default\), Czech, Danish, Dutch, Finnish, French, German, Hungarian, Italian, Norwegian, Polish, Portuguese, Russian, Spanish, Swedish, and Turkish.

The package includes localization of function names and error values \(such as \#REF! or \#NAME!\). To support more languages or properties create your own [custom language pack](localizing-functions).

### Custom functions

One of the most valuable features of HyperFormula is its extensibility. All functions are implemented within the plugin architecture which means it is easy to remove or replace them. This means you are not limited by the current functionality of the engine. HyperFormula lets you design your own [custom functions](custom-functions).

### List of available functions

| Function ID | Category | Description | Syntax |
| :--- | :--- | :--- | :--- |
| DATE | Date and time | This function calculates a date specified by year, month, day, and displays it in the cell's formatting. | DATE\(Year; Month; Day\) |
| DAY | Date and time | Returns the day of the given date value. | DAY\(Number\) |
| DAYS | Date and time | Calculates the difference between two date values. | DAYS\(Date2; Date1\) |
| EOMONTH | Date and time | Returns the date of the last day of a month which falls months away from the start date. | EOMONTH\(Startdate; Months\) |
| MONTH | Date and time | Returns the month for the given date value. | MONTH\(Number\) |
| YEAR | Date and time | Returns the year as a number according to the internal calculation rules. | YEAR\(Number\) |
| BIN2DEC | Engineering | The result is the decimal number for the binary number entered. | BIN2DEC\(Number\) |
| BIN2HEX | Engineering | The result is the hexadecimal number for the binary number entered. | BIN2HEX\(Number; Places\) |
| BIN2OCT | Engineering | The result is the octal number for the binary number entered. | BIN2OCT\(Number; Places\) |
| BITAND | Engineering | Returns a bitwise logical "and" of the parameters. | BITAND\(Number1; Number2\) |
| BITLSHIFT | Engineering | Shifts a number left by n bits. | BITLSHIFT\(Number; Shift\) |
| BITOR | Engineering | Returns a bitwise logical "or" of the parameters. | BITOR\(Number1; Number2\) |
| BITRSHIFT | Engineering | Shifts a number right by n bits. | BITRSHIFT\(Number; Shift\) |
| BITXOR | Engineering | Returns a bitwise logical "exclusive or" of the parameters. | BITXOR\(Number1; Number2\) |
| DEC2BIN | Engineering | Returns the binary number for the decimal number entered between –512 and 511. | DEC2BIN\(Number; Places\) |
| DEC2HEX | Engineering | Returns the hexadecimal number for the decimal number entered. | DEC2HEX\(Number; Places\) |
| DEC2OCT | Engineering | Returns the octal number for the decimal number entered. | DEC2OCT\(Number; Places\) |
| DELTA | Engineering | Returns TRUE \(1\) if both numbers are equal, otherwise returns FALSE \(0\). | DELTA\(Number\_1; Number\_2\) |
| ERF | Engineering | Returns values of the Gaussian error integral. | ERF\(Lower\_Limit; Upper\_Limit\) |
| ERFC | Engineering | Returns complementary values of the Gaussian error integral between x and infinity. | ERFC\(Lower\_Limit\) |
| ISBLANK | Information | Returns TRUE if the reference to a cell is blank. | ISBLANK\(Value\) |
| ISERROR | Information | The ISERROR tests if the cells contain general error values. | ISERROR\(Value\) |
| ISEVEN | Information | Returns TRUE if the value is an even integer, or FALSE if the value is odd. | ISEVEN\(Value\) |
| ISODD | Information | Returns TRUE if the value is odd, or FALSE if the number is even. | ISODD\(Value\) |
| AND | Logical | Returns TRUE if all arguments are TRUE. | AND\(Logicalvalue1; Logicalvalue2 ...Logicalvalue30\) |
| FALSE | Logical | Returns the logical value FALSE. | FALSE\(\) |
| IF | Logical | Specifies a logical test to be performed. | IF\(Test; Then value; Otherwisevalue\) |
| NOT | Logical | Complements \(inverts\) a logical value. | NOT\(Logicalvalue\) |
| OR | Logical | Returns TRUE if at least one argument is TRUE. | OR\(Logicalvalue1; Logicalvalue2 ...Logicalvalue30\) |
| TRUE | Logical | The logical value is set to TRUE. | TRUE\(\) |
| XOR | Logical | Returns true if an odd number of arguments evaluates to TRUE. | XOR\(Logicalvalue1; Logicalvalue2 ...Logicalvalue30\) |
| COLUMNS | Lookup and reference | Returns the number of columns in the given reference. | COLUMNS\(Array\) |
| ROWS | Lookup and reference | Returns the number of rows in the given reference. | ROWS\(Array\) |
| INDEX | Lookup and reference | Returns the content of a cell, specified by row and column number, or an optional range name. | INDEX\(Reference; Row; Column; Range\) |
| MATCH | Lookup and reference | Returns the relative position of an item in an array that matches a specified value. | MATCH\(Searchcriterion; Lookuparray; Type\) |
| TRANSPOSE | Lookup and reference | Transposes the rows and columns of an array. | TRANSPOSE\(Array\) |
| VLOOKUP | Lookup and reference | Searches vertically with reference to adjacent cells to the right. | VLOOKUP\(Search\_Criterion; Array; Index; Sort\_Order\) |
| ABS | Math and trigonometry | Returns the absolute value of a number. | ABS\(Number\) |
| ACOS | Math and trigonometry | Returns the inverse trigonometric cosine of a number. | ACOS\(Number\) |
| ASIN | Math and trigonometry | Returns the inverse trigonometric sine of a number. | ASIN\(Number\) |
| ATAN | Math and trigonometry | Returns the inverse trigonometric tangent of a number. | ATAN\(Number\) |
| ATAN2 | Math and trigonometry | Returns the inverse trigonometric tangent of the specified x and y coordinates. | ATAN2\(Numberx; Numbery\) |
| BASE | Math and trigonometry | Converts a positive integer to a specified base into a text from the numbering system. | BASE\(Number; Radix; \[Minimumlength\]\) |
| CEILING | Math and trigonometry | Rounds a number up to the nearest multiple of Significance. | CEILING\(Number; Significance; Mode\) |
| COS | Math and trigonometry | Returns the cosine of the given angle \(in radians\). | COS\(Number\) |
| COT | Math and trigonometry | Returns the cotangent of the given angle \(in radians\). | COT\(Number\) |
| DECIMAL | Math and trigonometry | Converts text with characters from a number system to a positive integer in the base radix given. | DECIMAL\("Text"; Radix\) |
| DEGREES | Math and trigonometry | Converts radians into degrees. | DEGREES\(Number\) |
| EVEN | Math and trigonometry | Rounds a positive number up to the next even integer and a negative number down to the next even integer. | EVEN\(Number\) |
| EXP | Math and trigonometry | Returns e raised to the power of a number. | EXP\(Number\) |
| INT | Math and trigonometry | Rounds a number down to the nearest integer. | INT\(Number\) |
| LN | Math and trigonometry | Returns the natural logarithm based on the constant e of a number. | LN\(Number\) |
| LOG | Math and trigonometry | Returns the logarithm of a number to the specified base. | LOG\(Number; Base\) |
| LOG10 | Math and trigonometry | Returns the base-10 logarithm of a number. | LOG10\(Number\) |
| MOD | Math and trigonometry | Returns the remainder when one integer is divided by another. | MOD\(Dividend; Divisor\) |
| ODD | Math and trigonometry | Rounds a positive number up to the nearest odd integer and a negative number down to the nearest odd integer. | ODD\(Number\) |
| PI | Math and trigonometry | Returns 3.14159265358979, the value of the mathematical constant PI to 14 decimal places. | PI\(\) |
| POWER | Math and trigonometry | Returns a number raised to another number. | POWER\(Base; Exponent\) |
| RADIANS | Math and trigonometry | Converts degrees to radians. | RADIANS\(Number\) |
| RAND | Math and trigonometry | Returns a random number between 0 and 1. | RAND\(\) |
| ROUND | Math and trigonometry | Rounds a number to a certain number of decimal places. | ROUND\(Number; Count\) |
| ROUNDDOWN | Math and trigonometry | Rounds a number down, toward zero, to a certain precision. | ROUNDDOWN\(Number; Count\) |
| ROUNDUP | Math and trigonometry | Rounds a number up, away from zero, to a certain precision. | ROUNDUP\(Number; Count\) |
| SIN | Math and trigonometry | Returns the sine of the given angle \(in radians\). | SIN\(Number\) |
| SQRT | Math and trigonometry | Returns the positive square root of a number. | SQRT\(Number\) |
| SUM | Math and trigonometry | Adds all the numbers in a range of cells. | SUM\(Number1; Number2; ...; Number30\) |
| SUMIF | Math and trigonometry | Adds the cells specified by given criteria. | SUMIF\(Range; Criteria; Sumrange\) |
| SUMIFS | Math and trigonometry | Returns the sum of the values of cells in a range that meets multiple criteria in multiple ranges. | SUMIFS\(Sum\_Range ; Criterion\_range1 ; Criterion1 \[ ; Criterion\_range2 ; Criterion2 \[;...\]\]\) |
| SUMPRODUCT | Math and trigonometry | Multiplies corresponding elements in the given arrays, and returns the sum of those products. | SUMPRODUCT\(Array1; Array2...Array30\) |
| SUMSQ | Math and trigonometry | Returns the sum of the squares of the arguments | SUMSQ\(Number1; Number2; ...; Number30\) |
| TAN | Math and trigonometry | Returns the tangent of the given angle \(in radians\). | TAN\(Number\) |
| TRUNC | Math and trigonometry | Truncates a number by removing decimal places. | TRUNC\(Number; Count\) |
| AVERAGE | Statistical | Returns the average of the arguments. | AVERAGE\(Number1; Number2; ...Number30\) |
| AVERAGEA | Statistical | Returns the average of the arguments. | AVERAGEA\(Value1; Value2; ... Value30\) |
| AVERAGEIF | Statistical | Returns the arithmetic mean of all cells in a range that satisfy a given condition. | AVERAGEIF\(Range; Criterion \[; Average\_Range \]\) |
| CORREL | Statistical | Returns the correlation coefficient between two data sets. | CORREL\(Data1; Data2\) |
| COUNT | Statistical | Counts how many numbers are in the list of arguments. | COUNT\(Value1; Value2; ... Value30\) |
| COUNTA | Statistical | Counts how many values are in the list of arguments. | COUNTA\(Value1; Value2; ... Value30\) |
| COUNTBLANK | Statistical | Returns the number of empty cells. | COUNTBLANK\(Range\) |
| COUNTIF | Statistical | Returns the number of cells that meet with certain criteria within a cell range. | COUNTIF\(Range; Criteria\) |
| COUNTIFS | Statistical | Returns the count of rows or columns that meet criteria in multiple ranges. | COUNTIFS\(Range1; Criterion1 \[; Range2; Criterion2 \[; ...\]\]\) |
| MAX | Statistical | Returns the maximum value in a list of arguments. | MAX\(Number1; Number2; ...Number30\) |
| MAXA | Statistical | Returns the maximum value in a list of arguments. | MAXA\(Value1; Value2; ... Value30\) |
| MEDIAN | Statistical | Returns the median of a set of numbers. | MEDIAN\(Number1; Number2; ...Number30\) |
| MIN | Statistical | Returns the minimum value in a list of arguments. | MIN\(Number1; Number2; ...Number30\) |
| MINA | Statistical | Returns the minimum value in a list of arguments. | MINA\(Value1; Value2; ... Value30\) |
| CHAR | Text | Converts a number into a character according to the current code table. | CHAR\(Number\) |
| CODE | Text | Returns a numeric code for the first character in a text string. | CODE\("Text"\) |
| CONCATENATE | Text | Combines several text strings into one string. | CONCATENATE\("Text1"; ...; "Text30"\) |
| TEXT | Text | Converts a number into text according to a given format. | TEXT\(Number; Format\) |

### Demo

This demo presents several built-in functions integrated with a sample UI.

<iframe
   src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/develop/built-in-functions?autoresize=1&fontsize=14&hidenavigation=1&theme=dark&view=preview"
   style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
   title="handsontable/hyperformula-demos: basic-usage"
   allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
   sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
/>



