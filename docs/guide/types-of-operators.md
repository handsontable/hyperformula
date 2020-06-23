# Types of operators

The operators specify what type of actions are performed on arguments \(operands\) in the formula. HyperFormula supports the operators that are common in spreadsheet software. They are calculated in a [specific order](order-of-precendece.md) which can be altered by the use of parentheses.

HyperFormula supports the following operators:

* Unary operators
* Binary arithmetic operators
* Comparison operators
* Concatenation operator
* Reference operators

### Unary operators

The unary operators have only one argument \(operand\). For example, when the unary negation operation is provided with a number, it returns the negative value of that number.

| Operator | Meaning | Example | Description |
| :--- | :--- | :--- | :--- |
| - | Unary minus | -a | Returns the negative of its argument. |
| + | Unary plus | +a | Returns the positive of its argument. |
| % | Percent | a% | Calculate the percent of an argument. |

### Binary arithmetic operators

The binary arithmetic operators enable them to compute basic mathematical operations. They don't have to be wrapped with any functions. This table shows a basic behavior of the binary arithmetic operators:

| Operator | Meaning | Example | Description |
| :--- | :--- | :--- | :--- |
| + | Addition | a + b | Add the two arguments. |
| - | Subtraction | a - b | Subtract the second argument from the first argument. |
| \* | Multiplication | a \* b | Multiply the two arguments. |
| / | Division | a / b | Divide the first argument by the second argument. |
| ^ | Exponentiation | a ^ b | Raise the first argument by the power of the second argument. |

You are probably wondering where the _modulo_ operator is missing. It is supported by the function `MOD` so **instead of writing a % b,** as you would do in a regular mathematical equation, you should use a formula like this: **=MOD\(a, b\)**.

### Comparison operators

The binary relational operators, when used in a formula, return the boolean or logical values. Here are very general rules:

| Operator | Meaning | Example | Description |
| :--- | :--- | :--- | :--- |
| = | Equal to | a = b | True if a is equal to b. |
| &lt; | Less than | a &lt; b | True if a is less than b. |
| &gt; | Greater than | a &gt; b | True if a is greater than b. |
| &lt;= | Less than or equal | a &lt;= b | True if a is less than or equal to b. |
| &gt;= | Greater than or equal | a &gt;= b | True if a is greater than or equal to b. |
| &lt;&gt; | Not equal to | a &lt;&gt; b | True if a is not equal to b. |

#### Type coercion 

HyperFormula does type coercion and it can have an impact on comparing, adding, or any other operation between **values of a different type**. The table represents some operations between different types and their results.

// poniższe tabelki powinny być we vuepress zwijane/ukrywane  
// to cenne informacje dla developera, taki cheatsheet

### **Boolean to int** coercion, basic arithmetic operations

#### a\) true and null

| Operation | Result |
| :--- | :--- |
| true + null | 1 |
| true - null | 1 |
| true \* null | 0 |
| true / null | \#DIV/0! |
| true^null | 1 |
| +true \(unary plus true\) | true |
| -true \(unary minus true\) | -1 |
| true% | 0.01 |

#### b\) null and true

| Operation | Result |
| :--- | :--- |
| null + true | 1 |
| null - true | -1 |
| null \* true | 0 |
| null / true | 0 |
| null ^ true | 0 |
| +null \(unary plus null\) | null |
| -null \(unary minus null\) | 0 |
| null% | 0 |

#### c\) true and true

| Operation | Result |
| :--- | :--- |
| true + true | 2 |
| true - true | 0 |
| true \* true | 1 |
| true / true | 1 |
| true ^ true | 1 |

#### d\) false and true

| Operation | Result |
| :--- | :--- |
| false + true | 1 |
| false - true | -1 |
| false \* true | 0 |
| false / true | 0 |
| false ^ true | 0 |

#### e\) true and false

| Operation | Result |
| :--- | :--- |
| true + false | 1 |
| true - false | 1 |
| true \* false | 0 |
| true / false | \#DIV/0! |
| true ^ false | 1 |

