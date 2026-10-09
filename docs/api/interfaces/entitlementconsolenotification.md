# EntitlementConsoleNotification

One console notification for an entitlement key: its severity and its text. Kept as one record
so a state cannot get a text without a severity. A warning while the license still works, an
error once it has run out.

## Properties

### message 

• **message**: *function*

*Defined in [src/helpers/licenseKeyValidator.ts:63](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L63)*

#### Type declaration:

▸ (`params`: Params): *string*

**Parameters:**

Name | Type |
------ | ------ |
`params` | Params |

___

### severity 

• **severity**: *"warn" | "error"*

*Defined in [src/helpers/licenseKeyValidator.ts:62](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L62)*