# Vendored entitlement-key reader

This directory is a copy of `handsontable/license-key`'s **`vendor/entitlement-key-reader/`**,
the TypeScript reader that repository publishes for products to copy. It is taken whole, from a
tagged release, and not edited here: fix upstream, then re-take. A local fix makes two products
disagree about the same key.

| | |
|---|---|
| Repository | `handsontable/license-key` (private) |
| Directory | `vendor/entitlement-key-reader` |
| Tag | `4.0.1` (`03810fd3c`, 2026-09-28) |
| Pin | `upstream.json` |

## One declared divergence

`extractKeyData.ts`, one line: `Object.keys(current)` → `Object.keys(current as object)`. HyperFormula
compiles with TypeScript 4.0.8, which does not narrow `unknown` through `!== null && typeof ===
'object'`; upstream compiles under 5.9. The cast changes no behaviour. It is recorded in
`upstream.json` with its reason, and the check below applies it before comparing - so the day
upstream changes that line, the entry stops matching, the check fails, and the shim comes out.

## Checking it

```bash
npm run check:vendored-parser
```

Lists the upstream directory at the pinned tag and compares every file byte for byte. Fails on any
difference, on a file here that upstream does not have (a shadowing `.ts` would win module
resolution silently), on an upstream file missing here, and on a **newer upstream tag** than the
pin. Without credentials to the private repository it fails rather than skips.

## What HyperFormula uses from it

`extractEntitlementKeyData`, `detectLicenseKeyFormat`, `parseIsoDateToTimestamp`, `CHECKSUM_LENGTH`,
and the types - from `src/license/licenseResolution.ts` and `src/helpers/licenseKeyValidator.ts`,
which sit beside the copy, as upstream's guide prescribes. The reader also offers
`readEntitlementLicense` / `classifyEntitlement` / `getLicenseGrants` (window evaluation and grant
picking); HyperFormula evaluates windows in `licenseResolution.ts` and does not use those yet.
Consolidating onto them is a separate decision.

Upstream's `README.md` in this directory is the integration guide; `AGENTS.md` is theirs too.

## Lint and types

The directory is excluded from ESLint (upstream style; the same treatment as
`src/interpreter/plugin/3rdparty`) and type-checked with the rest of `src`. Published typings are
emitted from these sources by `tsc`, as for any other `.ts` here.

## Related

- `src/license/licenseResolution.ts` - the consumer: routes on `detectLicenseKeyFormat` and turns
  the extracted payload into an entitlement.
- `src/license/capabilities.ts` - the capability table the payload's tokens are resolved against.
