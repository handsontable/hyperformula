# Vendored entitlement-key reader

The `.js` files in this directory are **byte-identical copies** of code owned by another
Handsoncode repository. They are not edited here, ever: fix a bug upstream, then re-take the copy.
A local-only fix forks the two, and a forked checksum or parser rejects genuine customer keys.

The `.d.ts` beside each one is HyperFormula's, hand-written, because `allowJs` is on and the
JavaScript carries no types of its own.

| | |
|---|---|
| Repository | `handsontable/license-key` (private) |
| Directory | `src/entitlement-key` |
| Tracked branch | `master` - the released code; `develop` there is work in progress |
| Copy taken from | `03810fd3c` (2026-09-28) |

## Checking it

```bash
npm run check:vendored-parser
```

Hashes every file here and the same file on `master`, and fails on any difference. A local edit
and an upstream change look identical to it, which is the point: either means the copy is stale.
It also fails on a `.js` that `upstream.json` does not account for, and on one it names that is
missing.

It needs read access to the private repository (`LICENSE_KEY_REPO_TOKEN`, `GH_TOKEN`,
`GITHUB_TOKEN`, or a logged-in `gh`). Without credentials it **fails** rather than skipping: a
check that reports success when it could not look is worse than no check.

When upstream moves, re-take the changed file and update `upstream.json` in the same commit.

## What the last re-take changed

`6862da557` (2026-09-28) made `parseIsoDate` test `typeof isoDate === 'string'` before matching the
pattern, so a `usage_until` of `['2099-12-31']` - which stringifies to a valid date - is now
rejected by the reader instead of accepted.

HyperFormula used to carry that check itself, next door in `licenseResolution.ts`, because upstream
did not have it. That local check is gone: it became dead code the moment this copy was taken.

One behaviour changed with it, deliberately. The local check looked at HyperFormula's own product
entry only, on the grounds that another product's fields were not ours to reject. Upstream's check
is in the parser, so it applies to every entry: a mistyped date in a DataGrid entry now invalidates
the whole key, our grant included. That is upstream's rule and the key specification's (T7), and it
is pinned in `entitlement-key-resolution.spec.ts`.

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

`utils.js` is taken whole, so its two generation-side helpers `bytesToBase64` and
`stringToBase64Url` come with it. Nothing in HyperFormula calls them; a verbatim copy does not get
to pick which exports it keeps.

## Related

- `src/helpers/licenseKeyHelper.ts` — the validator for the legacy 25-character key format,
  untouched here (upstream 4.0.0 still exports it too).
- `src/license/licenseResolution.ts` — the consumer: routes on `detectLicenseKeyFormat` and turns
  the extracted payload into an entitlement.
- `src/license/capabilities.ts` — the capability table the payload's tokens are resolved against.
