# Vendored entitlement-key reader

This directory is a copy of `handsontable/license-key`'s **`vendor/entitlement-key-reader/`**,
the TypeScript reader that repository publishes for products to copy. It is taken whole, from a
tagged release, and edited here in one declared line only (below), which the HyperFormula owner
accepted on 2026-10-01 ("Let's keep this solution for now", #1728). Anything else is fixed upstream
and re-taken: a local fix makes two products disagree about the same key.

| | |
|---|---|
| Repository | `handsontable/license-key` (private) |
| Directory | `vendor/entitlement-key-reader` |
| Tag | `5.1.1` (`124660718`, 2026-10-06) |
| Pin | `upstream.json` |

## One declared divergence

`extractKeyData.ts`, one line: `Object.keys(current)` → `Object.keys(current as object)`. HyperFormula
compiles with TypeScript 4.0.8, which does not narrow `unknown` through `!== null && typeof ===
'object'`; upstream compiles under 5.9, and TypeScript 4.5 is where the line starts to compile
uncast. The cast changes no behavior. It is recorded in `upstream.json` with its reason, and the
check below applies it before comparing. A tag is immutable, so the check does not see upstream fix
the line on a branch; it sees the next tag - a newer tag fails the check - and at the re-take the swap
stops matching once upstream has changed the line, so the fix cannot be missed. A tag that leaves the
line alone carries the shim forward; the `until` field is a note for the person re-taking, not a check.

## Checking it

```bash
npm run check:license-key-parser-drift
```

Checks that the pinned tag still resolves to the pinned commit, lists the upstream directory at that
commit and compares every file git tracks here with it byte for byte. Fails on a moved tag or an edited pin, on any difference,
on a file here that upstream does not have (a shadowing `.ts` would win module
resolution silently), on an upstream file missing here, and on a **newer upstream tag** than the
pin. Without credentials to the private repository it fails rather than skips.

## What HyperFormula uses from it

`readEntitlementLicense`, the single entry point upstream prescribes, plus `detectLicenseKeyFormat`,
`toIsoBuildDate` and the types - from
`src/license/licenseResolution.ts` and `src/helpers/licenseKeyValidator.ts`, which sit outside the
copy, as upstream's guide prescribes. The reader verifies the key (the checksum and, from format version 2, the prose
digest), picks HyperFormula's entry, places it in its lifecycle window and reads its flags.
HyperFormula keeps what the guide leaves to the product: the meaning of the capability tokens
(`src/license/capabilities.ts`) and the console messages. The test suite mints keys with the test-only exports `canonicalizeProse`,
`computeProseDigest`, `computePayloadChecksum` and `stringToBase64Url`, as upstream's README shows.

Upstream's `README.md` in this directory is the integration guide; `AGENTS.md` is theirs too.

## Lint and types

The directory is excluded from ESLint (upstream style; the same treatment as
`src/interpreter/plugin/3rdparty`) and type-checked with the rest of `src`. Published typings are
emitted from these sources by `tsc`, as for any other `.ts` here.

## Related

- `src/license/licenseResolution.ts` - the consumer: routes on `detectLicenseKeyFormat`, reads the
  key with `readEntitlementLicense` and turns the result into an entitlement.
- `src/license/capabilities.ts` - the capability table the payload's tokens are resolved against.
