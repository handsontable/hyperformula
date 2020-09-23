# Built-in functions

## Overview

HyperFormula comes with an extensive library of pre-built functions.
You can use them to create complex formulas for any business application.
Formula syntax and logic of function are similar to what is
considered a standard in modern spreadsheet software. That is
because a spreadsheet is probably the most universal software
ever created. We wanted the same flexibility for HyperFormula
but without the constrains of the spreadsheet UI.

All implemented functions are grouped into 8 different categories:

* Date and time
* Engineering
* Financial
* Information
* Logical
* Lookup and reference
* Math and trigonometry
* Statistical
* Text

_Some categories such as compatibility, cube, and database
are yet to be supported._

## Language packs

HypeFormula provides translation packs for 16 languages thus making
it easier to create localized applications. The supported languages
are: English (default), Czech, Danish, Dutch, Finnish, French,
German, Hungarian, Italian, Norwegian, Polish, Portuguese, Russian,
Spanish, Swedish, and Turkish.

The package includes localization of function names and error values
(such as #REF! or #NAME!). To support more languages or properties
create your own [custom language pack](localizing-functions).

## Custom functions

One of the most valuable features of HyperFormula is its extensibility.
All functions are implemented within the plugin architecture which
means it is easy to remove or replace them. This means you are not
limited by the current functionality of the engine. HyperFormula
lets you design your own [custom functions](custom-functions).

## Demo

<iframe
     src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/0.2.x/built-in-functions?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="handsontable/hyperformula-demos: built-in-functions"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

<br><br>

## List of available functions

| Function ID | Category | Description | Syntax |
| :--- | :--- | :--- | :--- |
| DATE | Date and time | Calculates a date specified by year, month, day, and displays it in the cell's formatting. | DATE(Year; Month; Day) |
| DATEDIF <br><Badge text="v0.2.0"/>| Date and time | Calculates distance between two dates, in provided unit parameter. | DATEDIF(Date1; Date2; Units) |
| DATEVALUE <br><Badge text="v0.2.0"/>| Date and time | Interprets string as date. | DATEVALUE(Datestring) |
| DAY | Date and time | Returns the day of the given date value. | DAY(Number) |
| DAYS | Date and time | Calculates the difference between two date values. | DAYS(Date2; Date1) |
| DAYS360 <br><Badge text="v0.2.0"/>| Date and time | Calculates the difference between two date values in days, in 360-day basis. | DAYS360(Date2; Date1[; Format]) |
| EDATE <br><Badge text="v0.2.0"/>| Date and time | Shifts the given startdate by given number of months. | EDATE(Startdate; Months) |
| EOMONTH | Date and time | Returns the date of the last day of a month which falls months away from the start date. | EOMONTH(Startdate; Months) |
| HOUR <br><Badge text="v0.2.0"/>| Date and time | Returns hour component of given time. | HOUR(Time) |
| ISOWEEKNUM <br><Badge text="v0.2.0"/>| Date and time |   Returns an ISO week number that corresponds to the week of year. | ISOWEEKNUM(Date) |
| MINUTE <br><Badge text="v0.2.0"/>| Date and time | Returns minute component of given time. | MINUTE(Time) |
| MONTH | Date and time | Returns the month for the given date value. | MONTH(Number) |
| NOW <br><Badge text="v0.2.0"/>| Date and time | Returns current date + time. | NOW() |
| SECOND <br><Badge text="v0.2.0"/>| Date and time | Returns second component of given time. | SECOND(Time) |
| TIME <br><Badge text="v0.2.0"/>| Date and time | Calculates time from given hour, minute and second. | TIME(Hour; Minute; Second) |
| TIMEVALUE <br><Badge text="v0.2.0"/>| Date and time | Interprets string as time. | TIMEVALUE(Timestring) |
| TODAY <br><Badge text="v0.2.0"/>| Date and time | Returns current date. | TODAY() |
| WEEKDAY <br><Badge text="v0.2.0"/>| Date and time |  Computes a number between 1-7 representing the day of week. | WEEKDAY(Date; Type) |
| WEEKNUM <br><Badge text="v0.2.0"/>| Date and time |   Returns a week number that corresponds to the week of year. | WEEKNUM(Date; Type) |
| YEAR | Date and time | Returns the year as a number according to the internal calculation rules. | YEAR(Number) |
| YEARFRAC <br><Badge text="v0.2.0"/>| Date and time | Computes the difference between two date values, in fraction of years. |  YEARFRAC(Date2; Date1[; Format]) |
| BIN2DEC | Engineering | The result is the decimal number for the binary number entered. | BIN2DEC(Number) |
| BIN2HEX | Engineering | The result is the hexadecimal number for the binary number entered. | BIN2HEX(Number; Places) |
| BIN2OCT | Engineering | The result is the octal number for the binary number entered. | BIN2OCT(Number; Places) |
| BITAND | Engineering | Returns a bitwise logical "and" of the parameters. | BITAND(Number1; Number2) |
| BITLSHIFT | Engineering | Shifts a number left by n bits. | BITLSHIFT(Number; Shift) |
| BITOR | Engineering | Returns a bitwise logical "or" of the parameters. | BITOR(Number1; Number2) |
| BITRSHIFT | Engineering | Shifts a number right by n bits. | BITRSHIFT(Number; Shift) |
| BITXOR | Engineering | Returns a bitwise logical "exclusive or" of the parameters. | BITXOR(Number1; Number2) |
| DEC2BIN | Engineering | Returns the binary number for the decimal number entered between –512 and 511. | DEC2BIN(Number; Places) |
| DEC2HEX | Engineering | Returns the hexadecimal number for the decimal number entered. | DEC2HEX(Number; Places) |
| DEC2OCT | Engineering | Returns the octal number for the decimal number entered. | DEC2OCT(Number; Places) |
| DELTA | Engineering | Returns TRUE (1) if both numbers are equal, otherwise returns FALSE (0). | DELTA(Number_1; Number_2) |
| ERF | Engineering | Returns values of the Gaussian error integral. | ERF(Lower_Limit; Upper_Limit) |
| ERFC | Engineering | Returns complementary values of the Gaussian error integral between x and infinity. | ERFC(Lower_Limit) |
| HEX2BIN <br><Badge text="v0.2.0"/>| Engineering | The result is the binary number for the hexadecimal number entered. | HEX2BIN(Number; Places) |
| HEX2DEC <br><Badge text="v0.2.0"/>| Engineering | The result is the decimal number for the hexadecimal number entered. | HEX2DEC(Number) |
| HEX2OCT <br><Badge text="v0.2.0"/>| Engineering | The result is the octal number for the hexadecimal number entered. | HEX2OCT(Number; Places) |
| OCT2BIN <br><Badge text="v0.2.0"/>| Engineering | The result is the binary number for the octal number entered. | OCT2BIN(Number; Places) |
| OCT2DEC <br><Badge text="v0.2.0"/>| Engineering | The result is the decimal number for the octal number entered. | OCT2DEC(Number) |
| OCT2HEX <br><Badge text="v0.2.0"/>| Engineering | The result is the hexadecimal number for the octal number entered. | OCT2HEX(Number; Places) |
| ISBINARY <br><Badge text="v0.2.0"/>| Information | Returns TRUE if provided value is a valid binary number. | ISBINARY(Value) |
| ISBLANK | Information | Returns TRUE if the reference to a cell is blank. | ISBLANK(Value) |
| ISERR <br><Badge text="v0.2.0"/>| Information | Returns TRUE if the value is error value except #N/A!. | ISERR(Value) |
| ISERROR | Information | Returns TRUE if the value is general error value. | ISERROR(Value) |
| ISEVEN | Information | Returns TRUE if the value is an even integer, or FALSE if the value is odd. | ISEVEN(Value) |
| ISFORMULA <br><Badge text="v0.2.0"/>| Information | Checks whether referenced cell is a formula. | ISFORMULA(Value) |
| ISLOGICAL | Information | Tests for a logical value (TRUE or FALSE). | ISLOGICAL(Value) |
| ISNA <br><Badge text="v0.2.0"/>| Information | Returns TRUE if the value is #N/A! error. | ISNA(Value) |
| ISNONTEXT | Information | Tests if the cell contents are text or numbers, and returns FALSE if the contents are text. | ISNONTEXT(Value) |
| ISNUMBER | Information | Returns TRUE if the value refers to a number. | ISNUMBER(Value) |
| ISODD | Information | Returns TRUE if the value is odd, or FALSE if the number is even. | ISODD(Value) |
| ISREF <br><Badge text="v0.2.0"/>| Information | Returns TRUE if provided value is #REF! error. | ISREF(Value) |
| ISTEXT | Information | Returns TRUE if the cell contents refer to text. | ISTEXT(Value) |
| SHEET <br><Badge text="v0.2.0"/>| Information | Returns sheet number of a given value or a formula sheet number if no argument is provided. | SHEET([Value]) |
| SHEETS <br><Badge text="v0.2.0"/>| Information | Returns number of sheet of a given reference or number of all sheets in workbook when no argument is provided. | SHEETS([Value]) |
| NA <br><Badge text="v0.2.0"/>| Information | Returns #N/A! error value.| NA(Value) |
| CUMIPMT <br><Badge text="v0.2.0"/>| Financial |  Returns the cumulative interest paid on a loan between a start period and an end period. | CUMIPMT(Rate; Nper; Pv; Start, End; type) |
| CUMPRINC <br><Badge text="v0.2.0"/>| Financial | Returns the cumulative principal paid on a loan between a start period and an end period. | CUMPRINC(Rate; Nper; Pv; Start; End; Type) |
| DB <br><Badge text="v0.2.0"/>| Financial | Returns the depreciation of an asset for a period using the fixed-declining balance method. | DB(Cost; Salvage; Life; Period[; Month]) |
| DDB <br><Badge text="v0.2.0"/>| Financial | Returns the depreciation of an asset for a period using the double-declining balance method. | DDB(Cost, Salvage; Life; Period[; Factor]) |
| DOLLARDE <br><Badge text="v0.2.0"/>| Financial | Converts a price entered with a special notation to a price displayed as a decimal number. | DOLLARDE(Price, Fraction) |
| DOLLARFR <br><Badge text="v0.2.0"/>| Financial | Converts a price displayed as a decimal number to a price entered with a special notation. | DOLLARFR(Price, Fraction) |
| EFFECT <br><Badge text="v0.2.0"/>| Financial | Calculates the effective annual interest rate from a nominal interest rate and the number of compounding periods per year. | EFFECT (Nominal_rate; Npery) |
| FV <br><Badge text="v0.2.0"/> | Financial | Returns the future value of an investment. | FV(Rate; Nper; Pmt[; Pv;[ Type]]) |
| IPMT <br><Badge text="v0.2.0"/>| Financial | Returns the interest portion of a given loan payment in a given payment period. | IPMT(Rate; Per; Nper; Pv[; Fv[; Type]]) |
| ISPMT <br><Badge text="v0.2.0"/>| Financial | Returns the interest paid for a given period of an investment with equal principal payments. | ISPMT(Rate; Per; Nper; Value) |
| NOMINAL <br><Badge text="v0.2.0"/>| Financial | Returns the nominal interest rate. | NOMINAL(Effect_rate; Npery) |
| NPER <br><Badge text="v0.2.0"/>| Financial | Returns the number of periods for an investment assuming periodic, constant payments and a constant interest rate. | NPER(Rate; Pmt; Pv[; Fv[; Type]]) |
| PMT <br><Badge text="v0.2.0"/>| Financial | Returns the periodic payment for a loan. | PMT(Rate; Nper; Pv[; Fv[; Type]]) |
| PPMT <br><Badge text="v0.2.0"/>| Financial | Calculates the principal portion of a given loan payment. | PPMT(Rate; Per; Nper; Pv[; Fv[; Type]]) |
| PV <br><Badge text="v0.2.0"/>| Financial | Returns the present value of an investment. | PV(Rate; Nper; Pmt[; Fv[; Type]]) |
| RATE <br><Badge text="v0.2.0"/>| Financial |  Returns the interest rate per period of an annuity. | RATE(Nper; Pmt; Pv[; Fv[; Type[; guess]]]) |
| RRI <br><Badge text="v0.2.0"/>| Financial | Returns an equivalent interest rate for the growth of an investment. | RRI(Nper; Pv; Fv) |
| SLN <br><Badge text="v0.2.0"/>| Financial | Returns the depreciation of an asset for one period, based on a straight-line method. | SLN(Cost; Salvage; Life) |
| SYD <br><Badge text="v0.2.0"/>| Financial | Returns the "sum-of-years" depreciation for an asset in a period. | SYD(Cost; Salvage; Life; Period) |
| TBILLEQ <br><Badge text="v0.2.0"/>| Financial | Returns the bond-equivalent yield for a Treasury bill. | TBILLEQ(Settlement; Maturity; Discount) |
| TBILLPRICE <br><Badge text="v0.2.0"/>| Financial | Returns the price per $100 face value for a Treasury bill. | TBILLPRICE(Settlement; Maturity; Discount) |
| TBILLYIELD <br><Badge text="v0.2.0"/>| Financial | Returns the yield for a Treasury bill. | TBILLYIELD(Settlement; Maturity; Price) |
| AND | Logical | Returns TRUE if all arguments are TRUE. | AND(Logicalvalue1; Logicalvalue2 ...Logicalvalue30) |
| FALSE | Logical | Returns the logical value FALSE. | FALSE() |
| IF | Logical | Specifies a logical test to be performed. | IF(Test; Then value; Otherwisevalue) |
| IFNA | Logical | Returns the value if the cell does not contains the #N/A (value not available) error value, or the alternative value if it does. | IFNA(Value; Alternate_value) |
| IFERROR | Logical | Returns the value if the cell does not contains an error value, or the alternative value if it does. | IFERROR(Value; Alternate_value) |
| NOT | Logical | Complements (inverts) a logical value. | NOT(Logicalvalue) |
| SWITCH | Logical | Evaluates a list of arguments, consisting of an expression followed by a value. | SWITCH(Expression1, Value1[, Expression2, Value2[..., Expression_n, Value_n]]) |
| OR | Logical | Returns TRUE if at least one argument is TRUE. | OR(Logicalvalue1; Logicalvalue2 ...Logicalvalue30) |
| TRUE | Logical | The logical value is set to TRUE. | TRUE() |
| XOR | Logical | Returns true if an odd number of arguments evaluates to TRUE. | XOR(Logicalvalue1; Logicalvalue2 ...Logicalvalue30) |
| CHOOSE | Lookup and reference | Uses an index to return a value from a list of up to 30 values.| CHOOSE(Index; Value1; ...; Value30) |
| COLUMNS | Lookup and reference | Returns the number of columns in the given reference. | COLUMNS(Array) |
| FORMULATEXT <br><Badge text="v0.2.0"/>| Lookup and reference | Returns a formula in a given cell as a string. | FORMULATEXT(Reference) |
| INDEX | Lookup and reference | Returns the content of a cell, specified by row and column number, or an optional range name. | INDEX(Reference; Row; Column; Range) |
| MATCH | Lookup and reference | Returns the relative position of an item in an array that matches a specified value. | MATCH(Searchcriterion; Lookuparray; Type) |
| OFFSET | Lookup and reference | Returns the value of a cell offset by a certain number of rows and columns from a given reference point. | OFFSET(Reference; Rows; Columns; Height; Width) |
| ROWS | Lookup and reference | Returns the number of rows in the given reference. | ROWS(Array) |
| VLOOKUP | Lookup and reference | Searches vertically with reference to adjacent cells to the right. | VLOOKUP(Search_Criterion; Array; Index; Sort_Order) |
| ABS | Math and trigonometry | Returns the absolute value of a number. | ABS(Number) |
| ACOS | Math and trigonometry | Returns the inverse trigonometric cosine of a number. | ACOS(Number) |
| ACOSH <br><Badge text="v0.2.0"/>| Math and trigonometry | Returns the inverse harmonic cosine of a number. | ACOSH(Number) |
| ACOT <br><Badge text="v0.2.0"/>| Math and trigonometry | Returns the inverse trigonometric cotangent of a number. | ACOT(Number) |
| ACOTH <br><Badge text="v0.2.0"/>| Math and trigonometry | Returns the inverse harmonic cotangent of a number. | ACOTH(Number) |
| ASIN | Math and trigonometry | Returns the inverse trigonometric sine of a number. | ASIN(Number) |
| ASINH <br><Badge text="v0.2.0"/>| Math and trigonometry | Returns the inverse harmonic sine of a number. | ASINH(Number) |
| ATAN | Math and trigonometry | Returns the inverse trigonometric tangent of a number. | ATAN(Number) |
| ATAN2 | Math and trigonometry | Returns the inverse trigonometric tangent of the specified x and y coordinates. | ATAN2(Numberx; Numbery) |
| ATANH <br><Badge text="v0.2.0"/>| Math and trigonometry | Returns the inverse harmonic tangent of a number. | ATANH(Number) |
| BASE | Math and trigonometry | Converts a positive integer to a specified base into a text from the numbering system. | BASE(Number; Radix; [Minimumlength]) |
| CEILING | Math and trigonometry | Rounds a number up to the nearest multiple of Significance. | CEILING(Number; Significance; Mode) |
| COS | Math and trigonometry | Returns the cosine of the given angle (in radians). | COS(Number) |
| COSH <br><Badge text="v0.2.0"/>| Math and trigonometry | Returns the hyperbolic cosine of the given value. | COSH(Number) |
| COT | Math and trigonometry | Returns the cotangent of the given angle (in radians). | COT(Number) |
| COTH <br><Badge text="v0.2.0"/>| Math and trigonometry | Returns the hyperbolic cotangent of the given value. | COTH(Number) |
| COUNTUNIQUE | Math and trigonometry | Counts the number of unique values in a list of specified values and ranges. | COUNTUNIQUE(Value1, [Value2, ...]) |
| CSC <br><Badge text="v0.2.0"/>| Math and trigonometry | Returns the cosecans of the given angle (in radians). | CSC(Number) |
| CSCH <br><Badge text="v0.2.0"/>| Math and trigonometry | Returns the hyperbolic cosecans of the given value. | CSCH(Number) |
| DECIMAL | Math and trigonometry | Converts text with characters from a number system to a positive integer in the base radix given. | DECIMAL("Text"; Radix) |
| DEGREES | Math and trigonometry | Converts radians into degrees. | DEGREES(Number) |
| EVEN | Math and trigonometry | Rounds a positive number up to the next even integer and a negative number down to the next even integer. | EVEN(Number) |
| EXP | Math and trigonometry | Returns e raised to the power of a number. | EXP(Number) |
| INT | Math and trigonometry | Rounds a number down to the nearest integer. | INT(Number) |
| LN | Math and trigonometry | Returns the natural logarithm based on the constant e of a number. | LN(Number) |
| LOG | Math and trigonometry | Returns the logarithm of a number to the specified base. | LOG(Number; Base) |
| LOG10 | Math and trigonometry | Returns the base-10 logarithm of a number. | LOG10(Number) |
| MOD | Math and trigonometry | Returns the remainder when one integer is divided by another. | MOD(Dividend; Divisor) |
| ODD | Math and trigonometry | Rounds a positive number up to the nearest odd integer and a negative number down to the nearest odd integer. | ODD(Number) |
| PI | Math and trigonometry | Returns 3.14159265358979, the value of the mathematical constant PI to 14 decimal places. | PI() |
| POWER | Math and trigonometry | Returns a number raised to another number. | POWER(Base; Exponent) |
| RADIANS | Math and trigonometry | Converts degrees to radians. | RADIANS(Number) |
| RAND | Math and trigonometry | Returns a random number between 0 and 1. | RAND() |
| ROUND | Math and trigonometry | Rounds a number to a certain number of decimal places. | ROUND(Number; Count) |
| ROUNDDOWN | Math and trigonometry | Rounds a number down, toward zero, to a certain precision. | ROUNDDOWN(Number; Count) |
| ROUNDUP | Math and trigonometry | Rounds a number up, away from zero, to a certain precision. | ROUNDUP(Number; Count) |
| SEC <br><Badge text="v0.2.0"/>| Math and trigonometry | Returns the secans of the given angle (in radians). | SEC(Number) |
| SECH <br><Badge text="v0.2.0"/>| Math and trigonometry | Returns the hyperbolic secans of the given value. | SEC(Number) |
| SIN | Math and trigonometry | Returns the sine of the given angle (in radians). | SIN(Number) |
| SINH <br><Badge text="v0.2.0"/>| Math and trigonometry | Returns the hyperbolic sine of the given value. | SINH(Number) |
| SQRT | Math and trigonometry | Returns the positive square root of a number. | SQRT(Number) |
| SUM | Math and trigonometry | Adds all the numbers in a range of cells. | SUM(Number1; Number2; ...; Number30) |
| SUMIF | Math and trigonometry | Adds the cells specified by given criteria. | SUMIF(Range; Criteria; Sumrange) |
| SUMIFS | Math and trigonometry | Returns the sum of the values of cells in a range that meets multiple criteria in multiple ranges. | SUMIFS(Sum_Range ; Criterion_range1 ; Criterion1 [ ; Criterion_range2 ; Criterion2 [;...]]) |
| SUMPRODUCT | Math and trigonometry | Multiplies corresponding elements in the given arrays, and returns the sum of those products. | SUMPRODUCT(Array1; Array2...Array30) |
| SUMSQ | Math and trigonometry | Returns the sum of the squares of the arguments | SUMSQ(Number1; Number2; ...; Number30) |
| TAN | Math and trigonometry | Returns the tangent of the given angle (in radians). | TAN(Number) |
| TANH <br><Badge text="v0.2.0"/>| Math and trigonometry | Returns the hyperbolic tangent of the given value. | TANH(Number) |
| TRUNC | Math and trigonometry | Truncates a number by removing decimal places. | TRUNC(Number; Count) |
| MMULT | Matrix functions | Calculates the array product of two arrays. | MMULT(Array; Array) |
| MEDIANPOOL | Matrix functions | Calculates a smaller range which is a median of a Window_size, in a given Range, for every Stride element. | MEDIANPOOL(Range, Window_size, Stride) |
| MAXPOOL | Matrix functions | Calculates a smaller range which is a maximum of a Window_size, in a given Range, for every Stride element. | MAXPOOL(Range, Window_size, Stride) |
| TRANSPOSE | Matrix functions | Transposes the rows and columns of an array. | TRANSPOSE(Array) |
| AVERAGE | Statistical | Returns the average of the arguments. | AVERAGE(Number1; Number2; ...Number30) |
| AVERAGEA | Statistical | Returns the average of the arguments. | AVERAGEA(Value1; Value2; ... Value30) |
| AVERAGEIF | Statistical | Returns the arithmetic mean of all cells in a range that satisfy a given condition. | AVERAGEIF(Range; Criterion [; Average_Range ]) |
| CORREL | Statistical | Returns the correlation coefficient between two data sets. | CORREL(Data1; Data2) |
| COUNT | Statistical | Counts how many numbers are in the list of arguments. | COUNT(Value1; Value2; ... Value30) |
| COUNTA | Statistical | Counts how many values are in the list of arguments. | COUNTA(Value1; Value2; ... Value30) |
| COUNTBLANK | Statistical | Returns the number of empty cells. | COUNTBLANK(Range) |
| COUNTIF | Statistical | Returns the number of cells that meet with certain criteria within a cell range. | COUNTIF(Range; Criteria) |
| COUNTIFS | Statistical | Returns the count of rows or columns that meet criteria in multiple ranges. | COUNTIFS(Range1; Criterion1 [; Range2; Criterion2 [; ...]]) |
| MAX | Statistical | Returns the maximum value in a list of arguments. | MAX(Number1; Number2; ...Number30) |
| MAXA | Statistical | Returns the maximum value in a list of arguments. | MAXA(Value1; Value2; ... Value30) |
| MEDIAN | Statistical | Returns the median of a set of numbers. | MEDIAN(Number1; Number2; ...Number30) |
| MIN | Statistical | Returns the minimum value in a list of arguments. | MIN(Number1; Number2; ...Number30) |
| MINA | Statistical | Returns the minimum value in a list of arguments. | MINA(Value1; Value2; ... Value30) |
| CHAR | Text | Converts a number into a character according to the current code table. | CHAR(Number) |
| CLEAN <br><Badge text="v0.2.0"/>| Text | Returns text that has been "cleaned" of line breaks and other non-printable characters. | CLEAN("Text") |
| CLEAN | Text | Returns text that has been "cleaned" of line breaks and other non-printable characters. | CLEAN("Text") |
| CODE | Text | Returns a numeric code for the first character in a text string. | CODE("Text") |
| CONCATENATE | Text | Combines several text strings into one string. | CONCATENATE("Text1"; ...; "Text30") |
| EXACT | Text | Returns TRUE if both text strings are exactly the same. | EXACT(Text; Text) |
| FIND <br><Badge text="v0.2.0"/>| Text | Returns the location of one text string inside another. | FIND( "Text1"; "Text2"[; Number]) |
| LEFT <br><Badge text="v0.2.0"/>| Text | Extracts a given number of characters from the left side of a text string. | LEFT("Text"; Number) |
| LEN <br><Badge text="v0.2.0"/>| Text | Returns length of a given text. | LEN("Text") |
| LOWER | Text | Returns text converted to lowercase. | LOWER(Text) |
| MID | Text | Returns substring of a given length starting from Start_position. | MID(Text, Start_position, Length) |
| PROPER <br><Badge text="v0.2.0"/>| Text | Capitalizes words given text string. | PROPER("Text") |
| REPLACE | Text | Replaces substring of a text of a given length that starts at given position. | REPLACE(Text; Start_position; Length; New_text) |
| REPT <br><Badge text="v0.2.0"/>| Text | Repeats text a given number of times. | REPT("Text"; Number) |
| RIGHT <br><Badge text="v0.2.0"/>| Text | Extracts a given number of characters from the right side of a text string. | RIGHT("Text"; Number) |
| SEARCH <br><Badge text="v0.2.0"/>| Text | Returns the location of one text string inside another. (Allows the use of wildcards.) | SEARCH( "Text1"; "Text2"[; Number]) |
| SPLIT | Text | Divides text around a specified character or string, and puts each fragment into a separate cell in the row. | SPLIT(Text, Delimiter, [Split_by_each], [Remove_empty_text]) |
| SUBSTITUTE | Text | Returns string where occurrences of Old_text are replaced by New_text. Replaces only specific occurrence if last parameter is provided.  | SUBSTITUTE(Text; Old_text; New_text; [Occurrence]) |
| T | Text | Returns text if given value is text, empty string otherwise. | T(Value) |
| TEXT | Text | Converts a number into text according to a given format. | TEXT(Number; Format) |
| TRIM <br><Badge text="v0.2.0"/>| Text | Strips extra spaces from text. | TRIM("Text") |
| UNICHAR | Text | Returns the character created by using provided code point. | UNICHAR(Number) |
| UNICODE | Text | Returns the Unicode code point of a first character of a text. | UNICODE(Text) |
| UPPER | Text | Returns text converted to uppercase. | UPPER(Text) |
