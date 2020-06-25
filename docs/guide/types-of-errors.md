# Types of errors

HyperFormula returns an error when a formula cannot be processed
properly. To make it easier for a user, each kind of error has its
specific error value. For instance, HyperFormula displays the
`#DIV/0!` error when a user tries to divide a number by zero or
`#NAME!` when the called function is not registered in the reference
of functions.

Depending on the reason for the problem, you will see one of the
associated errors' messages as listed in the table below. An error
can contain additional message property. Errors are localized
according to the language settings.


| Value | Type | Description |
| :--- | :--- | :--- |
| #DIV/0! | Division by zero | It occurs when a formula tries to divide by zero.  |
| #N/A | The value is not available | It indicates that the value you are looking for is not available for the formula. Most typically this error is thrown by the LOOKUP -type functions. |
| #NAME? | Invalid names | It means that HyperFormula can't recognize the name of the formula or values used in a formula. |
| #NUM! | Invalid number | This error arises when your formula contains an invalid number. |
| #REF! | Invalid references | It occurs when a formula contains an invalid reference. It is one of the most common errors users encounter when working with spreadsheets. |
| #VALUE! | Wrong type of argument | It occurs when a formula tries to improperly use different types of data. For example, you will see this error when you will try to add a text to a number. |
| #CYCLE! | Circular reference | It occurs when a formula refers to own cell, both directly and indirectly. |
| #ERROR! | An error occurred | It indicates that there is an unknown error in a formula. |
| #LIC! | Invalid license key | It occurs when the license key is invalid, expired, or missing. |