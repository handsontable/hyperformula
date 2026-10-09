# LicenseExpiry

Describes when a license entitlement stops being valid.

`date` is kept as a calendar string rather than an epoch, and is INCLUSIVE of its last valid
day:
- `kind === 'usage'`: compared against the current instant in **UTC**, not the client's LOCAL
  calendar date, because the offline check and a future online check have to return the same verdict for the same key at
  the same instant, and any rule that reads a local clock breaks that parity. The practical
  cost is that a customer far west of UTC loses the tail of their last local day.
- `kind === 'release'`: compared against the library's build date; no clock is involved, which
  is what keeps an air-gapped install with a wrong system clock working.
- `kind === 'none'`: the entitlement does not expire.

## Properties

### date 

• **date**: *string | null*

*Defined in [src/license/LicenseEntitlement.ts:36](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/LicenseEntitlement.ts#L36)*

ISO 'YYYY-MM-DD', or `null` when `kind` is `'none'`.

___

### graceDays 

• **graceDays**: *number*

*Defined in [src/license/LicenseEntitlement.ts:38](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/LicenseEntitlement.ts#L38)*

___

### kind 

• **kind**: *"usage" | "release" | "none"*

*Defined in [src/license/LicenseEntitlement.ts:34](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/LicenseEntitlement.ts#L34)*

___

### noticeDays 

• **noticeDays**: *number*

*Defined in [src/license/LicenseEntitlement.ts:37](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/LicenseEntitlement.ts#L37)*