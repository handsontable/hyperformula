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
| Reference docs | the format and design notes kept alongside the upstream sources; the byte-level rules are also specified in the key spec's "Technical implementation" addendum (T1-T14) |

## Port, not copy — and what that means for drift

These files are **TypeScript ports of upstream's JavaScript**, not byte-identical copies, and they
cannot be copies while `allowJs` is off and `strict` is on in `tsconfig.json`. A `.ts` file and the
`.js` it was ported from never share a hash, so "compare our bytes to upstream's" is not a check
that can exist in this shape. What differs is listed under *Deliberate divergences* below; none of
it changes which keys are accepted.

What IS checked, by measurement rather than by someone remembering to look:

```bash
npm run check:vendored-parser
```

It reads `upstream.lock.json` — the pin: the commit, and a sha256 per upstream file — fetches each
file at that commit and compares. A mismatch means **upstream moved**, which is the event that
matters: it is the moment this port stops mirroring the code it is supposed to mirror. The script
also fails if a file is in the directory without being pinned, or pinned without being present.

It needs read access to the private repository, through `LICENSE_KEY_REPO_TOKEN`, `GH_TOKEN`,
`GITHUB_TOKEN` or a logged-in `gh`. Without credentials it **fails** rather than passing quietly:
an unverified pin is not a verified one, and a check that reports success when it could not look is
worse than no check.

When upstream moves: re-port the changed file and update its hash in `upstream.lock.json` in the
same commit, so the diff shows the two together.

### If byte-identity is wanted

It is reachable, and it is the remaining half of option 1: vendor upstream's `.js` verbatim, turn
`allowJs` on, and hand-write a `.d.ts` per file. The check then becomes a direct hash of our own
files, with no lock table at all. Measured as compatible with this repository's TypeScript
(4.0.8 accepts `allowJs` together with `declaration`). It is a build-configuration change, so it
is not made here without a decision.

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
rather than a copy. Beyond adding types, the semantics are identical to upstream's; the notes below are the shape of
the port, not changes to what it accepts, and a drift review should expect to see them:

1. **`detectFormat.ts` keeps its literals in a `Map`,** where upstream uses an object literal
   behind a `hasOwnProperty` guard. Same behaviour for every input (including `constructor` and
   `__proto__`); the `Map` is this repository's idiom for lookups keyed by untrusted strings.
2. **`stringToUtf8Bytes`'s parameter is named `text`, not `string`,** which is a type keyword in
   TypeScript.
3. **The normalized product entry is typed** (`EntitlementProductGrant`), which upstream's plain
   JavaScript does not do. The types state what the reader CHECKS, and the checks are upstream's:
   `capabilities` and `flags` are verified element by element, and `notice` and `grace` are verified
   as non-negative integers. Everything the reader does not verify — unknown fields are preserved on
   purpose — sits behind an `unknown`-valued index signature, so consumers must narrow before use.
4. **`isIsoDate` takes `String(value)`, as upstream does, and the type check lives outside.**
   Upstream matches `String(value)` against `YYYY-MM-DD`, so a `usage_until` that is a
   single-element array of the right string passes its shape check and the declared `string` type
   ends up wider than the value. The key spec's addendum (T7) makes the field a real calendar date,
   so the stricter reading is the specified one.

   **Upstream has since adopted it.** Commit `6862da557` on `master` (2026-09-28, DEV-3031) changed
   `parseIsoDate` to `typeof isoDate === 'string' ? … : null`, with the same reasoning. An earlier
   revision of this file said upstream had not adopted it and that no pull request proposed it;
   that was true when written and is not true now — `npm run check:vendored-parser` is what found
   it, on its first run against `master`.

   So this divergence is on its way out, and re-porting `utils.js` closes it. One thing to decide
   with the re-port rather than sleepwalk into: upstream's check rejects the WHOLE key when any
   product's date is mistyped, while `hyperformulaDateFieldIsWellTyped` deliberately only takes the
   invalid-key path for HyperFormula's own entry, on the grounds that another product's fields are
   not ours to validate. Re-porting reverses that choice.

   Rather than fork upstream's source over it, HyperFormula checks the TYPE of its own entry's date
   field in `licenseResolution.ts` (`hyperformulaDateFieldIsWellTyped`), before the payload is read
   for terms, and a non-string there takes the invalid-key path. The behaviour a customer sees is
   the same as when the check lived here; what changed is that this file no longer diverges, so a
   drift review compares it to upstream byte for byte instead of reasoning about a patch.

Upstream's `/* eslint-disable */` pragmas were dropped where HyperFormula's own ESLint config
does not need them.

## Related

- `src/helpers/licenseKeyHelper.ts` — the validator for the legacy 25-character key format,
  untouched here (upstream 4.0.0 still exports it too).
- `src/license/licenseResolution.ts` — the consumer: routes on `detectLicenseKeyFormat` and turns
  the extracted payload into an entitlement.
- `src/license/capabilities.ts` — the capability table the payload's tokens are resolved against.
