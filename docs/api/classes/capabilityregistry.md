# CapabilityRegistry

Expands a [LicenseEntitlement](../interfaces/licenseentitlement.md)'s capability tokens against a table of
[CapabilityGrant](../interfaces/capabilitygrant.md)s into the concrete functions and features they grant, and answers
which token, if any, covers a given function id.

## Constructors

### constructor 

\+ **new CapabilityRegistry**(`table?`: ReadonlyMap‹string, [CapabilityGrant](../interfaces/capabilitygrant.md)›): *[CapabilityRegistry](capabilityregistry.md)*

*Defined in [src/license/CapabilityRegistry.ts:33](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/CapabilityRegistry.ts#L33)*

**Parameters:**

Name | Type |
------ | ------ |
`table?` | ReadonlyMap‹string, [CapabilityGrant](../interfaces/capabilitygrant.md)› |

**Returns:** *[CapabilityRegistry](capabilityregistry.md)*

## Methods

### capabilityOf 

▸ **capabilityOf**(`functionId`: string): *string | undefined*

*Defined in [src/license/CapabilityRegistry.ts:120](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/CapabilityRegistry.ts#L120)*

Returns the capability token a function id is covered by, or `undefined` if this registry's
table does not cover it. The completeness invariant in the paired `hyperformula-tests` suite
(`unit/license/capability-registry.spec.ts`) guarantees every built-in registered in the
static function registry is covered by the table or the protected list —
so `undefined` for a function known to the current instance's function registry means it is
a custom, instance-registered function rather than an unlisted built-in.

**Parameters:**

Name | Type |
------ | ------ |
`functionId` | string |

**Returns:** *string | undefined*

___

### resolve 

▸ **resolve**(`entitlement`: [LicenseEntitlement](../interfaces/licenseentitlement.md)): *[ResolvedCapabilities](../interfaces/resolvedcapabilities.md)*

*Defined in [src/license/CapabilityRegistry.ts:82](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/CapabilityRegistry.ts#L82)*

Expands an entitlement's capability tokens into the concrete functions and features they
grant. An `unrestricted` entitlement short-circuits to `'all'` on BOTH axes without
consulting the table at all. Tokens are matched case-insensitively (the table is keyed by
the normalized spelling — see [normalizeCapabilityToken](../globals.md#normalizecapabilitytoken)). Every grant stands on its
own — a token never refers to another — so this is a flat pass over the entitlement's own
tokens; an unrecognized token is skipped without an error, and a repeated one adds nothing.

Setting `'all'` on both axes here, in the same object literal, is deliberate: this is the
only place `entitlement.unrestricted` is read, so a future edit that touches one axis and
not the other has nowhere else to be caught except the per-axis fail-open tests in
`unit/license/capability-registry.spec.ts`. The axis a change forgets fails CLOSED, not
open — silently turning a working gpl-v3/legacy install into a partial denial — which is why
both are pinned separately rather than with one combined assertion.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`entitlement` | [LicenseEntitlement](../interfaces/licenseentitlement.md) | the entitlement to resolve, e.g. one built by hand in a test or produced by the license-key payload adapter  |

**Returns:** *[ResolvedCapabilities](../interfaces/resolvedcapabilities.md)*