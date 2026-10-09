# EntitlementMessageParams

What an entitlement-key lifecycle message is built from: the date exactly as the key carries it
(never rebuilt from a timestamp) and the whole UTC days left until it.

## Properties

### daysRemaining 

• **daysRemaining**: *number | null*

*Defined in [src/helpers/licenseKeyValidator.ts:53](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L53)*

`null` for a `release_until` key, which is compared with the build date and reads no clock.

___

### licensedUntil 

• **licensedUntil**: *string*

*Defined in [src/helpers/licenseKeyValidator.ts:51](https://github.com/handsontable/hyperformula/blob/99a45ea/src/helpers/licenseKeyValidator.ts#L51)*