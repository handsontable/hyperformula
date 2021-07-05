# Arrays

Use arrays to perform an operation (or call a function) on multiple cells at a time.

## About arrays

In HyperFormula, an array can be:
* A range of cell addresses (e.g. `A1:A10`)
* An **ad-hoc array**: an input array with no ground-truth range that defines the values (e.g. `{1,3,5}`)
* A result of an arithmetic operation (e.g. `5*A1:B5`)
* A result of a function (e.g. `=ARRAY_CONSTRAIN(A2:E5,2,2)`)

An array is inherently a two-dimensional object.

`1`x`1` arrays are treated as single, zero-dimensional values (**scalars**).

## Enabling the array arithmetic mode

To use arrays in HyperFormula, you need to enable the **array arithmetic mode**.

You can enable the array arithmetic mode:
* [Locally](#enabling-the-array-arithmetic-mode-locally) (for an individual function or operation)
* [Globally](#enabling-the-array-arithmetic-mode-globally) (for your HyperFormula instance)

### Enabling the array arithmetic mode locally

To enable the array arithmetic mode once, within a particular function or formula, use the `ARRAYFORMULA` function:

| Syntax | Example |
| :--- | :--- |
| `ARRAYFORMULA(your_formula)` | `=ARRAYFORMULA(A2:A5*B2:B5)` |
| `ARRAYFORMULA(YOUR_FUNCTION(your_formula))` | `=ARRAYFORMULA(ISEVEN(A2:A5*10))` |

### Enabling the array arithmetic mode globally

To enable the array arithmetic mode by default, everywhere in your HyperFormula instance:

* In your HyperFormula [configuration](../api/interfaces/configparams.html#usearrayarithmetic), set the `useArrayArithmetic` option to `true`.

## Array features

HyperFormula lets you:
* [Operate on arrays](#operating-on-arrays) just like on [scalars](#about-arrays)
* [Pass arrays to functions](#passing-arrays-to-scalar-functions) that accept [scalars](#about-arrays)
* [Broadcast](#broadcasting) a smaller input array across a larger output area
* [Filter an array](#filtering-an-array) based on boolean arrays
* [Constrain](#constraining-an-array-s-size) an array's size

### Operating on arrays

You can operate on arrays just like on single values.

With the [array arithmetic mode](#enabling-the-array-arithmetic-mode) enabled, each output array value is the result of your operation on the corresponding input array value.

| Array arithmetic mode | Example |
| :--- | :--- |
| [Enabled locally](#enabling-the-array-arithmetic-mode-locally) | `=ARRAYFORMULA(A2:A5*B2:B5)` |
| [Enabled globally](#enabling-the-array-arithmetic-mode-globally) | `=A2:A5*B2:B5` |

### Passing arrays to scalar functions
You can pass arrays to functions that would normally accept [scalars](#about-arrays) (thanks to HyperFormula's **vectorization** feature).

When you pass an array to a function that accepts [scalars](#about-arrays), that function produces an array on the output as well (with the [array arithmetic mode](#enabling-the-array-arithmetic-mode) enabled).

| Array arithmetic mode | Example |
| :--- | :--- |
| [Enabled locally](#enabling-the-array-arithmetic-mode-locally) | `=ARRAYFORMULA(ISEVEN(A2:A5*10))` |
| [Enabled globally](#enabling-the-array-arithmetic-mode-globally) | `=ISEVEN(A2:A5*10)` |

### Broadcasting
You can broadcast a smaller input array across a larger output area (thanks to HyperFormula's **broadcasting** feature).

With the [array arithmetic mode](#enabling-the-array-arithmetic-mode) enabled, the smaller array is automatically “broadcast” across the larger array so that both arrays have the same dimensions.

### Filtering an array

You can filter an array based on boolean arrays, using the `FILTER` function (with the [array arithmetic mode](#enabling-the-array-arithmetic-mode) enabled):

| Syntax | Example |
| :--- | :--- |
| `FILTER(your_array, BoolArray1[; BoolArray2[; ...]]` | `=ARRAYFORMULA(FILTER(A2:A5*10), {1,0,0,1})` |

| Array arithmetic mode | Example |
| :--- | :--- |
| [Enabled locally](#enabling-the-array-arithmetic-mode-locally) | `=ARRAYFORMULA(FILTER(A2:A5*10), {1,0,0,1})` |
| [Enabled globally](#enabling-the-array-arithmetic-mode-globally) | `=FILTER(A2:A5*10, {1,0,0,1})` |

### Constraining an array's size

You can constrain the size of the output array, using the `ARRAY_CONSTRAIN` function (with the [array arithmetic mode](#enabling-the-array-arithmetic-mode) enabled):

| Syntax | Example |
| :--- | :--- |
| `ARRAY_CONSTRAIN(your_array,height,width)` | `=ARRAYFORMULA(ARRAY_CONSTRAIN(A2:E5,2,2))` |

If your specified output array size is smaller than the input array size, only the corresponding top-left cells of the input array are taken into account.

If your specified output array size is larger or equal to the input array size, no change is made.

| Array arithmetic mode | Example |
| :--- | :--- |
| [Enabled locally](#enabling-the-array-arithmetic-mode-locally) | `=ARRAYFORMULA(ARRAY_CONSTRAIN(A2:E5,2,2))` |
| [Enabled globally](#enabling-the-array-arithmetic-mode-globally) | `=ARRAY_CONSTRAIN(A2:E5,2,2)` |

## Array rules

### With the array arithmetic mode enabled

When the [array arithmetic mode](#enabling-the-array-arithmetic-mode) is enabled, and you pass an array to a [scalar](#about-arrays) function, the following rules apply:
* Array dimensions need to be consistent (e.g. every row needs to be of the same length).
* If an input array value is missing (due to a difference in dimensions), the corresponding output array value is `#N/A`.
* If a cell evaluates to an array, the array values are spilled into neighboring cells (unless the neighboring cells are already filled).<br>This behavior doesn't apply to ranges, which return the `#VALUE!` error in this case.
* If one of input array dimensions is `1` (`1`x`n` or `n`x`1`), the array is repeated, to match the output array dimensions.

### With the array arithmetic mode disabled

When the [array arithmetic mode](#enabling-the-array-arithmetic-mode) is disabled, and you pass an array to a [scalar](#about-arrays) function, the array is reduced to 1 element (usually the array's top-left value).

When the [array arithmetic mode](#enabling-the-array-arithmetic-mode) is disabled, and you operate on a range of width `1`, the behavior depends on your formula's location:

| Your formula's location | Behavior |
| :--- | :--- |
| In the same row as as one of the range's elements | Only that particular element is taken. |
| Any other cell | `#VALUE!` error |

When the [array arithmetic mode](#enabling-the-array-arithmetic-mode) is disabled, and you operate on a range of height `1`, the behavior depends on your formula's location:

| Your formula's location | Behavior |
| :--- | :--- |
| In the same column as as one of the range's elements | Only that particular element is taken. |
| Any other cell | `#VALUE!` error |