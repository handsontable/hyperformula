# ResolvedCapabilities

The capabilities a resolved [LicenseEntitlement](licenseentitlement.md) grants, ready for gate B (the
interpreter) and `ensureCapability` to query through [allowsFunction](../globals.md#allowsfunction) and
[allowsFeature](../globals.md#allowsfeature).

## Properties

### features 

• **features**: *ReadonlySet‹[FeatureId](../enums/featureid.md)› | "all"*

*Defined in [src/license/CapabilityRegistry.ts:23](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/CapabilityRegistry.ts#L23)*

`'all'` short-circuits [allowsFeature](../globals.md#allowsfeature) to `true` for every [FeatureId](../enums/featureid.md).

___

### functions 

• **functions**: *ReadonlySet‹string› | "all"*

*Defined in [src/license/CapabilityRegistry.ts:21](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/CapabilityRegistry.ts#L21)*

`'all'` short-circuits [allowsFunction](../globals.md#allowsfunction) to `true` for every function id, independently
of [features](resolvedcapabilities.md#features): a key can cover every function without covering every feature, or the
other way round. A single `unrestricted: boolean` could not express that combination — it
could only grant both axes together or neither.