# CapabilityGrant

Describes what a capability token grants: a set of function ids and a set of [FeatureId](../enums/featureid.md)
values. A grant never refers to another token — every one stands alone, so
`CapabilityRegistry.resolve` reads the table in a single flat pass.

## Properties

### features 

• **features**: *[FeatureId](../enums/featureid.md)[]*

*Defined in [src/license/capabilities.ts:28](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/capabilities.ts#L28)*

___

### functions 

• **functions**: *string[]*

*Defined in [src/license/capabilities.ts:27](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/capabilities.ts#L27)*