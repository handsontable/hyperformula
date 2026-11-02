# Entitlement key reader - rules for coding agents

`README.md` here is the full integration guide; read it before changing anything that calls this code. Which repository you are in decides the first rule:

- **In `handsontable/license-key`** (this directory is `vendor/entitlement-key-reader/` next to `src/`), this is the **original**. Edit it together with `src/entitlement-key/` - a change to the key format is a change to both, in the same PR (see the root `CLAUDE.md`). Keep the tests in `test/entitlement-key-reader/` passing and extend them for anything new.
- **Anywhere else** (a product such as Handsontable or HyperFormula), this directory is a **copy**. **Do not edit files in it.** Fix the original in `license-key` and copy the directory again. A local change makes two products disagree about the same key, and CI drift checks will fail.

In both places:

- **Every import stays inside this directory.** No npm dependencies, and no `crypto`, `Buffer`, `TextEncoder`, `crypto.subtle` or DOM APIs - the reader must run on plain `http://` pages and in any bundler.
- **Product-specific code lives outside this directory**: the product name, the build date, the literal keys, the messages and the capability-token gates.
- **Call `readEntitlementLicense(key, { product, buildDate })`** for a key that `detectLicenseKeyFormat` reports as `'entitlement'`. Legacy and literal keys are the product's own path.
- **Never convert a license date through `Date`.** Print `lifecycle.licensedUntil` as it is. Pass the build date as bare `YYYY-MM-DD` text (`toIsoBuildDate` converts `DD/MM/YYYY`).
- **Tell users to keep the key on one line** (in `.env`, CI secrets, YAML or code). The reader ignores whitespace and a line break saved as `\n`, but a shell or `.env` value can be cut short by a quote inside the key. The README's "Where users keep the key" table lists what works.
- **Pass the whole key, and do not "repair" it.** A version 2 key covers the prose too (a digest in the payload), so never cut a key down to its `[...]` block or strip characters from it. Trimming the whole key is fine. A version 1 key (no `v`) never covered its prose - do not treat a readable key as proof its sentences are unedited; check `version`.
- **Every format version keeps the payload checksum and the prose digest.** That is what lets a product that only knows an older version read a newer key. In `license-key`, a change that bumps `v` may add fields, never change those two - a change that must is a new format, not a new version.
- **An unlicensed key unlocks everything** (`UNRESTRICTED_GRANTS`). Never gate features away from a key that failed to read.
- **`no-ui-warns` silences UI warnings, not the trial hard-stop block.**
- **Everything the reader returns is frozen** and typed read-only. Copy an array before sorting or changing it.
- **A build date in the wrong format throws**; only a missing one fails open.
- **Tests pin the clock.** Pass `now`, or mock `Date.now`. Fixture keys come from the `license-key` generator CLI; forged keys come from a test-only helper that is never imported from product source.
