# Vendored typed-key reader — provenance and drift control

The files in this directory are a **TypeScript port of code owned by another Handsoncode
repository**, not original HyperFormula code. Treat them as a mirror: fix bugs upstream first,
then re-port. A local-only fix here silently forks the two copies, and a forked checksum or
parser rejects genuine customer keys.

## Upstream

| | |
|---|---|
| Repository | `handsontable/license-key` (private) |
| Branch | `develop` |
| Commit | `7553d0d1208f483c3d744e3a1d09c1f51ba48c1e` |
| Ported on | 2026-08-11 |
| Reference docs | the format and design notes kept alongside the upstream sources |

## Files

Hashes are of the **upstream** `.js` sources at the commit above, so drift is detectable without
storing a copy of them here.

| This directory | Upstream `src/typed-key/` | Upstream sha256 |
|---|---|---|
| `constants.ts` | `constants.js` | `2f987427ba3d012917c5972714b964b26f877b2e91a57790b37249928c72f5b6` |
| `defaultSchema.ts` | `default-schema.js` | `f905f1a0a6fef9b0c247a0fdb0642d5018d30fc915314ac8b10976cec8be9fc8` |
| `utils.ts` | `utils.js` | `135a8396bb22f424160fc651e899931d4be807df9b94c6dd24bb1cf6526e0541` |
| `sha512.ts` | `sha512.js` | `668dd1109160b92965a1f9a9c5fb78dfdc1e5b7e93f635a147ae8a6bb2a5d837` |
| `extractKeyData.ts` | `extract-key-data.js` | `e6f854f10c6679136d382afe0bcf4fb1d4f9709416c68247a9cdb2236b7eec23` |

### Checking for drift

The check is manual and needs read access to the private repository — HyperFormula's own CI
cannot do it, which is exactly why the hashes are written down here.

```bash
git clone git@github.com:handsontable/license-key.git
cd license-key/src/typed-key
sha256sum constants.js default-schema.js utils.js sha512.js extract-key-data.js
```

Any hash that differs from the table means upstream moved. Re-read the changed file and re-port
it, then update this table together with the code in the same commit.

## Not vendored, on purpose

| Upstream file | Why not |
|---|---|
| `generate-key.js` | Mints keys. HyperFormula only ever reads them. |
| `create-engine.js` | Binds the API to a custom schema; HyperFormula uses the default one. |
| `validate-schema.js` | Only reachable when a *custom* schema is passed — dead code here. |
| `validate-key.js` | A two-line boolean wrapper over `extractTypedKeyData`; the extractor is called directly. |

From `utils.js`, the two generation-side helpers `bytesToBase64` and `stringToBase64Url` are
also left out. Everything else in that file is ported.

`default-schema.js` is ported **whole**, including the prose wordings that only generation reads.
Two reasons: it keeps the file a faithful copy so the hash check above stays meaningful, and the
keys of `scopeWordings` / `addonWordings` are the tier and add-on vocabulary
(`freemium | crm | data_grid | excel_simulator`, `spreadsheet | import_export`) that the
capability table is keyed on — having it here lets a test assert the two agree.

## Deliberate divergences from upstream

`allowJs` is off in HyperFormula's `tsconfig.json` and `strict` is on, so these files are a port
rather than a copy. Beyond adding types, the semantics were kept identical except for the
following, which a drift review should expect to see:

1. **The custom-schema parameter is dropped.** `extractTypedKeyData(licenseKey, schema?)` becomes
   `extractTypedKeyData(licenseKey)`, always reading with `DEFAULT_TYPED_KEY_SCHEMA`. This is what
   removes the need for `validate-schema.js`.
2. **`extractTypedKeyData` also returns `licensedProductName`.** Upstream returns the derived
   `expiryTimestamp` but not which product entry it came from, and the grace period lives on that
   same entry. Returning the name avoids re-implementing the "first schema product present in the
   payload" rule in the caller, where it could drift from the rule used to derive the expiry.
3. **`extractExpiryTimestamp` became `resolveLicensedProduct`,** returning
   `{name, expiryTimestamp} | null` instead of `number | null | undefined`. Upstream needs the
   `undefined` sentinel because `null` already means "never expires"; folding the name in gives
   one unambiguous `null` for "malformed".
4. **`stringToUtf8Bytes`'s parameter is named `text`, not `string`,** which is a type keyword in
   TypeScript.
5. **Payload fields are typed `unknown`.** Field types are checked when a key is generated, which
   constrains nothing about a payload that reaches the reader, so consumers must narrow a field
   before using it rather than trusting its declared shape.

Upstream's `/* eslint-disable */` pragmas were dropped where HyperFormula's own ESLint config
does not need them.

## Related

- `src/helpers/licenseKeyHelper.ts` — the validator for the older key format, untouched here.
- `src/license/capabilities.ts` — the capability table keyed on the tier/add-on vocabulary above.
