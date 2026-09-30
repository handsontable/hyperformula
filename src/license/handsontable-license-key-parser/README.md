# Entitlement key reader

The part of [`handsontable/license-key`](https://github.com/handsontable/license-key) that a product copies into its own source tree to read **entitlement license keys**. It verifies a key, picks the entry for your product, tells you which lifecycle window the license is in, which warning channels the key keeps open, and which capabilities it unlocks.

It is plain TypeScript with **no dependencies**. It does not use `crypto`, `Buffer`, `TextEncoder`, the Web Crypto API or the DOM, so it runs in any browser (including plain `http://` intranet pages), in Node, and in a worker. It type-checks under `strict` against the ES2015 library only.

It is **general**. Nothing in it names Handsontable, HyperFormula or any other product. Your product passes in what is specific to it: its product name, its build date and the literal keys it accepts.

What it does **not** do:

- generate keys (that is the `license-key` package, used by my.handsontable.com),
- read the legacy 25-character keys (each product keeps its own legacy validator),
- print messages or render UI (the wording and the surfaces are the product's; the table in [What to do in each state](#what-to-do-in-each-state) gives the specification's text).

## Contents

- [Copy it into a product](#copy-it-into-a-product)
- [The key in 60 seconds](#the-key-in-60-seconds)
- [Integrate it in five steps](#integrate-it-in-five-steps)
- [What to do in each state](#what-to-do-in-each-state)
- [Rules you must not break](#rules-you-must-not-break)
- [What each product supplies](#what-each-product-supplies)
- [Test it in your product](#test-it-in-your-product)
- [API reference](#api-reference)
- [Files](#files)

## Copy it into a product

Copy the **whole directory**, from a tagged release of `license-key`, and do not edit the copy:

```bash
# from the product repository
LICENSE_KEY_TAG=4.1.0   # the license-key release you copy from - an example, use a real tag
git clone --depth 1 --branch "$LICENSE_KEY_TAG" git@github.com:handsontable/license-key.git /tmp/license-key
rm -rf src/utils/entitlementKeyReader
cp -R /tmp/license-key/vendor/entitlement-key-reader src/utils/entitlementKeyReader
```

The target path is yours to choose. Keep the files together: every import inside the directory is relative to it, and nothing imports from outside it.

Treat the copy as read-only:

- **Fix bugs in `license-key`, then copy again.** A local fix makes the products disagree about the same key, and a customer sees one product accept a key another rejects.
- **Add a drift check to CI.** Record the tag you copied from, and fail the build when the copy no longer matches it:

  ```bash
  git clone --depth 1 --branch "$LICENSE_KEY_TAG" git@github.com:handsontable/license-key.git /tmp/license-key
  diff -r /tmp/license-key/vendor/entitlement-key-reader src/utils/entitlementKeyReader
  ```

- **Put your own code next to the copy, not inside it.** A `license.ts` beside it that calls `readEntitlementLicense` and holds your messages is the usual shape.

A TypeScript product imports it directly. A JavaScript product needs a build step that strips types (Babel's `@babel/preset-typescript`, `esbuild`, `swc` or `tsc`) - the files use nothing beyond type annotations.

**Do not install `license-key` as a dependency instead.** The package carries the generator, which products must not ship, and a product with a GPL distribution (HyperFormula) cannot depend on a private package without breaking `npm install` for its open-source users. Copying the reader is the chosen delivery form (specification §7.1).

## The key in 60 seconds

A key is plain-English text for humans, then a block for the library:

```
This is a Handsontable license key for Acme Corp, issued on 2026-08-12. It includes 1 license:

> 1. Subscription license under Handsontable Subscription License Agreement 2.0 of 2022-05-21, for Handsontable on the Enterprise package, for internal use, valid until 2027-08-12 (UTC). Use after that date is not permitted. To renew, contact sales@handsontable.com.

[eyJwcm9kdWN0cyI6eyJoYW5k...<payload>...<128 hex characters of SHA-512>]
```

- **The prose is never read.** It is not covered by the checksum either, so a key still works after a mail client rewraps it. A user may paste the whole text or the `[...]` block alone - both read the same.
- **The block** is `[`, a base64url (URL-safe, unpadded) JSON payload, the SHA-512 hex of that encoded payload (128 lowercase characters), and `]`. The block is the **last** `[` in the string and the first `]` after it.
- **The payload** lists what is licensed, per product:

  ```json
  {
    "products": {
      "hyperformula": {
        "capabilities": ["functions_1", "functions_2", "spreadsheet"],
        "release_until": "2027-03-31",
        "notice": 0,
        "grace": 0,
        "flags": ["no-console-warns", "no-ui-warns"]
      }
    }
  }
  ```

| Field | Meaning |
| --- | --- |
| `products` | Keyed by product name. **Presence means licensed.** A key may grant several products; each has its own dates and flags. |
| `capabilities` | Opaque tokens. The key says *what is granted*; your product decides *what each token unlocks*. |
| `usage_until` | The last licensed day, inclusive, in UTC. Measured against the clock. A subscription or a trial. |
| `release_until` | Builds released on or before this day may run forever. Measured against your build date, never the clock. A perpetual license. |
| `notice` | Days of advance warning before `usage_until`. `0` means no warning. |
| `grace` | Days of soft stop after `usage_until` before the hard stop. |
| `flags` | `trial`, `no-console-warns`, `no-ui-warns`, `custom`. Present or absent - there is no `false`. |

Exactly **one** of `usage_until` / `release_until` is present. There is no contract type, tier, package name or holder in the payload - "subscription" or "perpetual" is only visible as which date is present.

## Integrate it in five steps

```ts
import {
  detectLicenseKeyFormat,
  readEntitlementLicense,
  toIsoBuildDate,
  hasCapability,
  UNRESTRICTED_GRANTS,
} from './entitlementKeyReader';
import type { LicenseGrants } from './entitlementKeyReader';

const PRODUCT = 'hyperformula';                       // 1. your product name, as it appears in the payload
const LITERAL_KEYS = ['gpl-v3', 'internal-use-in-handsontable', 'hftrial-0168e-1f2b7-47158-70b05-0842f'];
const BUILD_DATE = toIsoBuildDate(process.env.HT_RELEASE_DATE); // "DD/MM/YYYY" -> "YYYY-MM-DD"

// Returns what the key unlocks. Every path returns grants - never a report's
// result - because the feature gates read them.
export function checkLicense(rawKey: unknown): LicenseGrants {
  const key = typeof rawKey === 'string' ? rawKey.trim() : '';

  // 2. Route the key. Only "entitlement" goes to this reader.
  switch (detectLicenseKeyFormat(key, LITERAL_KEYS)) {
    case 'literal':
      handleLiteralKey(key);                          // your existing behaviour
      return UNRESTRICTED_GRANTS;
    case 'legacy':
      handleLegacyKey(key);                           // your existing legacy validator
      return UNRESTRICTED_GRANTS;
    case 'unknown':
      if (key === '') {
        reportMissingKey();
      } else {
        reportInvalidKey();
      }
      return UNRESTRICTED_GRANTS;
    case 'entitlement':
      break;
  }

  // 3. Read it for your product.
  const license = readEntitlementLicense(key, { product: PRODUCT, buildDate: BUILD_DATE });

  if (!license.licensed) {
    // The block is broken, or the key licenses other products only.
    // license.reason is 'unreadable' or 'product_missing' - both are an invalid key to the user.
    reportInvalidKey();

    return license.grants;                            // UNRESTRICTED_GRANTS - an invalid key nags, it never strips features
  }

  // 4. Act on the lifecycle state, through the channels the key leaves open.
  notify(license.lifecycle, license.channels);

  // 5. Gate features by capability token.
  return license.grants;
}

// Anywhere a feature is gated:
const grants = checkLicense(settings.licenseKey);

if (!hasCapability(grants, PRODUCT, 'spreadsheet')) {
  // not unlocked by this key
}
```

Notes on each step:

1. **The product name** is the key of `products` in the payload. Names are append-only and never renamed, so a constant is right.
2. **Literal keys** are the plain words your product accepts as a key. They are your decision, so the reader knows none unless you pass them. Check them before anything else, as the example does. Trim the key once, at the start, and pass the trimmed value everywhere - an untrimmed legacy key fails its checksum. A blank entry in the list is ignored.
3. **The build date** is the release date of the installed build as a bare `YYYY-MM-DD`. `toIsoBuildDate` converts the `DD/MM/YYYY` the Handsoncode build pipelines inject, by reordering the text - never through a `Date`. A **missing** build date (`undefined`, `null`, `''`) fails open; a date in **any other format** - the raw `DD/MM/YYYY` included - throws a `TypeError`, whatever the key, so the mistake shows in your first test instead of silently switching off every `release_until` check. `now` is optional and defaults to `Date.now()`; pass it in tests.
4. **Read the key once per start-up** and share the result between your console message and your UI. The reader caches the last key it read, so a second read is cheap, but one result is what keeps two surfaces from disagreeing.
5. **An unlicensed key unlocks everything.** When `licensed` is `false`, `grants` is `UNRESTRICTED_GRANTS` and `hasCapability` answers `true` for every token. An invalid key nags; it never takes features away. Do the same for legacy, literal, missing and unknown keys - return `UNRESTRICTED_GRANTS` to your gates, as the example does - so adding capability gating can never break an existing customer.
6. **Everything the reader returns is frozen**, and typed read-only. Copy an array (`capabilities.slice()`) before sorting or changing it; `getProductCapabilities` already returns a copy.

## What to do in each state

`license.lifecycle.state` is one of ten values. The windows are measured the same way for a trial and a subscription; the `trial` flag changes only the wording and whether the hard stop blocks.

| State | When | Console (if `channels.console`) | UI (if `channels.ui`) |
| --- | --- | --- | --- |
| `usage_valid` | before the notice window | nothing | nothing |
| `usage_notice` | the last `notice` days, up to and including `usage_until` | warning | nothing |
| `usage_soft_stop` | after `usage_until`, through `grace` days | error | nothing |
| `usage_hard_stop` | after the grace period | error - the soft-stop message persists (18.1 never blocks a paying customer) | nothing |
| `trial_valid` | as `usage_valid`, on a trial | nothing | optional trial badge |
| `trial_notice` | as `usage_notice`, on a trial | warning | optional trial badge |
| `trial_soft_stop` | as `usage_soft_stop`, on a trial | error | a banner or a modal |
| `trial_hard_stop` | as `usage_hard_stop`, on a trial | error | **block the product** - applied even when `channels.ui` is `false` |
| `release_valid` | the build is covered by `release_until` | nothing | nothing |
| `release_expired` | the build was released after `release_until` | error | a banner |

`lifecycle.daysRemaining` is the whole UTC days until `usage_until` (`0` on the last licensed day, negative after it, `null` for `release_until`). `lifecycle.licensedUntil` is the date exactly as the key carries it - print that string, never a date rebuilt from a timestamp.

The two flags close channels, per product:

- `no-console-warns` - nothing reaches the console.
- `no-ui-warns` - no **warning** is rendered in the UI. It does **not** lift the trial hard-stop block: the block is enforcement, not a warning (Handsontable decision DEV-2709; the specification's §4.1 table header does not record the split yet).

Both are set on keys issued for external, end-user-facing use, so your license messages never reach your customer's own users.

The specification's message text (§4.1, §4.2). Replace `{PRODUCT}` with your product's display name. Print `usage_until` dates with the ` (UTC)` marker and `release_until` dates without it:

| State | Message |
| --- | --- |
| `trial_notice` | `Your {PRODUCT} license key expires in {N} days. To continue using {PRODUCT}, you need to purchase a license.` |
| `trial_soft_stop` | `Your {PRODUCT} trial license key expired on {DATE} (UTC). To continue using {PRODUCT}, you need to purchase a license.` |
| `trial_hard_stop` | `Your {PRODUCT} trial license key expired on {DATE} (UTC). You may no longer use {PRODUCT} under the trial license. To continue using the software, contact sales@handsontable.com to purchase a valid license.` |
| `usage_notice` | `Your {PRODUCT} subscription license expires on {DATE} (UTC). To renew your license, contact sales@handsontable.com.` |
| `usage_soft_stop`, `usage_hard_stop` | `Your {PRODUCT} subscription license expired on {DATE} (UTC). To continue using the software, contact sales@handsontable.com to purchase a valid license key.` |
| `release_expired` | `The license key for {PRODUCT} expired on {DATE}, and is not valid for the installed version {VERSION}. Renew your license key or downgrade to a version released on or before {DATE}. If you need any help, contact us at sales@handsontable.com.` |

Two edges the specification leaves open, as Handsontable words them: `{N}` of `1` reads "expires in 1 day", and `0` reads "expires today" (the last licensed day is licensed in full). Show each distinct message once per key per page, not once per instance.

The message for an **invalid or missing** key is not in the specification yet (§4.5). Handsontable reuses its legacy messages and points at support rather than sales, because both are install faults.

## Rules you must not break

Each of these has broken a real implementation, or a specification fixture exists for it.

1. **Never convert a date through `Date`.** Compare `usage_until` in UTC, and `release_until` against the build date **as text** (`'2027-08-12' >= '2027-08-11'` is exact for `YYYY-MM-DD`). `new Date('07/14/2025')` parses in local time; a `toISOString()` round trip moves a date by a day east of UTC.
2. **`usage_until` is inclusive.** The license is valid until the UTC midnight that *follows* it. The hard stop starts at `usage_until + 1 + grace` days, `00:00:00Z`. Day counts are calendar days (UTC midnight to UTC midnight), never milliseconds divided and floored. `notice: 0` means no warning window at all.
3. **A `release_until` license never reads the clock.** A perpetual key must read the same with the clock set to 1999 or 2035, or on an offline machine.
4. **Fail open on a missing build date, and only on a missing one.** If the build date is missing (`undefined`, `null`, empty), a `release_until` license reads as `release_valid` - a broken build must never tell a paying customer their license lapsed. A build date in the wrong format is your bug and throws; convert with `toIsoBuildDate`. Read the build constant exactly as your bundler inlines it - do not wrap `process.env.X` in a `typeof process` guard, which the bundler does not inline and which then blanks the date.
5. **Do not repair a key.** Surrounding whitespace is fine to trim. Whitespace, line breaks or anything else *inside* the brackets makes the key invalid - stripping it would accept keys the generator never issued.
6. **Be strict about shape, lenient about vocabulary.** Unknown products, capability tokens, flags and extra fields are kept and ignored. A key your build does not fully understand must still read. Only a malformed shape (both dates, no date, a bad date, a negative window) makes a key invalid.
7. **Never branch on a contract type or a package name.** The payload has neither. Decide by which date is present and by the `trial` flag - which is what the state names already encode.
8. **The capability-token meaning lives in your product.** Keep the list of tokens your build understands next to your feature gates. Tokens are only ever added to a product, never removed, so a gate on an existing token stays valid.
9. **Keep the copy identical to `license-key`.** See [Copy it into a product](#copy-it-into-a-product).

## What each product supplies

| | Handsontable | HyperFormula |
| --- | --- | --- |
| `product` | `'handsontable'` | `'hyperformula'` |
| Build date | `process.env.HOT_RELEASE_DATE` (`DD/MM/YYYY`) | `process.env.HT_RELEASE_DATE` (`DD/MM/YYYY`) |
| Literal keys | `non-commercial-and-evaluation`, `ht68e-1f2b7-47158-70b05-0842f` | `gpl-v3`, `internal-use-in-handsontable`, `hftrial-0168e-1f2b7-47158-70b05-0842f` |
| Capability tokens | `core` | `functions_1` ... `functions_4`, `spreadsheet`, `import_export` |
| Legacy keys | own obfuscated validator | own obfuscated validator |

Pass **every** literal key the product accepts today, including the ones shaped like a legacy key: checked first, they never reach the legacy validator. The lists above are what each product accepted when this reader was written - check the product's own validator before copying them.

A new product needs the same five things: a product name agreed with my.handsontable.com, a build date, its literal keys (maybe none), its capability tokens, and a decision about its legacy keys (maybe none).

Handsontable already ships an earlier port of this reader in `handsontable/src/utils/entitlementLicenseKey/` (DEV-2562). This directory is that port made general, with the same state names and window rules. The differences, when switching Handsontable over:

- the product name is passed in (`readEntitlementLicense(key, { product })`) instead of being built in,
- `detectLicenseKeyFormat(key, literalKeys)` takes the literal keys and returns `'literal'` for them, where the port returns `'non-commercial-and-evaluation'` (Handsontable only calls `isEntitlementKey`, which is unchanged),
- a date that is not a string, such as `["2027-08-12"]`, makes the key invalid - the port still accepts it,
- `extractEntitlementKeyData` returns `null` for a value that is not a string,
- every result is frozen and typed read-only - code that sorts or pushes into one must copy it first,
- a build date in the wrong format throws; the port fails open on it,
- `classifyEntitlement` throws for an entry without exactly one valid date,
- the clock is read once per `readEntitlementLicense` call, and never for a `release_until` entry.

## Test it in your product

The windows are evaluated in this directory and are already covered by `license-key`'s own tests (the specification's Date semantics fixtures J1-J10). Your product still needs to test **its own wiring**:

- each literal key, a legacy key, a missing key and an unreadable key reach the right path,
- each of the ten states produces the right message on the right surface, and nothing when the matching channel is closed,
- the trial hard stop blocks even with `no-ui-warns`,
- a key for another product only reports an invalid key,
- the build date constant reaches `readEntitlementLicense` in your real bundle, not only in tests,
- pin `now` (or mock `Date.now`) in every test - never rely on the real clock.

For fixture keys, generate real ones with the `license-key` CLI, so a misunderstanding shared by your test and your code cannot pass:

```bash
# in a checkout of license-key
npm install && npm run build
npm run generate-entitlement-key --record='{"holder":"Test Fixture","issued":"2026-08-12","licenses":[{"product":"hyperformula","contractType":"perpetual","agreement":"perpetual-2.0","package":"Pro","mode":"internal","date":"2027-03-31","notice":0,"grace":0}]}'
```

For the shapes the generator refuses (both dates, a bad date, an unknown token), build the block yourself in a test-only helper - kept in a `__tests__/` directory beside the copy, and never imported from your source:

```ts
import { sha512 } from '../entitlementKeyReader/sha512';
import { stringToUtf8Bytes, stringToBase64Url } from '../entitlementKeyReader/encoding';

export function buildTestKey(payload: object): string {
  const encoded = stringToBase64Url(JSON.stringify(payload));

  return `[${encoded}${sha512(stringToUtf8Bytes(encoded))}]`;
}
```

This is not a secret: the checksum recipe ships in every product bundle by design. The key protects integrity (a typo or a broken paste cannot pass), not authenticity.

## API reference

### `readEntitlementLicense(licenseKey, { product, buildDate, now? })` -> `EntitlementLicense`

The one call a product needs. Verifies the block, picks the product's entry, classifies it, reads its flags and resolves its grants.

```text
licensed:      { licensed: true, reason: null, entitlement, lifecycle, channels, grants }
not licensed:  { licensed: false, reason: 'unreadable' | 'product_missing', entitlement: null,
                 lifecycle: null, channels: { console: true, ui: true }, grants: UNRESTRICTED_GRANTS }
```

The result is frozen all the way down, in both cases.

Throws a `TypeError` - a wrong argument is your bug, and a silent "invalid" would hide it - when:

- the options object is missing,
- `product` is not a non-empty string,
- `now` is given and is not a finite number of milliseconds,
- `buildDate` is present but not a real `YYYY-MM-DD` (a missing one - `undefined`, `null`, `''` - fails open instead).

The argument checks run before the key is read, so they fail whatever key a test uses.

### `toIsoBuildDate(releaseDate)` -> `string`

`'14/07/2025'` -> `'2025-07-14'`. Also accepts an already-bare `YYYY-MM-DD`. Returns `''` for anything that is not a real date, so its output is always safe to pass on: a real date, or a missing one (fails open).

### `detectLicenseKeyFormat(licenseKey, literalKeys?)` -> `'entitlement' | 'legacy' | 'literal' | 'unknown'`

Tells the shape of a key without validating it. `'entitlement'` means "a `[...]` block is present", not "valid". `literalKeys` are compared trimmed and case-insensitively; a blank entry, and a missing or non-array list, are ignored. `isEntitlementKey(licenseKey)` is the one-line form of the entitlement check.

### `extractEntitlementKeyData(licenseKey)` -> `{ products } | null`

The verified, frozen payload, or `null` for any unreadable key. `validateEntitlementKey(licenseKey)` returns the same as a boolean. `getProductEntitlement(data, product)` returns one product's entry or `null`, reading own properties only.

### `classifyEntitlement(entitlement, { now, buildDate })` -> `LicenseLifecycle`

`{ state, isTrial, daysRemaining, licensedUntil }` for one verified entry. It checks `buildDate` as `readEntitlementLicense` does, and throws for an entry that does not carry exactly one valid date - pass an entry read by `extractEntitlementKeyData`, not one you built.

### `resolveChannels(entitlement)` -> `{ console, ui }`

Which channels the entry's flags leave open.

### Grants

- `getLicenseGrants(data)` -> `{ unrestricted: false, products: { [name]: { capabilities } } }`
- `UNRESTRICTED_GRANTS` - frozen; every query answers "granted".
- `hasProductGrant(grants, product)` -> `boolean`
- `hasCapability(grants, product, token)` -> `boolean`
- `getProductCapabilities(grants, product)` -> `string[] | null` (a copy; `null` when unrestricted or not granted)

### Constants

`TRIAL_FLAG`, `NO_CONSOLE_WARNS_FLAG`, `NO_UI_WARNS_FLAG`, `CUSTOM_FLAG`.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | the public exports |
| `readLicense.ts` | `readEntitlementLicense` |
| `detectFormat.ts` | `detectLicenseKeyFormat`, `isEntitlementKey` |
| `extractKeyData.ts` | the block reader: checksum, decode, shape checks, the one-entry cache |
| `classify.ts` | the lifecycle windows and the channels |
| `grants.ts` | capability queries |
| `buildDate.ts` | `toIsoBuildDate` |
| `encoding.ts` | UTF-8, base64 and `YYYY-MM-DD` parsing, without `TextEncoder` or `Buffer` |
| `sha512.ts` | a pure-JS SHA-512 - the Web Crypto API is unavailable on plain `http://` pages |
| `constants.ts`, `types.ts` | names and shapes |
| `AGENTS.md` | the rules above, for AI coding agents working near the copy |

The full format, and the reasons behind it, are in `license-key`: `.ai/ENTITLEMENT-KEY-FORMAT.md` and `.ai/DESIGN-DECISIONS.md`. The specification is [License Keys - part 1 (18.1) rev 6](https://app.clickup.com/9015210959/v/dc/8cnjcyf-31675/8cnjcyf-46715), with its [Date semantics fixtures](https://app.clickup.com/9015210959/v/dc/8cnjcyf-31675/8cnjcyf-48255) and [Examples](https://app.clickup.com/9015210959/v/dc/8cnjcyf-31675/8cnjcyf-48235).
