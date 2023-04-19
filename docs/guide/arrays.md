# Array formulas

Use array formulas to perform an operation (or call a function) on multiple cells at a time.

## About arrays

In HyperFormula, an array can be:
* A range of cell addresses (e.g. `A1:A10`)
* A result of an arithmetic operation (e.g. `5*A1:B5`)
* A result of a function (e.g. `=ARRAYFORMULA(ARRAY_CONSTRAIN(A2:E5, 2, 2))`)
* An **inline array**: an ad-hoc array that doesn't refer to any range of cells (e.g. `{1, 3, 5}`)

An array is inherently a two-dimensional object.

`1`x`1` arrays are treated as single, zero-dimensional values (**scalars**).

### Inline arrays

An inline array is defined by curly braces: `{ }`. It can contain one or more rows, separated by:
- The [`arrayColumnSeparator`](../api/classes/config.md#arraycolumnseparator) (default: `,`)
- The [`arrayRowSeparator`](../api/classes/config.md#arrayrowseparator) (default: `;`)
  
Every row must be of equal length.

::: tip
**Inline arrays are not recomputed after initialization.**

If an inline array contains a cell reference, and the cell's value changes, the array is not updated.
:::

```
= {1, 2, 3} // an inline array with a single row
= {1, 2 ; 3, 4} // an inline array with two rows
= SUM({1, 2, 3}) // an inline array as an argument of a function
= {A1, A2} // when the values of A1 or A2 change, this inline array is not updated

= {1, 2 ; 3} // an invalid inline array: two rows of different lengths
```

## Array arithmetic mode

To use array formulas in HyperFormula, you need to enable the **array arithmetic mode**.

You can enable the array arithmetic mode:
* [Locally](#enabling-the-array-arithmetic-mode-locally) (for an individual function or operation)
* [Globally](#enabling-the-array-arithmetic-mode-globally) (for your HyperFormula instance)

### Enabling the array arithmetic mode locally

To enable the array arithmetic mode once, within a particular function or formula, use the `ARRAYFORMULA` function:

| Syntax                                            | Example                           |
|:--------------------------------------------------|:----------------------------------|
| `ARRAYFORMULA(your_array_formula)`                | `=ARRAYFORMULA(A2:A5*B2:B5)`      |
| `ARRAYFORMULA(YOUR_FUNCTION(your_array_formula))` | `=ARRAYFORMULA(ISEVEN(A2:A5*10))` |

### Enabling the array arithmetic mode globally

To enable the array arithmetic mode by default, everywhere in your HyperFormula instance:

* In your HyperFormula [configuration](../api/interfaces/configparams.md#usearrayarithmetic), set the `useArrayArithmetic` option to `true`.

With the array arithmetic mode enabled globally, you can operate on arrays without using the `ARRAYFORMULA` function:

```
=A2:A5*B2:B5

ISEVEN(A2:A5*10)
```

## Array features

Thanks to HyperFormula's built-in array features, you can:
* [Operate on arrays](#operating-on-arrays) just like on [scalars](#about-arrays)
* [Pass arrays to functions](#passing-arrays-to-scalar-functions-vectorization) that accept [scalars](#about-arrays)
* [Broadcast](#broadcasting) smaller input arrays across larger output areas

You can also:
* Use the `FILTER` function to [filter an array](#filtering-an-array), based on boolean arrays
* Use the `ARRAY_CONSTRAIN` function to [constrain an array's size](#constraining-an-array-s-size)

### Operating on arrays

You can operate on arrays just like on single values.

When the [array arithmetic mode](#array-arithmetic-mode) is enabled, each output array value is the result of your operation on the corresponding input array value.

```
=ARRAYFORMULA(A2:A5*B2:B5)

// calculates:
// =A2*B2
// =A3*B3
// =A4*B4
// =A5*B5
```

### Passing arrays to scalar functions (vectorization)

When the [array arithmetic mode](#array-arithmetic-mode) is enabled, HyperFormula automatically _vectorizes_ most functions.

As a consequence of that, you can pass arrays to functions that would normally accept [scalars](#about-arrays). The result would also be an array.

```
=ARRAYFORMULA(ISEVEN(A2:A5))

// calculates:
// =ISEVEN(A2)
// =ISEVEN(A3)
// =ISEVEN(A4)
// =ISEVEN(A5)
```

### Broadcasting

If an input array has a dimension of `1`, it's automatically repeated ("broadcast") on that dimension to match the size of the output.

```
=ARRAYFORMULA(ISEVEN(A2:A5*B2))

// calculates:
// =ISEVEN(A2*B2)
// =ISEVEN(A3*B2)
// =ISEVEN(A4*B2)
// =ISEVEN(A5*B2)
```

### Filtering an array

When the [array arithmetic mode](#array-arithmetic-mode) is enabled, you can filter an array, based on boolean arrays, using the `FILTER` function:

| Syntax                                               | Example                                         |
|:-----------------------------------------------------|:------------------------------------------------|
| `FILTER(your_array, BoolArray1[, BoolArray2[, ...]]` | `=ARRAYFORMULA(FILTER(A2:A5*10), {1, 0, 0, 1})` |

### Constraining an array's size

When the [array arithmetic mode](#array-arithmetic-mode) is enabled, you can constrain the size of the output array, using the `ARRAY_CONSTRAIN` function:

| Syntax                                     | Example                                       |
|:-------------------------------------------|:----------------------------------------------|
| `ARRAY_CONSTRAIN(your_array,height,width)` | `=ARRAYFORMULA(ARRAY_CONSTRAIN(A2:E5, 2, 2))` |

If your specified output array size is smaller than the input array size, only the corresponding top-left cells of the input array are taken into account.

If your specified output array size is larger or equal to the input array size, no change is made.

## Array rules

### With the array arithmetic mode enabled

When the [array arithmetic mode](#array-arithmetic-mode) is enabled, and you pass an array to a [scalar](#about-arrays) function, the following rules apply:
* Array dimensions need to be consistent (e.g. every row needs to be of the same length).
* If an input array value is missing (due to a difference in dimensions), the corresponding output array value is `#N/A`.
* If a cell evaluates to an array, the array values are spilled into neighboring cells (unless the neighboring cells are already filled).<br>This behavior doesn't apply to ranges, which return the `#VALUE!` error in this case.
* If one of input array dimensions is `1` (`1`x`n` or `n`x`1`), the array is repeated, to match the output array dimensions.

### With the array arithmetic mode disabled

When the [array arithmetic mode](#array-arithmetic-mode) is disabled, and you pass an array to a [scalar](#about-arrays) function, the array is reduced to 1 element (usually the array's top-left value).

When the [array arithmetic mode](#array-arithmetic-mode) is disabled, and you operate on a range of width/height equal to `1`, the behavior depends on your array formula's location:

| Your array formula's location                     | Behavior                               |
|:--------------------------------------------------|:---------------------------------------|
| In the same row as as one of the range's elements | Only that particular element is taken. |
| Any other cell                                    | `#VALUE!` error                        |
