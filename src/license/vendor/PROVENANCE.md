# Vendored entitlement-key reader — provenance and drift control

The files in this directory are a **TypeScript port of code owned by another Handsoncode
repository**, not original HyperFormula code. Treat them as a mirror: fix bugs upstream first,
then re-port. A local-only fix here silently forks the two copies, and a forked checksum or
parser rejects genuine customer keys.

## Upstream

| | |
|---|---|
| Repository | `handsontable/license-key` (private) |
| Tag | `4.0.0` |
| Commit | `c50ef40a6` (the `4.0.0` release commit; on `develop` as `1acddafa8`) |
| Ported on | 2026-08-20 |
| Reference docs | the format and design notes kept alongside the upstream sources; the byte-level rules are also specified in the key spec's "Technical implementation" addendum (T1–T14) |

This replaces the earlier port of `src/typed-key/` at `7553d0d1` (2026-08-11). Upstream 4.0.0
(DEV-2512) **deleted** that directory and replaced the tagged key format with the entitlement key
format; the tagged format never reached customers, so the old reader was removed here rather than
kept alongside.

## Files

Hashes are of the **upstream** `.js` sources at the tag above, so drift is detectable without
storing a copy of them here.

| This directory | Upstream `src/entitlement-key/` | Upstream sha256 |
|---|---|---|
| `constants.ts` | `constants.js` | `6e2ad68d1a316abdec3f89bf04260a2cc4098f76525427d919f22cb25fb077d6` |
| `detectFormat.ts` | `detect-format.js` | `7dc037fd70e7c64078a0fe29b42cb33ecf25e8f4d8963ae9bfb16b69479d267f` |
| `extractKeyData.ts` | `extract-key-data.js` | `afd0858768879764ea016d2bc4fca692a0cd12214c1dfda6932d7ed9e4f32e45` |
| `utils.ts` | `utils.js` | `135a8396bb22f424160fc651e899931d4be807df9b94c6dd24bb1cf6526e0541` |
| `sha512.ts` | `sha512.js` | `668dd1109160b92965a1f9a9c5fb78dfdc1e5b7e93f635a147ae8a6bb2a5d837` |

`utils.js` and `sha512.js` are byte-identical between `src/typed-key/` at the old pin and
`src/entitlement-key/` at `4.0.0` (same hashes as the previous revision of this table), so their
ports carried over unchanged apart from this file's path references.

### Checking for drift

The check is manual and needs read access to the private repository — HyperFormula's own CI
cannot do it, which is exactly why the hashes are written down here.

```bash
git clone git@github.com:handsontable/license-key.git
cd license-key/src/entitlement-key
sha256sum constants.js detect-format.js extract-key-data.js utils.js sha512.js
```

Any hash that differs from the table means upstream moved. Re-read the changed file and re-port
it, then update this table together with the code in the same commit.

## Not vendored, on purpose

The entitlement reader is deliberately schema-free upstream (unknown products, tokens and flags
are tolerated, so nothing about *reading* a key depends on the vocabulary), which keeps the
vendored surface small: everything schema- and generation-side stays out.

| Upstream file | Why not |
|---|---|
| `generate-key.js`, `build-payload.js`, `build-prose.js` | Mint keys. HyperFormula only ever reads them. |
| `default-schema.js` | The generator's vocabulary (packages, add-ons, wordings, templates). The reader needs no schema; the only name this library reads is its own product entry, kept as `HYPERFORMULA_PRODUCT_NAME` in `src/license/licenseResolution.ts`. |
| `create-engine.js`, `resolve-schema.js`, `validate-schema.js`, `validate-record.js` | Bind and verify a caller's schema/record at generation time — generator-side. |
| `validate-key.js` | A two-line boolean wrapper over `extractEntitlementKeyData`; the extractor is called directly. |

From `utils.js`, the two generation-side helpers `bytesToBase64` and `stringToBase64Url` are
also left out. Everything else in that file is ported.

## Deliberate divergences from upstream

`allowJs` is off in HyperFormula's `tsconfig.json` and `strict` is on, so these files are a port
rather than a copy. Beyond adding types, the semantics were kept identical except for the
following, which a drift review should expect to see:

1. **`detectFormat.ts` keeps its literals in a `Map`,** where upstream uses an object literal
   behind a `hasOwnProperty` guard. Same behaviour for every input (including `constructor` and
   `__proto__`); the `Map` is this repository's idiom for lookups keyed by untrusted strings.
2. **`stringToUtf8Bytes`'s parameter is named `text`, not `string`,** which is a type keyword in
   TypeScript.
3. **The normalized product entry is typed** (`EntitlementProductGrant`), which upstream's plain
   JavaScript does not do. The types state what the reader CHECKS, and the checks are upstream's:
   `capabilities` and `flags` are verified element by element, `notice` and `grace` are verified as
   non-negative integers, and the date field is verified only by matching `String(value)` against
   `YYYY-MM-DD` — so a payload whose `usage_until` is a single-element array of the right string
   passes, and the declared `string` type is then wider than the value. Faithful to upstream, which
   stringifies the same way; noted here because the declaration alone reads stronger than the check.
   Everything the reader does not verify — unknown fields are preserved on purpose — sits behind an
   `unknown`-valued index signature, so consumers must narrow before use.

Upstream's `/* eslint-disable */` pragmas were dropped where HyperFormula's own ESLint config
does not need them.

## Related

- `src/helpers/licenseKeyHelper.ts` — the validator for the legacy 25-character key format,
  untouched here (upstream 4.0.0 still exports it too).
- `src/license/licenseResolution.ts` — the consumer: routes on `detectLicenseKeyFormat` and turns
  the extracted payload into an entitlement.
- `src/license/capabilities.ts` — the capability table the payload's tokens are resolved against.