#### f\) false and false

| Operation | Result |
| :--- | :--- |
| false + false | 0 |
| false - false | 0 |
| false \* false | 0 |
| false / false | \#DIV/0! |
| false ^ false | 1 |
| +false \(unary plus false\) | false |
| -false \(unary minus false\) | 0 |
| false% | 0 |

#### g\) null and false

| Operation | Result |
| :--- | :--- |
| null + false | 0 |
| null - false | 0 |
| null \* false | 0 |
| null / false | \#DIV/0! |
| null ^ false | 1 |

### Order operations, comparisons

#### a\) Empty string \(""\) and null

| Operation | Result |
| :--- | :--- |
| "" &gt; null | false |
| "" &lt; null | false |
| "" &gt;= null | true |
| "" &lt;= null | true |

#### b\) String \("string"\) and boolean

| Operation | Result |
| :--- | :--- |
| "string" &gt; false | false |
| "string" &lt; false | true |
| "string" &gt;= false | false |
| "string" &lt;= false | true |

#### c\) Null and false

| Operation | Result |
| :--- | :--- |
| null &gt; false | false |
| null &lt; false | false |
| null &gt;= false | true |
| null &lt;= false | true |

#### d\) Null and positive integer

| Operation | Result |
| :--- | :--- |
| null &gt; 1 | false |
| null &lt; 1 | true |
| null &gt;= 1 | false |
| null &lt;= 1 | true |

#### e\) Negative integer and null

| Operation | Result |
| :--- | :--- |
| -1 &gt; null | false |
| -1 &lt; null | true |
| -1 &gt;= null | false |
| -1 &lt;= null  | true |

#### f\) 0 and null

| Operation | Result |
| :--- | :--- |
| 0 &gt; null | false |
| 0 &lt; null | false |
| 0 &gt;= null | true |
| 0 &lt;= null | true |

#### g\) 0 and false

| Operation | Result |
| :--- | :--- |
| 0 &gt; false | false |
| 0 &lt; false | true |
| 0 &gt;= false | false |
| 0 &lt;= false | true |
| 0 = false | false |

#### h\) Positive integer and true

| Operation | Result |
| :--- | :--- |
| 1 &gt; true | false |
| 1 &lt; true | true |
| 1 &gt;= true | false |
| 1 &lt;= true | true |
| 1 = true | false |

### Comparing strings

By default, HyperFormula is case and accent insensitive. It means it will ignore upper and lower-case letters and accents during the comparison. For example, if you compare 'AsTrOnAuT' with \`aStroNaut\` they will be understood as identical, the same goes for 'Préservation' and 'Preservation'. It applies to comparison operators only. It can be configured with `accentSensitive` and `caseSensitive` options in the [configuration](configuration-options.md).

Apart from accents and case sensitivity, you can also configure `caseFirst.` This option defines if the upper case or lower case should sort first. `ignorePunctuation`  specifies whether punctuation should be ignored in string comparison. By default `caseFirst` is set to 'lower' and `ignorePunctuation` is set to `false`. For more details see the official API reference of HyperFormula.

Here is an example configuration that overwrites default settings:

```javascript
// this part of configuration shows options 
// related to strings only
const options = {
    caseSensitive: true,
    accentSensitive: true,
    caseFirst: 'upper',
    ignorePunctuation: true
};
```

### Concatenation operator

It is used to combine multiple text strings into a single value.

| Operator | Meaning | Example | Description |
| :--- | :--- | :--- | :--- |
| & | Concatenation | "a" & "b" | Concatenates two arguments \(left and right\) into one |

### Reference operators

The reference operators are used to perform calculations of combined ranges.

| Operator | Meaning | Example | Description |
| :--- | :--- | :--- | :--- |
| : \(colon\) | Range operator | A1:B1 | Makes one reference to multiple cells between the two specified references. |
| , \(comma\) | Union operator | A1:B1,A2:B2 | Return the intersection of multiple ranges. |
| \(space\) | Intersection operator | A1:B1 A2:B2 | Finds the intersection of the two ranges. |

