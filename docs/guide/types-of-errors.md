---
tags:
  - "#REF!"
  - "#VALUE!"
  - "#DIV/0!"
  - "#N/A"
  - "#NAME?"
  - "#NUM!"
  - "#CYCLE!"
  - "#ERROR!"
  - "#LIC!"
  - "#SPILL!"
---

# Types of errors

HyperFormula returns an error when a formula cannot be processed
properly. To make it easier for a user, each kind of error has its
specific error value. For instance, HyperFormula displays the
`#DIV/0!` error when a user tries to divide a number by zero, or
`#NAME!` when the called function is not registered in the reference
of functions.

Depending on the reason for the problem, you will see the error's
associated message as listed in the table below. An error
can contain an additional message property. Errors are localized
according to the language settings.


| Value | Type | Description |
| :--- | :--- | :--- |
| #DIV/0! | Division by zero | It occurs when a formula tries to divide by zero.  |
| #N/A | The value is not available | It indicates that the value you are looking for is not available for the formula. Most typically this error is thrown by the LOOKUP -type functions. |
| #NAME? | Invalid name | It means that HyperFormula can't recognize the name of the formula or values used in a formula. |
| #NUM! | Invalid number | This error arises when your formula contains an invalid number. |
| #REF! | Invalid reference | It occurs when a formula contains an invalid reference. It is one of the most common errors users encounter when working with spreadsheets. |
| #VALUE! | Wrong type of argument | It occurs when a formula tries to improperly use different types of data. For example, you will see this error when you will try to add a string to a number. |
| #CYCLE! | Circular reference | It occurs when a formula refers to its own cell, both directly and indirectly. |
| #ERROR! | An error occurred | It indicates that there is an unknown error in a formula. |
| #LIC! | Invalid license key | It occurs when the license key is invalid, expired, or missing. |
| #SPILL! | No space for array result | It occurs when an array formula's result would overwrite one or more non-empty cells, so it has nowhere to spill into. |

## Error messages and explanations

An error's `message` property states the specific cause within its type — for
example, distinguishing *why* a formula returned `#NUM!` rather than only that it
did. HyperFormula does not turn that message into a longer, plain-language
explanation, and does not call out to a language model to generate one. An
application built on top of HyperFormula that wants to rephrase an error for its
end users — in natural language, or translated beyond the languages HyperFormula
ships with — should do so at the application layer, using the `type` and
`message` HyperFormula already provides as its input.

## Finding out where an error came from

Besides `type` and `message`, a `DetailedCellError` tells you what produced the
error and, when it was a function rejecting one of its own arguments, which
argument. `originFunction` names a function or an operator helper when one of them
rejected a value, and otherwise names what built the error: `reference` for a
reference that cannot be resolved, `removed reference` for one destroyed by
removing rows or columns, `parser` for a formula that could not be parsed, `user
input` for an error value typed into a cell, or `literal` for one written into a
formula. `argumentIndex` is zero-based.

```javascript
const hf = HyperFormula.buildFromArray([['=SUM(SQRT(-1))'], ['=DATE(2000, "x", 1)'], ['=SUM(A99999999999:A99999999999)']]);

hf.getCellValue({ sheet: 0, col: 0, row: 0 }).originFunction; // 'SQRT', not 'SUM'
hf.getCellValue({ sheet: 0, col: 0, row: 1 }).argumentIndex;  // 1, the second argument
hf.getCellValue({ sheet: 0, col: 0, row: 2 }).originFunction; // 'reference'
```

The first occurrence wins, so a function that only read an error never replaces
the identity already on it. `address` points at the cell where the error arose,
which is not always the cell you read it from.