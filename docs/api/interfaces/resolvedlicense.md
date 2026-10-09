# ResolvedLicense

Both halves of the license decision, resolved from one reading of the key.

They are deliberately produced together: the two gates ask different questions of the same
string, and parsing it twice would let them disagree about what it says.

## Properties

### blocksEvaluation 

• **blocksEvaluation**: *boolean*

*Defined in [src/license/licenseResolution.ts:76](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L76)*

Gate A — `true` when function calls must return `#LIC!`. Usually `validityState !== VALID`;
the exception is an entitlement key whose [LIFECYCLE_VERDICTS](../globals.md#const-lifecycle_verdicts) entry reports `EXPIRED`
but keeps evaluating.

___

### entitlement 

• **entitlement**: *[LicenseEntitlement](licenseentitlement.md)*

*Defined in [src/license/licenseResolution.ts:78](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L78)*

Gate B — which functions and API features the key grants.

___

### validityState 

• **validityState**: *[LicenseKeyValidityState](../enums/licensekeyvaliditystate.md)*

*Defined in [src/license/licenseResolution.ts:70](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/licenseResolution.ts#L70)*

The key's state, as the console messages and the `#LIC!` and E3 error messages report it.