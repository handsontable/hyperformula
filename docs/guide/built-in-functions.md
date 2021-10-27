# Built-in functions

## Overview

HyperFormula comes with an extensive library of pre-built functions.
You can use them to create complex formulas for any business application.
Formula syntax and logic of function are similar to what is
considered the standard in modern spreadsheet software. That is
because a spreadsheet is probably the most universal software
ever created. We wanted the same flexibility for HyperFormula
but without the constraints of the spreadsheet UI.

The latest version of HyperFormula has an extensive collection of **{{ $page.functionsCount }}** functions grouped into categories:

- [Array manipulation](#array-manipulation)
- [Date and time](#date-and-time)
- [Engineering](#engineering)
- [Information](#information)
- [Financial](#financial)
- [Logical](#logical)
- [Lookup and reference](#lookup-and-reference)
- [Math and trigonometry](#math-and-trigonometry)
- [Matrix functions](#matrix-functions)
- [Operator](#operator)
- [Statistical](#statistical)
- [Text](#text)

_Some categories such as compatibility, cube, and database
are yet to be supported._

## Language packs

HyperFormula provides translation packs for 16 languages thus making
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
     src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/1.3.x/built-in-functions?autoresize=1&fontsize=11&hidenavigation=1&theme=light&view=preview"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="handsontable/hyperformula-demos: built-in-functions"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-autoplay allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

<br><br>

## List of available functions

Total number of functions: **{{ $page.functionsCount }}**

### Array manipulation

| Function ID | Description | Syntax |
| :--- | :--- | :--- |
| ARRAYFORMULA | Enables array arithmetic inside. | ARRAYFORMULA(Formula) |
| FILTER | Filters the array based on boolean arrays. | FILTER(Array; BoolArray1[; BoolArray2[; ...]])
| ARRAY_CONSTRAIN | Truncates the array to given dimensions. | ARRAY_CONSTRAIN(Array; Height; Width) |

### Date and time

| Function ID | Description | Syntax |
| :--- | :--- | :--- |
| DATE | Calculates a date specified by year, month, day, and displays it in the cell's formatting. | DATE(Year; Month; Day) |
| DATEDIF | Calculates distance between two dates, in provided unit parameter. | DATEDIF(Date1; Date2; Units) |
| DATEVALUE | Interprets string as date. | DATEVALUE(Datestring) |
| DAY | Returns the day of the given date value. | DAY(Number) |
| DAYS | Calculates the difference between two date values. | DAYS(Date2; Date1) |
| DAYS360 | Calculates the difference between two date values in days, in 360-day basis. | DAYS360(Date2; Date1[; Format]) |
| EDATE | Shifts the given startdate by given number of months. | EDATE(Startdate; Months) |
| EOMONTH | Returns the date of the last day of a month which falls months away from the start date. | EOMONTH(Startdate; Months) |
| HOUR | Returns hour component of given time. | HOUR(Time) |
| INTERVAL | Returns interval string from given number of seconds. | INTERVAL(Seconds) |
| ISOWEEKNUM | Returns an ISO week number that corresponds to the week of year. | ISOWEEKNUM(Date) |
| MINUTE | Returns minute component of given time. | MINUTE(Time) |
| MONTH | Returns the month for the given date value. | MONTH(Number) |
| NETWORKDAYS | Returns the number of working days between two given dates. | NETWORKDAYS(Date1; Date2[; Holidays]) | 
| NETWORKDAYS.INTL | Returns the number of working days between two given dates. | NETWORKDAYS.INTL(Date1; Date2[; Mode [; Holidays]]) |
| NOW | Returns current date + time. | NOW() |
| SECOND | Returns second component of given time. | SECOND(Time) |
| TIME | Calculates time from given hour, minute and second. | TIME(Hour; Minute; Second) |
| TIMEVALUE | Interprets string as time. | TIMEVALUE(Timestring) |
| TODAY | Returns current date. | TODAY() |
| WEEKDAY | Computes a number between 1-7 representing the day of week. | WEEKDAY(Date; Type) |
| WEEKNUM | Returns a week number that corresponds to the week of year. | WEEKNUM(Date; Type) |
| WORKDAY | Returns the working day number of days from start day. | WORKDAY(Date, Shift[; Holidays]) |
| WORKDAY.INTL | Returns the working day number of days from start day. | WORKDAY(Date, Shift[; Mode[; Holidays]]) |
| YEAR | Returns the year as a number according to the internal calculation rules. | YEAR(Number) |
| YEARFRAC | Computes the difference between two date values, in fraction of years. |  YEARFRAC(Date2; Date1[; Format]) |

### Engineering

| Function ID | Description | Syntax |
| :--- | :--- | :--- |
| BIN2DEC | The result is the decimal number for the binary number entered. | BIN2DEC(Number) |
| BIN2HEX | The result is the hexadecimal number for the binary number entered. | BIN2HEX(Number; Places) |
| BIN2OCT | The result is the octal number for the binary number entered. | BIN2OCT(Number; Places) |
| BITAND | Returns a bitwise logical "and" of the parameters. | BITAND(Number1; Number2) |
| BITLSHIFT | Shifts a number left by n bits. | BITLSHIFT(Number; Shift) |
| BITOR | Returns a bitwise logical "or" of the parameters. | BITOR(Number1; Number2) |
| BITRSHIFT | Shifts a number right by n bits. | BITRSHIFT(Number; Shift) |
| BITXOR | Returns a bitwise logical "exclusive or" of the parameters. | BITXOR(Number1; Number2) |
| COMPLEX |  Returns complex number from Re and Im parts. | COMPLEX(Re; Im[; Symbol]) |
| DEC2BIN | Returns the binary number for the decimal number entered between –512 and 511. | DEC2BIN(Number; Places) |
| DEC2HEX | Returns the hexadecimal number for the decimal number entered. | DEC2HEX(Number; Places) |
| DEC2OCT | Returns the octal number for the decimal number entered. | DEC2OCT(Number; Places) |
| DELTA | Returns TRUE (1) if both numbers are equal, otherwise returns FALSE (0). | DELTA(Number_1; Number_2) |
| ERF | Returns values of the Gaussian error integral. | ERF(Lower_Limit; Upper_Limit) |
| ERFC | Returns complementary values of the Gaussian error integral between x and infinity. | ERFC(Lower_Limit) |
| HEX2BIN | The result is the binary number for the hexadecimal number entered. | HEX2BIN(Number; Places) |
| HEX2DEC | The result is the decimal number for the hexadecimal number entered. | HEX2DEC(Number) |
| HEX2OCT | The result is the octal number for the hexadecimal number entered. | HEX2OCT(Number; Places) |
| IMABS | Returns module of a complex number. | IMABS(Complex) |
| IMAGINARY | Returns imaginary part of a complex number. | IMAGINARY(Complex) |
| IMARGUMENT | Returns argument of a complex number. | IMARGUMENT(Complex) |
| IMCONJUGATE | Returns conjugate of a complex number. | IMCONJUGATE(Complex) |
| IMCOS | Returns cosine of a complex number. | IMCOS(Complex) |
| IMCOSH | Returns hyperbolic cosine of a complex number. | IMCOSH(Complex) |
| IMCOT | Returns cotangens of a complex number. | IMCOT(Complex) |
| IMCSC | Returns cosecans of a complex number. | IMCSC(Complex) |
| IMCSCH | Returns hyperbolic cosecans of a complex number. | IMCSCH(Complex) |
| IMDIV | Divides two complex numbers. | IMDIV(Complex1; Complex2) |
| IMEXP | Returns exponent of a complex number. | IMEXP(Complex) |
| IMLN | Returns natural logarithm of a complex number. | IMLN(Complex) |
| IMLOG2 | Returns binary logarithm of a complex number. | IMLOG2(Complex) |
| IMLOG10 | Returns base-10 logarithm of a complex number. | IMLOG10(Complex) |
| IMPOWER | Returns a complex number raised to a given power. | IMPOWER(Complex; Number) |
| IMPRODUCT | Multiplies complex numbers. | IMPRODUCT(Complex1 ...Complex30) |
| IMREAL | Returns real part of a complex number. | IMREAL(Complex) |
| IMSEC | Returns the secant of a complex number. | IMSEC(Complex) |
| IMSECH | Returns the hyperbolic secant of a complex number. | IMSECH(Complex) |
| IMSIN | Returns sine of a complex number. | IMSIN(Complex) |
| IMSINH | Returns hyperbolic sine of a complex number. | IMSINH(Complex) |
| IMSQRT | Returns a square root of a complex number. | IMSQRT(Complex) |
| IMSUB | Subtracts two complex numbers. | IMSUB(Complex1; Complex2) |
| IMSUM | Adds complex numbers. | IMSUM(Complex1 ...Complex30) |
| IMTAN | Returns the tangent of a complex number. | IMTAN(Complex) |
| OCT2BIN | The result is the binary number for the octal number entered. | OCT2BIN(Number; Places) |
| OCT2DEC | The result is the decimal number for the octal number entered. | OCT2DEC(Number) |
| OCT2HEX | The result is the hexadecimal number for the octal number entered. | OCT2HEX(Number; Places) |

### Information

| Function ID | Description | Syntax |
| :--- | :--- | :--- |
| ISBINARY | Returns TRUE if provided value is a valid binary number. | ISBINARY(Value) |
| ISBLANK | Returns TRUE if the reference to a cell is blank. | ISBLANK(Value) |
| ISERR | Returns TRUE if the value is error value except #N/A!. | ISERR(Value) |
| ISERROR | Returns TRUE if the value is general error value. | ISERROR(Value) |
| ISEVEN | Returns TRUE if the value is an even integer, or FALSE if the value is odd. | ISEVEN(Value) |
| ISFORMULA | Checks whether referenced cell is a formula. | ISFORMULA(Value) |
| ISLOGICAL | Tests for a logical value (TRUE or FALSE). | ISLOGICAL(Value) |
| ISNA | Returns TRUE if the value is #N/A! error. | ISNA(Value) |
| ISNONTEXT | Tests if the cell contents are text or numbers, and returns FALSE if the contents are text. | ISNONTEXT(Value) |
| ISNUMBER | Returns TRUE if the value refers to a number. | ISNUMBER(Value) |
| ISODD | Returns TRUE if the value is odd, or FALSE if the number is even. | ISODD(Value) |
| ISREF | Returns TRUE if provided value is #REF! error. | ISREF(Value) |
| ISTEXT | Returns TRUE if the cell contents refer to text. | ISTEXT(Value) |
| SHEET | Returns sheet number of a given value or a formula sheet number if no argument is provided. | SHEET([Value]) |
| SHEETS | Returns number of sheet of a given reference or number of all sheets in workbook when no argument is provided. | SHEETS([Value]) |
| NA | Returns #N/A! error value.| NA(Value) |

### Financial

| Function ID | Description | Syntax |
| :--- | :--- | :--- |
| CUMIPMT | Returns the cumulative interest paid on a loan between a start period and an end period. | CUMIPMT(Rate; Nper; Pv; Start, End; type) |
| CUMPRINC | Returns the cumulative principal paid on a loan between a start period and an end period. | CUMPRINC(Rate; Nper; Pv; Start; End; Type) |
| DB | Returns the depreciation of an asset for a period using the fixed-declining balance method. | DB(Cost; Salvage; Life; Period[; Month]) |
| DDB | Returns the depreciation of an asset for a period using the double-declining balance method. | DDB(Cost, Salvage; Life; Period[; Factor]) |
| DOLLARDE | Converts a price entered with a special notation to a price displayed as a decimal number. | DOLLARDE(Price, Fraction) |
| DOLLARFR | Converts a price displayed as a decimal number to a price entered with a special notation. | DOLLARFR(Price, Fraction) |
| EFFECT | Calculates the effective annual interest rate from a nominal interest rate and the number of compounding periods per year. | EFFECT (Nominal_rate; Npery) |
| FV | Returns the future value of an investment. | FV(Rate; Nper; Pmt[; Pv;[ Type]]) |
| FVSCHEDULE | Returns the future value of an investment based on a rate schedule. | FV(Pv; Schedule) |
| IPMT | Returns the interest portion of a given loan payment in a given payment period. | IPMT(Rate; Per; Nper; Pv[; Fv[; Type]]) |
| ISPMT | Returns the interest paid for a given period of an investment with equal principal payments. | ISPMT(Rate; Per; Nper; Value) |
| MIRR | Returns modified internal value for cashflows. | MIRR(Flows; FRate; RRate) |
| NOMINAL | Returns the nominal interest rate. | NOMINAL(Effect_rate; Npery) |
| NPER | Returns the number of periods for an investment assuming periodic, constant payments and a constant interest rate. | NPER(Rate; Pmt; Pv[; Fv[; Type]]) |
| NPV | Returns net present value. | NPV(Rate; Value1; ...; Value30) |
| PDURATION | Returns number of periods to reach specific value. | PDURATION(Rate; Pv; Fv) |
| PMT | Returns the periodic payment for a loan. | PMT(Rate; Nper; Pv[; Fv[; Type]]) |
| PPMT | Calculates the principal portion of a given loan payment. | PPMT(Rate; Per; Nper; Pv[; Fv[; Type]]) |
| PV | Returns the present value of an investment. | PV(Rate; Nper; Pmt[; Fv[; Type]]) |
| RATE |  Returns the interest rate per period of an annuity. | RATE(Nper; Pmt; Pv[; Fv[; Type[; guess]]]) |
| RRI | Returns an equivalent interest rate for the growth of an investment. | RRI(Nper; Pv; Fv) |
| SLN | Returns the depreciation of an asset for one period, based on a straight-line method. | SLN(Cost; Salvage; Life) |
| SYD | Returns the "sum-of-years" depreciation for an asset in a period. | SYD(Cost; Salvage; Life; Period) |
| TBILLEQ | Returns the bond-equivalent yield for a Treasury bill. | TBILLEQ(Settlement; Maturity; Discount) |
| TBILLPRICE | Returns the price per $100 face value for a Treasury bill. | TBILLPRICE(Settlement; Maturity; Discount) |
| TBILLYIELD | Returns the yield for a Treasury bill. | TBILLYIELD(Settlement; Maturity; Price) |
| XNPV | Returns net present value. | XNPV(Rate; Payments; Dates) |

### Logical

| Function ID | Description | Syntax |
| :--- | :--- | :--- |
| AND | Returns TRUE if all arguments are TRUE. | AND(Logicalvalue1; Logicalvalue2 ...Logicalvalue30) |
| FALSE | Returns the logical value FALSE. | FALSE() |
| IF | Specifies a logical test to be performed. | IF(Test; Then value; Otherwisevalue) |
| IFNA | Returns the value if the cell does not contains the #N/A (value not available) error value, or the alternative value if it does. | IFNA(Value; Alternate_value) |
| IFERROR | Returns the value if the cell does not contains an error value, or the alternative value if it does. | IFERROR(Value; Alternate_value) |
| NOT | Complements (inverts) a logical value. | NOT(Logicalvalue) |
| SWITCH | Evaluates a list of arguments, consisting of an expression followed by a value. | SWITCH(Expression1, Value1[, Expression2, Value2[..., Expression_n, Value_n]]) |
| OR | Returns TRUE if at least one argument is TRUE. | OR(Logicalvalue1; Logicalvalue2 ...Logicalvalue30) |
| TRUE | The logical value is set to TRUE. | TRUE() |
| XOR | Returns true if an odd number of arguments evaluates to TRUE. | XOR(Logicalvalue1; Logicalvalue2 ...Logicalvalue30) |

### Lookup and reference

| Function ID | Description | Syntax |
| :--- | :--- | :--- |
| CHOOSE | Uses an index to return a value from a list of up to 30 values.| CHOOSE(Index; Value1; ...; Value30) |
| COLUMN | Returns column number of a given reference or formula reference if argument not provided. | COLUMNS([Reference]) |
| COLUMNS | Returns the number of columns in the given reference. | COLUMNS(Array) |
| FORMULATEXT | Returns a formula in a given cell as a string. | FORMULATEXT(Reference) |
| HLOOKUP | Searches horizontally with reference to adjacent cells to the bottom. | HLOOKUP(Search_Criterion; Array; Index; Sort_Order) |
| INDEX | Returns the content of a cell, specified by row and column number, or an optional range name. | INDEX(Reference; Row; Column; Range) |
| MATCH | Returns the relative position of an item in an array that matches a specified value. | MATCH(Searchcriterion; Lookuparray; Type) |
| OFFSET | Returns the value of a cell offset by a certain number of rows and columns from a given reference point. | OFFSET(Reference; Rows; Columns; Height; Width) |
| ROW | Returns row number of a given reference or formula reference if argument not provided. | ROW([Reference]) |
| ROWS | Returns the number of rows in the given reference. | ROWS(Array) |
| VLOOKUP | Searches vertically with reference to adjacent cells to the right. | VLOOKUP(Search_Criterion; Array; Index; Sort_Order) |

### Math and trigonometry

| Function ID | Description | Syntax |
| :--- | :--- | :--- |
| ABS | Returns the absolute value of a number. | ABS(Number) |
| ACOS | Returns the inverse trigonometric cosine of a number. | ACOS(Number) |
| ACOSH | Returns the inverse hyperbolic cosine of a number. | ACOSH(Number) |
| ACOT | Returns the inverse trigonometric cotangent of a number. | ACOT(Number) |
| ACOTH | Returns the inverse hyperbolic cotangent of a number. | ACOTH(Number) |
| ARABIC | Converts number from roman form. | ARABIC(String) |
| ASIN | Returns the inverse trigonometric sine of a number. | ASIN(Number) |
| ASINH | Returns the inverse hyperbolic sine of a number. | ASINH(Number) |
| ATAN | Returns the inverse trigonometric tangent of a number. | ATAN(Number) |
| ATAN2 | Returns the inverse trigonometric tangent of the specified x and y coordinates. | ATAN2(Numberx; Numbery) |
| ATANH | Returns the inverse hyperbolic tangent of a number. | ATANH(Number) |
| BASE | Converts a positive integer to a specified base into a text from the numbering system. | BASE(Number; Radix; [Minimumlength]) |
| CEILING | Rounds a number up to the nearest multiple of Significance. | CEILING(Number; Significance) |
| CEILING.MATH | Rounds a number up to the nearest multiple of Significance. | CEILING.MATH(Number[; Significance[; Mode]]) |
| CEILING.PRECISE | Rounds a number up to the nearest multiple of Significance. | CEILING.PRECISE(Number[; Significance]) |
| COMBIN | Returns number of combinations (without repetitions). | COMBIN(Number; Number) |
| COMBINA | Returns number of combinations (with repetitions). | COMBINA(Number; Number) |
| COS | Returns the cosine of the given angle (in radians). | COS(Number) |
| COSH | Returns the hyperbolic cosine of the given value. | COSH(Number) |
| COT | Returns the cotangent of the given angle (in radians). | COT(Number) |
| COTH | Returns the hyperbolic cotangent of the given value. | COTH(Number) |
| COUNTUNIQUE | Counts the number of unique values in a list of specified values and ranges. | COUNTUNIQUE(Value1, [Value2, ...]) |
| CSC | Returns the cosecans of the given angle (in radians). | CSC(Number) |
| CSCH | Returns the hyperbolic cosecant of the given value. | CSCH(Number) |
| DECIMAL | Converts text with characters from a number system to a positive integer in the base radix given. | DECIMAL("Text"; Radix) |
| DEGREES | Converts radians into degrees. | DEGREES(Number) |
| EVEN | Rounds a positive number up to the next even integer and a negative number down to the next even integer. | EVEN(Number) |
| EXP | Returns constant e raised to the power of a number. | EXP(Number) |
| FACT | Returns a factorial of a number. | FACT(Number) |
| FACTDOUBLE | Returns a double factorial of a number. | FACTDOUBLE(Number) |
| FLOOR | Rounds a number down to the nearest multiple of Significance. | FLOOR(Number; Significance) |
| FLOOR.MATH | Rounds a number down to the nearest multiple of Significance. | FLOOR.MATH(Number[; Significance[; Mode]]) |
| FLOOR.PRECISE | Rounds a number down to the nearest multiple of Significance. | FLOOR.PRECISE(Number[; Significance]) |
| GCD | Computes greatest common divisor of numbers. | GCD(Number1; Number2; ...) |
| INT | Rounds a number down to the nearest integer. | INT(Number) |
| ISO.CEILING | Rounds a number up to the nearest multiple of Significance. | ISO.CEILING(Number[; Significance]) |
| LCM | Computes least common multiplicity of numbers. | LCM(Number1; Number2; ...) |
| LN | Returns the natural logarithm based on the constant e of a number. | LN(Number) |
| LOG | Returns the logarithm of a number to the specified base. | LOG(Number; Base) |
| LOG10 | Returns the base-10 logarithm of a number. | LOG10(Number) |
| MOD | Returns the remainder when one integer is divided by another. | MOD(Dividend; Divisor) |
| MROUND | Rounds number to the neares multiplicity. | MROUND(Number; Base) |
| MULTINOMIAL | Returns number of multiset combinations. | MULTINOMIAL(Number1; Number2; ...) |
| ODD | Rounds a positive number up to the nearest odd integer and a negative number down to the nearest odd integer. | ODD(Number) |
| PI | Returns 3.14159265358979, the value of the mathematical constant PI to 14 decimal places. | PI() |
| POWER | Returns a number raised to another number. | POWER(Base; Exponent) |
| PRODUCT | Returns product of numbers. | PRODUCT(Number1; Number2; ...; Number30) |
| QUOTIENT | Returns integer part of a division. | QUOTIENT(Dividend; Divisor) |
| RADIANS | Converts degrees to radians. | RADIANS(Number) |
| RAND | Returns a random number between 0 and 1. | RAND() |
| RANDBETWEEN | Returns a random integer between two numbers. | RAND(Lowerbound; Upperbound) |
| ROMAN | Converts number to roman form. | ROMAN(Number[; Mode]) |
| ROUND | Rounds a number to a certain number of decimal places. | ROUND(Number; Count) |
| ROUNDDOWN | Rounds a number down, toward zero, to a certain precision. | ROUNDDOWN(Number; Count) |
| ROUNDUP | Rounds a number up, away from zero, to a certain precision. | ROUNDUP(Number; Count) |
| SEC | Returns the secant of the given angle (in radians). | SEC(Number) |
| SECH | Returns the hyperbolic secant of the given angle (in radians). | SEC(Number) |
| SERIESSUM | Evaluates series at a point. | SERIESSUM(Number; Number; Number; Coefficients)
| SIN | Returns the sine of the given angle (in radians). | SIN(Number) |
| SINH | Returns the hyperbolic sine of the given value. | SINH(Number) |
| SIGN | Returns sign of a number. | SIGN(Number) |
| SQRT | Returns the positive square root of a number. | SQRT(Number) |
| SQRTPI | Returns sqrt of number times pi. | SQRTPI(Number) |
| SUBTOTAL | Computes aggregation using function specified by number. | SUBTOTAL(Function; Number1; Number2; ... Number30) |
| SUM | Adds all the numbers in a range of cells. | SUM(Number1; Number2; ...; Number30) |
| SUMIF | Adds the cells specified by given criteria. | SUMIF(Range; Criteria; Sumrange) |
| SUMIFS | Returns the sum of the values of cells in a range that meets multiple criteria in multiple ranges. | SUMIFS(Sum_Range ; Criterion_range1 ; Criterion1 [ ; Criterion_range2 ; Criterion2 [;...]]) |
| SUMPRODUCT | Multiplies corresponding elements in the given arrays, and returns the sum of those products. | SUMPRODUCT(Array1; Array2...Array30) |
| SUMSQ | Returns the sum of the squares of the arguments | SUMSQ(Number1; Number2; ...; Number30) |
| SUMX2MY2 | Returns the sum of the square differences. | SUMX2MY2(Range1; Range2) |
| SUMX2PY2 | Returns the sum of the square sums. | SUMX2PY2(Range1; Range2) |
| SUMXMY2 | Returns the sum of the square of differences. | SUMXMY2(Range1; Range2) |
| TAN | Returns the tangent of the given angle (in radians). | TAN(Number) |
| TANH | Returns the hyperbolic tangent of the given value. | TANH(Number) |
| TRUNC | Truncates a number by removing decimal places. | TRUNC(Number; Count) |

### Matrix functions

| Function ID | Description | Syntax |
| :--- | :--- | :--- |
| MMULT | Calculates the array product of two arrays. | MMULT(Array; Array) |
| MEDIANPOOL | Calculates a smaller range which is a median of a Window_size, in a given Range, for every Stride element. | MEDIANPOOL(Range, Window_size, Stride) |
| MAXPOOL | Calculates a smaller range which is a maximum of a Window_size, in a given Range, for every Stride element. | MAXPOOL(Range, Window_size, Stride) |
| TRANSPOSE | Transposes the rows and columns of an array. | TRANSPOSE(Array) |

### Operator

| Function ID | Description | Syntax |
| :--- | :--- | :--- |
| HF.ADD | Adds two values. | HF.ADD(Number; Number) |
| HF.CONCAT | Concatenates two strings. | HF.CONCAT(String; String) |
| HF.DIVIDE | Divides two values. | HF.DIVIDE(Number; Number) |
| HF.EQ | Tests two values for equality. | HF.EQ(Value; Value) |
| HF.LTE | Tests two values for less-equal relation. | HF.LEQ(Value; Value) |
| HF.LT | Tests two values for less-than relation. | HF.LT(Value; Value) |
| HF.GTE | Tests two values for greater-equal relation. | HF.GEQ(Value; Value) |
| HF.GT | Tests two values for greater-than relation. | HF.GT(Value; Value) |
| HF.MINUS | Subtracts two values. | HF.MINUS(Number; Number) |
| HF.MULTIPLY | Multiplies two values. | HF.MULTIPLY(Number; Number) |
| HF.NE | Tests two values for inequality. | HF.NE(Value; Value) |
| HF.POW | Computes power of two values. | HF.POW(Number; Number) |
| HF.UMINUS | Negates the value. | HF.UMINUS(Number) |
| HF.UNARY_PERCENT | Applies percent operator. | HF.UNARY_PERCENT(Number) |
| HF.UPLUS | Applies unary plus. | HF.UPLUS(Number) |

### Statistical

| Function ID | Description | Syntax |
| :--- | :--- | :--- |
| AVEDEV | Returns the average deviation of the arguments. | AVEDEV(Number1; Number2; ...Number30) |
| AVERAGE | Returns the average of the arguments. | AVERAGE(Number1; Number2; ...Number30) |
| AVERAGEA | Returns the average of the arguments. | AVERAGEA(Value1; Value2; ... Value30) |
| AVERAGEIF | Returns the arithmetic mean of all cells in a range that satisfy a given condition. | AVERAGEIF(Range; Criterion [; Average_Range ]) |
| BESSELI | Returns value of Bessel function. | BESSELI(x; n) |
| BESSELJ | Returns value of Bessel function. | BESSELJ(x; n) |
| BESSELK | Returns value of Bessel function. | BESSELK(x; n) |
| BESSELY | Returns value of Bessel function. | BESSELY(x; n) |
| BETA.DIST | Returns the denisty of Beta distribution. | BETA.DIST(Number1; Number2; Number3; Boolean[; Number4[; Number5]]) |
| BETADIST | Returns the denisty of Beta distribution. | BETADIST(Number1; Number2; Number3; Boolean[; Number4[; Number5]]) |
| BETA.INV | Returns the inverse Beta distribution value. | BETA.INV(Number1; Number2; Number3[; Number4[; Number5]]) |
| BETAINV | Returns the inverse of Beta distribution value. | BETAINV(Number1; Number2; Number3[; Number4[; Number5]]) |
| BINOM.DIST | Returns density of binomial distribution. | BINOM.DIST(Number1; Number2; Number3; Boolean) |
| BINOMDIST | Returns density of binomial distribution. | BINOMDIST(Number1; Number2; Number3; Boolean) |
| BINOM.INV | Returns inverse binomial distribution value. | BINOM.INV(Number1; Number2; Number3) |
| CHIDIST | Returns probability of chi-square right-side distribution. | CHIDIST(X; Degrees) |
| CHIINV | Returns inverse of chi-square right-side distribution. | CHIINV(P; Degrees) |
| CHIINVRT | Returns inverse of chi-square right-side distribution. | CHIINVRT(P; Degrees) |
| CHISQ.DIST | Returns value of chi-square distribution. | CHISQ.DIST(X; Degrees; Mode) |
| CHIDISTRT | Returns probability of chi-square right-side distribution. | CHIDISTRT(X; Degrees) |
| CHISQ.DIST.RT | Returns probability of chi-square right-side distribution. | CHISQ.DIST.RT(X; Degrees) |
| CHISQ.INV | Returns inverse of chi-square distribution. | CHISQ.INV.RT(P; Degrees) |
| CHISQ.INV.RT | Returns inverse of chi-square right-side distribution. | CHISQ.INV.RT(P; Degrees) |
| CHISQ.TEST | Returns chisquared-test value for a dataset. | CHISQ.TEST(Array1; Array2) |
| CHITEST | Returns chisquared-test value for a dataset. | CHITEST(Array1; Array2) |
| CONFIDENCE | Returns upper confidence bound for normal distribution. | CONFIDENCE(Alpha; Stdev; Size) |
| CONFIDENCE.NORM | Returns upper confidence bound for normal distribution. | CONFIDENCE.NORM(Alpha; Stdev; Size) |
| CONFIDENCE.T | Returns upper confidence bound for T distribution. | CONFIDENCE.T(Alpha; Stdev; Size) |
| CORREL | Returns the correlation coefficient between two data sets. | CORREL(Data1; Data2) |
| COUNT | Counts how many numbers are in the list of arguments. | COUNT(Value1; Value2; ... Value30) |
| COUNTA | Counts how many values are in the list of arguments. | COUNTA(Value1; Value2; ... Value30) |
| COUNTBLANK | Returns the number of empty cells. | COUNTBLANK(Range) |
| COUNTIF | Returns the number of cells that meet with certain criteria within a cell range. | COUNTIF(Range; Criteria) |
| COUNTIFS | Returns the count of rows or columns that meet criteria in multiple ranges. | COUNTIFS(Range1; Criterion1 [; Range2; Criterion2 [; ...]]) |
| COVAR | Returns the covariance between two data sets, population normalized. | COVAR(Data1; Data2) |
| COVARIANCE.P | Returns the covariance between two data sets, population normalized. | COVARIANCE.P(Data1; Data2) |
| COVARIANCEP | Returns the covariance between two data sets, population normalized. | COVARIANCEP(Data1; Data2) |
| COVARIANCE.S | Returns the covariance between two data sets, sample normalized. | COVARIANCE.S(Data1; Data2) |
| COVARIANCES | Returns the covariance between two data sets, sample normalized. | COVARIANCES(Data1; Data2) |
| CRITBINOM | Returns inverse binomial distribution value. | CRITBINOM(Number1; Number2; Number3) |
| DEVSQ | Returns sum of squared deviations. | DEVSQ(Number1; Number2; ...Number30) |
| EXPON.DIST | Returns density of a exponential distribution. | EXPON.DIST(Number1; Number2; Boolean) |
| EXPONDIST | Returns density of a exponential distribution. | EXPONDIST(Number1; Number2; Boolean) |
| FDIST | Returns probability of F right-side distribution. | FDIST(X; Degree1; Degree2) |
| FINV | Returns inverse of F right-side distribution. | FINV(P; Degree1; Degree2) |
| F.DIST | Returns value of F distribution. | F.DIST(X; Degree1; Degree2; Mode) |
| F.DIST.RT | Returns probability of F right-side distribution. | F.DIST.RT(X; Degree1; Degree2) |
| FDISTRT | Returns probability of F right-side distribution. | FDISTRT(X; Degree1; Degree2) |
| F.INV | Returns inverse of F distribution. | F.INV.RT(P; Degree1; Degree2) |
| F.INV.RT | Returns inverse of F right-side distribution. | F.INV.RT(P; Degree1; Degree2) |
| FINVRT | Returns inverse of F right-side distribution. | FINVRT(P; Degree1; Degree2) |
| FISHER | Returns Fisher transformation value. | FISHER(Number) |
| FISHERINV | Returns inverse Fischer transformation value. | FISHERINV(Number) |
| F.TEST | Returns f-test value for a dataset. | Z.TEST(Array1; Array2) |
| FTEST | Returns f-test value for a dataset. | ZTEST(Array1; Array2) |
| GAMMA | Returns value of Gamma function. | GAMMA(Number) |
| GAMMA.DIST | Returns density of Gamma distribution. | GAMMA.DIST(Number1; Number2; Number3; Boolean) |
| GAMMADIST | Returns density of Gamma distribution. | GAMMADIST(Number1; Number2; Number3; Boolean) |
| GAMMALN | Returns natural logarithm of Gamma function. | GAMMALN(Number) |
| GAMMALN.PRECISE | Returns natural logarithm of Gamma function. | GAMMALN.PRECISE(Number) |
| GAMMA.INV | Returns inverse Gamma distribution value. | GAMMA.INV(Number1; Number2; Number3) |
| GAMMAINV | Returns inverse Gamma distribution value. | GAMMAINV(Number1; Number2; Number3) |
| GAUSS | Returns the probability of gaussian variable fall more than this many times standard deviation from mean. | GAUSS(Number) |
| GEOMEAN | Returns the geometric average. | GEOMEAN(Number1; Number2; ...Number30) |
| HARMEAN | Returns the harmonic average. | HARMEAN(Number1; Number2; ...Number30) |
| HYPGEOMDIST | Returns density of hypergeometric distribution. | HYPGEOMDIST(Number1; Number2; Number3; Number4; Boolean) |
| HYPGEOM.DIST | Returns density of hypergeometric distribution. | HYPGEOM.DIST(Number1; Number2; Number3; Number4; Boolean) |
| LARGE | Returns k-th largest value in a range. | LARGE(Range; K) |
| LOGNORM.DIST | Returns density of lognormal distribution. | LOGNORM.DIST(X; Mean; Stddev; Mode) |
| LOGNORMDIST | Returns density of lognormal distribution. | LOGNORMDIST(X; Mean; Stddev; Mode) |
| LOGNORM.INV | Returns value of inverse lognormal distribution. | LOGNORM.INV(P; Mean; Stddev) |
| LOGNORMINV | Returns value of inverse lognormal distribution. | LOGNORMINV(P; Mean; Stddev) |
| LOGINV | Returns value of inverse lognormal distribution. | LOGINV(P; Mean; Stddev) |
| MAX | Returns the maximum value in a list of arguments. | MAX(Number1; Number2; ...Number30) |
| MAXA | Returns the maximum value in a list of arguments. | MAXA(Value1; Value2; ... Value30) |
| MEDIAN | Returns the median of a set of numbers. | MEDIAN(Number1; Number2; ...Number30) |
| MIN | Returns the minimum value in a list of arguments. | MIN(Number1; Number2; ...Number30) |
| MINA | Returns the minimum value in a list of arguments. | MINA(Value1; Value2; ... Value30) |
| NEGBINOM.DIST | Returns density of negative binomial distribution. | NEGBINOM.DIST(Number1; Number2; Number3; Mode) |
| NEGBINOMDIST | Returns density of negative binomial distribution. | NEGBINOMDIST(Number1; Number2; Number3; Mode) |
| NORM.DIST | Returns density of normal distribution. | NORM.DIST(X; Mean; Stddev; Mode) |
| NORMDIST | Returns density of normal distribution. | NORMDIST(X; Mean; Stddev; Mode) |
| NORM.S.DIST | Returns density of normal distribution. | NORM.S.DIST(X; Mode) |
| NORMDIST | Returns density of normal distribution. | NORMSDIST(X; Mode) |
| NORM.INV | Returns value of inverse normal distribution. | NORM.INV(P; Mean; Stddev) |
| NORMINV | Returns value of inverse normal distribution. | NORMINV(P; Mean; Stddev) |
| NORM.S.INV | Returns value of inverse normal distribution. | NORM.S.INV(P) |
| NORMSINV | Returns value of inverse normal distribution. | NORMSINV(P) |
| PEARSON | Returns the correlation coefficient between two data sets. | PEARSON(Data1; Data2) |
| PHI | Returns probability densitity of normal distribution. | PHI(X) |
| POISSON | Returns density of Poisson distribution. | POISSON(X; Mean; Mode) |
| POISSON.DIST | Returns density of Poisson distribution. | POISSON.DIST(X; Mean; Mode) |
| POISSONDIST | Returns density of Poisson distribution. | POISSONDIST(X; Mean; Mode) |
| RSQ | Returns the squared correlation coefficient between two data sets. | RSQ(Data1; Data2) |
| SKEW | Returns skeweness of a sample. | SKEW(Number1; Number2; ...Number30) |
| SKEW.P | Returns skeweness of a population. | SKEW.P(Number1; Number2; ...Number30) |
| SKEWP | Returns skeweness of a population. | SKEWP(Number1; Number2; ...Number30) |
| SLOPE | Returns the slope of a linear regression line. | SLOPE(Array1; Array2) |
| SMALL | Returns k-th smallest value in a range. | SMALL(Range; K) |
| STANDARDIZE | Returns normalized value wrt expected value and standard deviation. | STANDARDIZE(X; Mean; Stddev) |
| STDEV | Returns standard deviation of a sample. | STDEV(Value1; Value2; ... Value30) |
| STDEVA | Returns standard deviation of a sample. | STDEVA(Value1; Value2; ... Value30) |
| STDEVP | Returns standard deviation of a population. | STDEVP(Value1; Value2; ... Value30) |
| STDEV.P | Returns standard deviation of a population. | STDEV.P(Value1; Value2; ... Value30) |
| STDEVPA | Returns standard deviation of a population. | STDEVPA(Value1; Value2; ... Value30) |
| STDEV.S | Returns standard deviation of a sample. | STDEV.S(Value1; Value2; ... Value30) |
| STDEVS | Returns standard deviation of a sample. | STDEVS(Value1; Value2; ... Value30) |
| STEYX | Returns standard error for predicted of the predicted y value for each x value. | STEYX(Array1; Array2) |
| TDIST | Returns density of Student-t distribution, both-sided or right-tailed. | TDIST(X; Degrees; Mode) |
| T.DIST | Returns density of Student-t distribution. | T.DIST(X; Degrees; Mode) |
| T.DIST.2T | Returns density of Student-t distribution, both-sided. | T.DIST.2T(X; Degrees) |
| TDIST2T | Returns density of Student-t distribution, both-sided. | TDIST2T(X; Degrees) |
| T.DIST.RT | Returns density of Student-t distribution, right-tailed. | T.DIST.RT(X; Degrees) |
| TDISTRT | Returns density of Student-t distribution, right-tailed. | TDISTRT(X; Degrees) |
| TINV | Returns inverse Student-t distribution, both-sided. | TINV(P; Degrees) |
| T.INV | Returns inverse Student-t distribution. | T.INV(P; Degrees) |
| T.INV.2T | Returns inverse Student-t distribution, both-sided. | T.INV.2T(P; Degrees) |
| TINV2T | Returns inverse Student-t distribution, both-sided. | TINV2T(P; Degrees) |
| TTEST | Returns t-test value for a dataset. | TTEST(Array1; Array2) |
| T.TEST | Returns t-test value for a dataset. | T.TEST(Array1; Array2) |
| VAR | Returns variance of a sample. | VAR(Value1; Value2; ... Value30) |
| VARA | Returns variance of a sample. | VARA(Value1; Value2; ... Value30) |
| VARP | Returns variance of a population. | VARP(Value1; Value2; ... Value30) |
| VAR.P | Returns variance of a population. | VAR.P(Value1; Value2; ... Value30) |
| VARPA | Returns variance of a population. | VARPA(Value1; Value2; ... Value30) |
| VAR.S | Returns variance of a sample. | VAR.S(Value1; Value2; ... Value30) |
| VARS | Returns variance of a sample. | VARS(Value1; Value2; ... Value30) |
| WEIBULL | Returns density of Weibull distribution. | WEIBULL(Number1; Number2; Number3; Boolean) |
| WEIBULL.DIST | Returns density of Weibull distribution. | WEIBULL.DIST(Number1; Number2; Number3; Boolean) |
| WEIBULLDIST | Returns density of Weibull distribution. | WEIBULLDIST(Number1; Number2; Number3; Boolean) |
| Z.TEST | Returns z-test value for a dataset. | Z.TEST(Array; X[; Sigma]) |
| ZTEST | Returns z-test value for a dataset. | ZTEST(Array; X[; Sigma]) |

### Text

| Function ID | Description | Syntax |
| :--- | :--- | :--- |
| CHAR | Converts a number into a character according to the current code table. | CHAR(Number) |
| CLEAN | Returns text that has been "cleaned" of line breaks and other non-printable characters. | CLEAN("Text") |
| CODE | Returns a numeric code for the first character in a text string. | CODE("Text") |
| CONCATENATE | Combines several text strings into one string. | CONCATENATE("Text1"; ...; "Text30") |
| EXACT | Returns TRUE if both text strings are exactly the same. | EXACT(Text; Text) |
| FIND | Returns the location of one text string inside another. | FIND( "Text1"; "Text2"[; Number]) |
| LEFT | Extracts a given number of characters from the left side of a text string. | LEFT("Text"; Number) |
| LEN | Returns length of a given text. | LEN("Text") |
| LOWER | Returns text converted to lowercase. | LOWER(Text) |
| MID | Returns substring of a given length starting from Start_position. | MID(Text, Start_position, Length) |
| PROPER | Capitalizes words given text string. | PROPER("Text") |
| REPLACE | Replaces substring of a text of a given length that starts at given position. | REPLACE(Text; Start_position; Length; New_text) |
| REPT | Repeats text a given number of times. | REPT("Text"; Number) |
| RIGHT | Extracts a given number of characters from the right side of a text string. | RIGHT("Text"; Number) |
| SEARCH | Returns the location of one text string inside another. (Allows the use of wildcards.) | SEARCH( "Text1"; "Text2"[; Number]) |
| SPLIT | Divides text around a specified character or string, and puts each fragment into a separate cell in the row. | SPLIT(Text, Delimiter, [Split_by_each], [Remove_empty_text]) |
| SUBSTITUTE | Returns string where occurrences of Old_text are replaced by New_text. Replaces only specific occurrence if last parameter is provided.  | SUBSTITUTE(Text; Old_text; New_text; [Occurrence]) |
| T | Returns text if given value is text, empty string otherwise. | T(Value) |
| TEXT | Converts a number into text according to a given format. | TEXT(Number; Format) |
| TRIM | Strips extra spaces from text. | TRIM("Text") |
| UNICHAR | Returns the character created by using provided code point. | UNICHAR(Number) |
| UNICODE | Returns the Unicode code point of a first character of a text. | UNICODE(Text) |
| UPPER | Returns text converted to uppercase. | UPPER(Text) |
