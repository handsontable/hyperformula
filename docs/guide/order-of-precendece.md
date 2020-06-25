# Order of precedence

HyperFormula supports multiple [operators](types-of-operators.md) that
can be used to perform mathematical operations in a formula. These
operators are calculated in a specific order. If the formula contains
the operators of equal precedence, like addition and subtraction, then
they are evaluated from left to right.

## Table of precedence

In the table below you can find the order in which HyperFormula
performs operations (from highest to lowest priority).

<table>
  <thead>
    <tr>
      <th style="text-align:center">Precedence</th>
      <th style="text-align:left">Operator</th>
      <th style="text-align:left">Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center">1</td>
      <td style="text-align:left">
        <p>: (colon)</p>
        <p>, (comma)</p>
        <p>(space)</p>
      </td>
      <td style="text-align:left">
        <p>Reference operators: range (colon), union (comma), intersection (space).</p>
        <p></p>
        <p>Currently supported by HyperFormula only at the grammar level of a function.</p>
      </td>
    </tr>
    <tr>
      <td style="text-align:center">2</td>
      <td style="text-align:left">&#x2013;</td>
      <td style="text-align:left">Negation</td>
    </tr>
    <tr>
      <td style="text-align:center">3</td>
      <td style="text-align:left">%</td>
      <td style="text-align:left">Percent</td>
    </tr>
    <tr>
      <td style="text-align:center">4</td>
      <td style="text-align:left">^</td>
      <td style="text-align:left">Exponentiation</td>
    </tr>
    <tr>
      <td style="text-align:center">5</td>
      <td style="text-align:left">* and /</td>
      <td style="text-align:left">Multiplication and division</td>
    </tr>
    <tr>
      <td style="text-align:center">6</td>
      <td style="text-align:left">+ and &#x2013;</td>
      <td style="text-align:left">Addition and subtraction</td>
    </tr>
    <tr>
      <td style="text-align:center">7</td>
      <td style="text-align:left">&amp; (ampersand)</td>
      <td style="text-align:left">Concatenation of two or more text strings</td>
    </tr>
    <tr>
      <td style="text-align:center">8</td>
      <td style="text-align:left">
        <p>&lt; (less than)</p>
        <p>= (equal to) &gt; (greater than)</p>
        <p>&lt;= (less than or equal to)</p>
        <p>&gt;= (greater than or equal to)</p>
        <p>&lt;&gt; (not equal to)</p>
      </td>
      <td style="text-align:left">Comparison</td>
    </tr>
  </tbody>
</table>

## Using parentheses

HyperFormula calculates the formulas in parentheses first so by using
them you can override the default order of evaluation. For instance,
consider this formula: =7*8+2. After the equal sign, there are
operands (7, 8, 2) that are separated by operators (* and +).
Following the order of calculations, HyperFormula computes 7*8 first
and then adds 2. The correct answer to this equation is 58.

By placing (8+2) in parenthesis will change the result as
HyperFormula will first calculate 8 + 2 = 10, and only then multiply
it by 7. Now the result is 70, not 58 as in the first example.