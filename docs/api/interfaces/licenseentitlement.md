# LicenseEntitlement

The resolved set of things a license grants, independent of how the underlying license key
was parsed.

[CapabilityRegistry](../classes/capabilityregistry.md) turns it into a `ResolvedCapabilities` set, gate B in the
interpreter reads that set, and `ensureCapability` reads it for the public API. `resolveLicense` builds it from the
configured key.

## Properties

### capabilities 

• **capabilities**: *ReadonlySet‹string›*

*Defined in [src/license/LicenseEntitlement.ts:61](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/LicenseEntitlement.ts#L61)*

The capability tokens the key carries, spelled as the key spells them, recognized or not. Only
the ones this library version recognizes grant anything.

___

### expiry 

• **expiry**: *[LicenseExpiry](licenseexpiry.md)*

*Defined in [src/license/LicenseEntitlement.ts:62](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/LicenseEntitlement.ts#L62)*

___

### isTrial 

• **isTrial**: *boolean*

*Defined in [src/license/LicenseEntitlement.ts:73](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/LicenseEntitlement.ts#L73)*

___

### silent 

• **silent**: *boolean*

*Defined in [src/license/LicenseEntitlement.ts:72](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/LicenseEntitlement.ts#L72)*

When `true`, resolving this entitlement must not print a console message of any kind.

Set from the key's own `no-console-warns` flag ONLY, as the vendored reader reads it (its
`channels.console`). An unrecognized token does NOT
set it: an unknown token makes the *grant* silent (it grants nothing, and nothing reports it),
which is a different thing from muting the key's console output.
Coupling them would suppress expiry notices as a side effect of a vocabulary mismatch.

___

### unrestricted 

• **unrestricted**: *boolean*

*Defined in [src/license/LicenseEntitlement.ts:56](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/LicenseEntitlement.ts#L56)*

`true` for every key that restricts nothing: classic keys, `gpl-v3`, and any key that blocks
evaluation (a missing or invalid key, an expired classic key, or a trial past its grace
period). An entitlement key that has expired but keeps evaluating is not one of them: it keeps
its own grants.