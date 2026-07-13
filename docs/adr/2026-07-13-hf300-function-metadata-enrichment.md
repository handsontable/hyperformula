# ADR 2026-07-13 — HF-300 function-metadata enrichment

- **status**: accepted
- **date**: 2026-07-13
- **task**: HF-300 (86caprtgj) — "Make sure `getFunctionDetails` returns Learn More links, usage examples, parameter descriptions"
- **parent**: HF-249 (86c9x5a5c) · **siblings**: HF-285/PR #1699 (docs single source), PR #1698 (VSTACK/HSTACK)
- **base branch**: `feature/hf-249-function-metadata-api` (API PR #1692) [dec_3]

## Context

The Tier-2 function metadata API `getFunctionDetails` already returns `localizedName`,
`canonicalName`, `category`, `shortDescription`, per-parameter `name` + `optional`, and
`repeatLastArgs`. The storage model already carries the fields HF-300 needs: `FunctionDoc`
declares optional `examples?` and `documentationUrl?`, and `ParameterDoc` declares
`description` [vrf_2]. The public builder maps them into `FunctionDetails`, surfacing
`documentationUrl` via `doc.documentationUrl ?? ''` and `examples` via `doc.examples ?? []`,
so both are emitted empty today for every function that has not been authored [vrf_5].

HF-300's Definition of Done (Kuba, authoritative) is: for each function, `getFunctionDetails`
returns a short description (done — untouched), a **usage example** (net-new), a **documentation
URL** (a single shared URL for all functions in v1 — no per-function anchors) [dec_1], and for
each parameter its **name** (done) plus a **short description** (net-new), all in **English**
(translations are a later phase — no i18n added here) [con_2].

The `shortDescription` and parameter `name` fields were migrated from
`docs/guide/built-in-functions.md` by `scripts/hf249-migrate-function-docs.ts`. That guide table
has only three columns — Function ID, Description, Syntax — so it carries **no** parameter
descriptions and **no** usage examples [vrf_1]. There is therefore no machine-readable source
for the net-new fields; they must be authored.

The pattern to follow already exists in the branch: `SUM` and `SUMIF` are authored end-to-end as
the reference exemplar, each with per-parameter descriptions, a `documentationUrl`, and 2–3
`examples` [vrf_4]. HF-300 extends that exemplar to the rest of the catalogue.

The arity of the parameter list is guarded: `buildFunctionDetails` throws when
`doc.parameters.length` differs from the implementation arity [vrf_3]. Any authoring must keep the
parameter count unchanged and only fill the `description` field [con_1].

The base branch is chosen and open [vrf_7].

## Decisions

- **Single shared `documentationUrl`, with `.html`, centralized in the builder** [dec_1]:
  every function's `documentationUrl` is
  `https://hyperformula.handsontable.com/docs/guide/built-in-functions.html` — the exact string
  in Kuba's DoD. Both the `.html` and clean-URL forms resolve to the same HTTP 200 page [vrf_6],
  but we standardize on the DoD's literal `.html` form. The value is defined **once** as a default
  constant in `buildFunctionDescriptions.ts` (not repeated per function); the per-function
  `documentationUrl` on `SUM`/`SUMIF` is removed so the default is the single source, and the two
  existing `SUM`/`SUMIF` assertions in `hyperformula-tests` are updated to the `.html` form. No
  per-function anchors are built in v1 [con_3].

- **Author examples + parameter descriptions manually, one authoring pass per category file**
  [dec_2]: there is no structured source for the net-new fields [vrf_1], so each of the 13
  `categories/*.ts` files is authored independently (parallelizable). Official Excel/Google Sheets
  docs are the semantic oracle for what each function/parameter does; **HyperFormula's actual
  behavior is the tie-breaker** — every example must evaluate in HF and every parameter description
  must describe HF's behavior, not an Excel-only nuance. Examples are spot-checked by evaluating
  them in HF. Where HF diverges from Excel (e.g. a function HF implements with different
  edge-case handling), the description states HF's behavior.

- **One PR into `feature/hf-249-function-metadata-api`; paired tests PR in `hyperformula-tests`**
  [dec_3]: HF-300 is a sibling of #1692/#1699 on the same feature line, not a `develop` task, so it
  targets the feature branch and its tests branch, not clean `develop`.

## Consequences

- **Positive**: `getFunctionDetails` becomes fully populated for the built-in catalogue; the
  structure is already i18n-ready for the later translation phase; the single-URL default means
  adding a new function needs no URL authoring.
- **Neutral / follow-ups**: because HF-300 only fills `examples`, parameter `description`, and the
  single `documentationUrl` — none of which is rendered in the guide's Function ID/Description/
  Syntax table — the #1699 docs drift-check stays green; no per-function anchors and no i18n are in
  scope [con_2][con_3]. Protected functions (OFFSET, VERSION) live on #1699 and stay empty — out of
  HF-300 scope.
- **Negative**: manual authoring across ~400 functions is judgment-heavy and must be reviewed for
  accuracy-to-HF; the arity guard [con_1] means an authoring error that changes the parameter count
  fails loudly at build/test time rather than silently.

## Alternatives considered

1. **Per-function documentation anchors** (deep-link each function to its section) — rejected: the
   DoD explicitly scopes v1 to a single shared URL; anchors are a later enhancement [dec_1].
2. **Derive examples/descriptions programmatically from the guide** — rejected: the guide table has
   no such data [vrf_1]; there is nothing to derive from.
3. **Set `documentationUrl` per function in each category file** — rejected: it is one identical URL
   for all functions in v1, so a single builder default is the correct single source [dec_1].
4. **Clean-URL form without `.html`** (matches the pre-existing `SUM`/`SUMIF` entries) — rejected in
   favor of the DoD's literal `.html` string; both resolve identically [vrf_6], and consistency with
   the written DoD was chosen over avoiding the small test churn.
5. **Add i18n translations for the new fields now** — rejected: DoD scopes HF-300 to English;
   translations are a separate later phase [con_2].

## §AuditSources

[vrf_1] The built-in-functions guide table has only Function ID / Description / Syntax columns (no parameter-description or example column)
- type: repo-file
- spec: handsontable/hyperformula:docs/guide/built-in-functions.md@feature/hf-249-function-metadata-api
- verify: grep -E "Function ID.*Description.*Syntax" /workspaces/hyperformula/docs/guide/built-in-functions.md
- expect: Function ID.*Description.*Syntax
- source-sha: 5798f0404d25b446e6f7cb3595e2ad9b44c89b18
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:01:41Z

[vrf_2] FunctionDoc declares optional `examples?: string[]` and `documentationUrl?`, and ParameterDoc declares a `description` field
- type: repo-file
- spec: handsontable/hyperformula:src/interpreter/functionMetadata/FunctionDescription.ts@feature/hf-249-function-metadata-api
- verify:
- expect: examples\?: string\[\]
- source-sha: 39fdc0affe2cffad832663522807a4444990966b
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:01:41Z

[vrf_3] buildFunctionDetails throws on a parameter-count vs implementation-arity mismatch (the arity guard)
- type: repo-file
- spec: handsontable/hyperformula:src/interpreter/functionMetadata/buildFunctionDescriptions.ts@feature/hf-249-function-metadata-api
- verify:
- expect: Function metadata mismatch for
- source-sha: b3845b4dfad5888ec0f9a02fd946ea2aa6f25a42
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:01:41Z

[vrf_4] SUM is authored end-to-end as the reference exemplar (parameter description + examples)
- type: repo-file
- spec: handsontable/hyperformula:src/interpreter/functionMetadata/categories/math-and-trigonometry.ts@feature/hf-249-function-metadata-api
- verify:
- expect: =SUM\(1, 2, 3\)
- source-sha: 4ebb5f1fb8c27a32bc26975c758bf7948adab692
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:01:41Z

[vrf_5] The builder surfaces documentationUrl via `doc.documentationUrl ?? ''` (the single-URL default insertion point)
- type: repo-file
- spec: handsontable/hyperformula:src/interpreter/functionMetadata/buildFunctionDescriptions.ts@feature/hf-249-function-metadata-api
- verify:
- expect: documentationUrl: doc\.documentationUrl \?\? ''
- source-sha: b3845b4dfad5888ec0f9a02fd946ea2aa6f25a42
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:01:41Z

[vrf_6] The DoD documentation URL (with .html) resolves HTTP 200
- type: live-http
- spec: https://hyperformula.handsontable.com/docs/guide/built-in-functions.html
- verify: curl -sS -o /dev/null -w "%{http_code}" https://hyperformula.handsontable.com/docs/guide/built-in-functions.html
- expect: ^200$
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T11:00:00Z

[vrf_7] The base branch is the open API PR #1692
- type: gh-pr
- spec: handsontable/hyperformula#1692
- verify: GHX api repos/handsontable/hyperformula/pulls/1692 --jq .state
- expect: ^open$
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T11:00:00Z

[dec_1] Single shared documentationUrl (with .html), centralized as a builder default — no per-function anchors
- type: transcript
- spec: HF-300 ClickUp task description (Kuba's Definition of Done) — https://app.clickup.com/t/86caprtgj ; URL-form choice confirmed by task owner 2026-07-13
- verify: echo "Manual — Kuba DoD: single shared URL; .html form confirmed by owner; see this ADR §Decisions"
- expect: .
- asserted-by: marcin-kordas-hoc
- asserted-at: 2026-07-13T11:00:00Z

[dec_2] Author examples + parameter descriptions manually, one pass per category file, HF behavior as oracle
- type: transcript
- spec: HF-300 handoff + this ADR §Decisions
- verify: echo "Manual — no machine-readable source (see vrf_1); manual authoring decided"
- expect: .
- asserted-by: marcin-kordas-hoc
- asserted-at: 2026-07-13T11:00:00Z

[dec_3] One PR into feature/hf-249-function-metadata-api; paired tests PR in hyperformula-tests
- type: transcript
- spec: HF-300 handoff (Stage 2) — sibling of #1692/#1699, not a develop task
- verify: echo "Manual — feature-branch task; base = feature/hf-249-function-metadata-api"
- expect: .
- asserted-by: marcin-kordas-hoc
- asserted-at: 2026-07-13T11:00:00Z

[con_1] ParameterDoc[] length MUST equal the function's implementedFunctions.parameters length (arity guard, enforced by vrf_3)
- type: transcript
- spec: this ADR §Context; enforced at runtime per [vrf_3]
- verify: echo "Manual — constraint enforced by buildFunctionDetails throw (vrf_3)"
- expect: .
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T11:00:00Z

[con_2] English only — no i18n added in HF-300 (translations are a later phase)
- type: transcript
- spec: HF-300 ClickUp task description (Kuba's DoD) — https://app.clickup.com/t/86caprtgj
- verify: echo "Manual — DoD: everything in English; translations later"
- expect: .
- asserted-by: marcin-kordas-hoc
- asserted-at: 2026-07-13T11:00:00Z

[con_3] Do not build per-function anchors and do not change the guide-rendered table (keep #1699 drift-check green)
- type: transcript
- spec: HF-300 handoff (Watch-outs) + this ADR §Consequences
- verify: echo "Manual — no anchors; only fills examples/param-desc/doc-URL, none rendered in the guide table"
- expect: .
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T11:00:00Z
