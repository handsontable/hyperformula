# Arrays

HyperFormula lets you perform operations on arrays.

You can:
- Operate on arrays just like on non-array values
- Pass arrays (instead of values) to functions
- Constrain the output array's size
- Filter an array based on boolean arrays

## About arrays in HyperFormula

There are two types of arrays in HyperFormula:
* **Range array**: a range of cell addresses (e.g. `A1:A10`)
* **Ad-hoc array**: an array with no ground-truth range that defines the values (e.g. `{1,3,5}`)

Non-array values are **scalars**.

By default, array arithmetic is disabled globally in HyperFormula.

To use array arithmetic, either enable it globally ([set the `useArrayArithmetic` option to `true`](../api/interfaces/configparams.html#usearrayarithmetic)), or use the ARRAYFORMULA function.

## Operating on arrays

When you perform an operation on an array, each output array value is a result of that operation on the corresponding input array value.

To enable array arithmetic for your formula, use the [`ARRAYFORMULA`](built-in-functions.md#array-manipulation) function:

| Syntax | Example |
| :--- | :--- |
| `ARRAYFORMULA(your_formula)` | `=ARRAYFORMULA(A2:A5*B2:B5)` |

If you don't use the `ARRAYFORMULA` function, HyperFormula treats [ad-hoc arrays](#about-arrays-in-hyperformula) as [scalars](#about-arrays-in-hyperformula), taking only your ad-hoc array's top-left value.

To enable array arithmetic globally, set the `useArrayArithmetic` option to `true` in HyperFormula [configuration](../api/interfaces/configparams.html#usearrayarithmetic).

## Passing arrays to functions

When you pass an array as a function's argument, the function returns an array as well.

To pass an array as an argument, enable the array arithmetic with the [`ARRAYFORMULA`](built-in-functions.md#array-manipulation) function:

| Syntax | Example |
| :--- | :--- |
| `ARRAYFORMULA(YOUR_FUNCTION(your_formula))` | `=ARRAYFORMULA(ISEVEN(A2:A5*10))` |

If you don't use the `ARRAYFORMULA` function, HyperFormula treats [ad-hoc arrays](#about-arrays-in-hyperformula) as [scalars](#about-arrays-in-hyperformula), taking only your ad-hoc array's top-left value.

To enable array arithmetic globally, set the `useArrayArithmetic` option to `true` in HyperFormula [configuration](../api/interfaces/configparams.html#usearrayarithmetic).

## Constraining the output array's size

To constrain the size of the output array, use the `ARRAY_CONSTRAIN` function:

| Syntax | Example |
| :--- | :--- |
| `ARRAY_CONSTRAIN(your_array,your_height,your_width)` | `=ARRAY_CONSTRAIN(A2:E5,2,2)` |

If your specified output array size is smaller than the input array size, only the corresponding top-left cells of the input array are taken into account.

If your specified output array size is larger or equal to the input array size, no change is made.

## Filtering an array

To filter an array based on boolean arrays, use the `FILTER` function:

| Syntax | Example |
| :--- | :--- |
| `FILTER(your_array, BoolArray1[; BoolArray2[; ...]]` | `=FILTER(ARRAYFORMULA(A2:A5*10), {1,0,0,1})` |

## Array rules

When passing arrays to functions that expect scalars, the following rules apply:

* Array dimensions need to be consistent (e.g. every row needs to be of the same length).
* If an input array value is missing (due to a difference in dimensions), the corresponding output array value is `#N/A`.
* If a cell evaluates to an array, the array values are spilled into neighboring cells.<br>This behavior doesn't apply to ranges, which return a `#VALUE!` error in this case.
* If one or both of input array dimensions is `1` (`1`x`1` or `1`x`n` or `n`x`1`), the array is repeated, to match the output array dimensions.