# ADR 2026-07-13 — SORT (HF-69) + UNIQUE (HF-68) dynamic array functions

- **status**: accepted
- **date**: 2026-07-13
- **tasks**: HF-69 (86c89q1tt) — SORT · HF-68 (86c89q1tq) — UNIQUE
- **parent**: HF-28 (86c6r57ke) — Modern dynamic array functions · **siblings**: SEQUENCE (shipped), VSTACK/HSTACK (HF-71, in review)
- **base branch**: clean `develop` (`00e5c730a`) — two independent feature branches [dec_1]

## Context

HF-28 tracks the modern dynamic-array family. SEQUENCE is shipped and is the anatomy exemplar:
a plugin declares `implementedFunctions` with `method`, a mandatory `sizeOfResultArrayMethod`,
and `vectorizationForbidden: true`; the runtime method returns a `SimpleRangeValue`/`CellError`
via `runFunction`, and the parse-time method returns an `ArraySize` [vrf_3]. FILTER is the
exemplar for a **dynamic-size** result: it predicts the input array size at parse time and
returns fewer rows at runtime, tolerating the size mismatch [vrf_4]. SORT and UNIQUE are
greenfield — no `SortPlugin`/`UniquePlugin` exists in `src/` [vrf_7].

Excel's documented contracts (authoritative, Microsoft Learn):

- **SORT(array, [sort_index], [sort_order], [by_col])** — returns an array the **same shape** as
  `array`. `sort_index` is a 1-based row/column number (default row1/col1); `sort_order` is `1`
  ascending (default) or `-1` descending; `by_col` is `FALSE` (default, sort by row) or `TRUE`
  (sort by column) [vrf_1].
- **UNIQUE(array, [by_col], [exactly_once])** — `by_col` `FALSE` (default) compares rows and
  returns unique rows, `TRUE` compares columns and returns unique columns; `exactly_once` `TRUE`
  returns only rows/columns occurring exactly once, `FALSE` (default) returns all distinct
  rows/columns. Result size is data-dependent (dynamic) [vrf_2].

HyperFormula already has an ordering comparator: `ArithmeticHelper` exposes `lt`/`gt`/`eq`, which
handle mixed types (numbers < strings < booleans via `CellValueTypeOrd`), empty cells, and
locale collation driven by `caseSensitive`/`accentSensitive` config [vrf_5]. Plugins register
automatically — every non-`_` export from `src/interpreter/plugin/index.ts` is registered as a
built-in [vrf_6] — so wiring is: add the plugin file, export it, and add the function name to all
17 i18n language packs.

**Verification constraint.** This environment has no live Excel. Microsoft Learn documentation is
the oracle for documented behavior [vrf_1][vrf_2]. Behaviors **not** in the docs (notably the
reported "`sort_order=0` does not error" quirk) cannot be re-verified here and are **not** asserted
from memory — we adopt the strict documented contract and flag the quirk for live-Excel/Kuba
confirmation [con_1].

## Decisions

- **Two separate PRs, one per ClickUp task, off clean `develop`** [dec_1]: Kuba tracks HF-68 and
  HF-69 separately. SORT on `feature/HF-69-sort`, UNIQUE on `feature/HF-68-unique`, each with its
  own paired `hyperformula-tests` PR. The shared ADR + plan are committed to both branches.

- **`sort_order` strictly `{1, -1}`; any other value → `#VALUE!`** [dec_2]: Microsoft documents
  only `1` and `-1` [vrf_1]. The reported `sort_order=0` non-error is undocumented and could not
  be verified against live Excel here [con_1]; we choose the strict documented contract (simpler,
  testable without Excel, defensible) and will revisit if live-Excel/Kuba confirms otherwise.

- **Reuse `ArithmeticHelper.lt`/`gt` for SORT ordering and `eq` for UNIQUE equality** [dec_3]: no
  new comparator. SORT's per-key comparator is `lt/gt` scaled by `sort_order`, with a **stable**
  sort so ties preserve input order (matches Excel's stable behavior). UNIQUE dedups by comparing
  rows/columns element-wise with `eq`, which is case-insensitive by default (Excel UNIQUE is
  case-insensitive) and honors HF's collation config [dec_5].

- **Error-type map** [dec_4]:
  - non-finite (`Infinity`/`NaN`) numeric arg → `#VALUE!`
  - `sort_index` < 1 or exceeding the sort dimension → `#VALUE!`
  - `sort_order` ∉ `{1,-1}` → `#VALUE!` (per [dec_2])
  - result exceeding `maxRows`/`maxColumns` → `#VALUE!`
  - any error-typed argument → propagate automatically via `runFunction`
  - wrong arity → `#N/A` automatically (arg-count validation)

- **Single-key `sort_index` in v1; multi-key array-constant `sort_index` (e.g. `{1,2}`) deferred**
  [dec_6]: the `sort_index` parameter is typed `NUMBER`; accepting an array constant would require
  a different argument shape. v1 sorts by one key; multi-key is recorded in
  `known-limitations.md` and left for a follow-up. Concrete error messages: `sort_index < 1` →
  `LessThanOne`; `sort_index >` the sort dimension → `ValueLarge`; `sort_order ∉ {1,-1}` →
  `BadMode`.

- **Propagate the first error found in the input range** [dec_7]: `lt`/`gt`/`eq` operate on
  no-error scalars, and Excel's exact in-array error behavior is unverifiable here [con_1]. SORT and
  UNIQUE scan the input and return the first `CellError` encountered, consistent with the
  "error arg → propagate" rule extended to range contents [dec_4].

- **Empty UNIQUE result → `#NA` (`EmptyRange`)** [dec_8]: only reachable via `exactly_once` when no
  row/column occurs exactly once. Excel returns `#CALC!`, which HyperFormula has no type for; we
  mirror FILTER's empty-result mapping (`ErrorType.NA` / `ErrorMessage.EmptyRange`) for consistency
  with the sibling dynamic-size function.

- **Result-size prediction** [con_3]: SORT output shape equals input shape → parse-time size =
  `arraySizeForAst(array)` (deterministic). UNIQUE output size is data-dependent → mirror FILTER:
  predict the input size as an upper bound and return the smaller actual result at runtime
  [vrf_4].

## Consequences

- **Positive**: both functions reuse existing, tested infrastructure (comparator, `runFunction`,
  array-size machinery); behavior for mixed types/empties/collation is consistent with the rest of
  HF automatically; auto-registration means minimal wiring.
- **Neutral / follow-ups**: the strict `sort_order` contract [dec_2] and any other Excel divergence
  are surfaced in three places (PR Notes, inline comment, test name/comment) and recorded in
  `docs/guide/known-limitations.md` / `list-of-differences.md` where behavior diverges. The
  `sort_order=0` quirk is an open live-Excel verification item, not a shipped guarantee [con_1].
- **Negative**: without live Excel, tie-breaking on mixed types and the exact collation of UNIQUE
  are validated against HF's own comparator semantics + MS docs, not a byte-for-byte Excel oracle;
  xlsx oracle fixtures are provided so a human/graph-runner with Excel can confirm later.

## Alternatives considered

1. **One combined PR for both functions** — rejected: Kuba tracks HF-68 and HF-69 as separate
   ClickUp tasks; combined delivery breaks his tracking [dec_1].
2. **Write a bespoke SORT comparator** — rejected: `ArithmeticHelper.lt/gt/eq` already encodes
   Excel-consistent cross-type ordering, empties, and collation [vrf_5]; a bespoke comparator would
   drift from the rest of the engine [dec_3].
3. **Treat `sort_order=0` as valid ascending** (matching the reported Excel quirk) — rejected: the
   quirk is undocumented and unverifiable in this environment [con_1]; asserting it from memory
   would violate feature-traceability. Strict documented contract chosen [dec_2].
4. **Predict a fixed 1×1 size for UNIQUE** — rejected: FILTER's input-size-upper-bound prediction
   is the established dynamic-size pattern and spills correctly [vrf_4][con_3].
5. **Make UNIQUE case-sensitive** — rejected: Excel UNIQUE is case-insensitive and HF's `eq`
   default (`caseSensitive: false`) matches it while staying config-driven [dec_5].

## §AuditSources

[vrf_1] Microsoft documents SORT(array,[sort_index],[sort_order],[by_col]); result same shape as array; sort_order 1=ascending(default)/-1=descending; by_col FALSE(default)=by row
- type: live-http
- spec: https://support.microsoft.com/en-us/office/sort-function-22f63bd0-ccc8-492f-953d-c20e8e44b86c
- verify: curl -sSL -o /dev/null -w "%{http_code}" "https://support.microsoft.com/en-us/office/sort-function-22f63bd0-ccc8-492f-953d-c20e8e44b86c"
- expect: ^200$
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:30:00Z

[vrf_2] Microsoft documents UNIQUE(array,[by_col],[exactly_once]); by_col FALSE=unique rows; exactly_once TRUE=rows/cols occurring exactly once; dynamic result size
- type: live-http
- spec: https://support.microsoft.com/en-us/office/unique-function-c5ab87fd-30a3-4ce9-9d1a-40204fb85e1e
- verify: curl -sSL -o /dev/null -w "%{http_code}" "https://support.microsoft.com/en-us/office/unique-function-c5ab87fd-30a3-4ce9-9d1a-40204fb85e1e"
- expect: ^200$
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:30:00Z

[vrf_3] SEQUENCE plugin is the anatomy exemplar: sizeOfResultArrayMethod + vectorizationForbidden:true
- type: repo-file
- spec: handsontable/hyperformula:src/interpreter/plugin/SequencePlugin.ts@feature/HF-69-sort
- verify: grep -E "sizeOfResultArrayMethod|vectorizationForbidden" /workspaces/hyperformula-worktrees/HF-69-sort/src/interpreter/plugin/SequencePlugin.ts
- expect: vectorizationForbidden
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:30:00Z

[vrf_4] FILTER is the dynamic-size exemplar: parse-time size method returns an ArraySize from input, runtime returns fewer rows
- type: repo-file
- spec: handsontable/hyperformula:src/interpreter/plugin/ArrayPlugin.ts@feature/HF-69-sort
- verify: grep -E "filterArraySize|new ArraySize\(width, height\)" /workspaces/hyperformula-worktrees/HF-69-sort/src/interpreter/plugin/ArrayPlugin.ts
- expect: filterArraySize
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:30:00Z

[vrf_5] ArithmeticHelper exposes lt/gt/eq comparators handling mixed types, empties, and collation
- type: repo-file
- spec: handsontable/hyperformula:src/interpreter/ArithmeticHelper.ts@feature/HF-69-sort
- verify: grep -E "public (lt|gt|eq) =" /workspaces/hyperformula-worktrees/HF-69-sort/src/interpreter/ArithmeticHelper.ts
- expect: public lt =
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:30:00Z

[vrf_6] Plugins auto-register: every non-underscore export from interpreter/plugin/index.ts is registered as a built-in
- type: repo-file
- spec: handsontable/hyperformula:src/index.ts@feature/HF-69-sort
- verify: grep -E "registerFunctionPlugin\(plugins\[pluginName\]\)" /workspaces/hyperformula-worktrees/HF-69-sort/src/index.ts
- expect: registerFunctionPlugin
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:30:00Z

[vrf_7] SORT/UNIQUE are greenfield: no SortPlugin or UniquePlugin class exists in src
- type: command
- spec: repository source tree @feature/HF-69-sort
- verify: grep -rlE "class SortPlugin|class UniquePlugin" /workspaces/hyperformula-worktrees/HF-69-sort/src/ || echo NONE
- expect: NONE
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:30:00Z

[dec_1] Two separate PRs, one per ClickUp task, each off clean develop
- type: transcript
- spec: HF-68/HF-69 handoff (Delivery) — Kuba tracks HF-68 and HF-69 separately — https://app.clickup.com/t/86c89q1tt , https://app.clickup.com/t/86c89q1tq
- verify: echo "Manual — handoff Delivery line: two separate PRs, not combined"
- expect: .
- asserted-by: marcin-kordas-hoc
- asserted-at: 2026-07-13T12:30:00Z

[dec_2] sort_order strictly {1,-1}; any other value yields #VALUE!
- type: transcript
- spec: this ADR §Decisions; documented contract per vrf_1; undocumented quirk deferred per con_1
- verify: echo "Manual — strict documented contract chosen; sort_order=0 quirk unverifiable, deferred"
- expect: .
- asserted-by: marcin-kordas-hoc
- asserted-at: 2026-07-13T12:30:00Z

[dec_3] Reuse ArithmeticHelper.lt/gt for SORT ordering and eq for UNIQUE equality (stable sort for ties)
- type: transcript
- spec: this ADR §Decisions; comparator exists per vrf_5
- verify: echo "Manual — reuse existing comparator; no bespoke ordering"
- expect: .
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:30:00Z

[dec_4] Error-type map: non-finite/negative-zero-sort_index/over-limit -> #VALUE!; error arg propagates; wrong arity -> #N/A
- type: transcript
- spec: HF-68/HF-69 handoff (Stage 2 error-type map) + this ADR §Decisions
- verify: echo "Manual — error map per handoff Stage 2"
- expect: .
- asserted-by: marcin-kordas-hoc
- asserted-at: 2026-07-13T12:30:00Z

[dec_5] UNIQUE equality uses eq (case-insensitive by default, config-driven), matching Excel's case-insensitive UNIQUE
- type: transcript
- spec: this ADR §Decisions; eq semantics per vrf_5
- verify: echo "Manual — UNIQUE case-insensitive by default via eq, honors caseSensitive config"
- expect: .
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:30:00Z

[dec_6] Single-key sort_index in v1; multi-key array-constant sort_index deferred; error messages LessThanOne / ValueLarge / BadMode
- type: transcript
- spec: this ADR §Decisions; sort_index typed NUMBER; multi-key needs a different arg shape
- verify: echo "Manual — v1 single-key sort_index; multi-key deferred to known-limitations"
- expect: .
- asserted-by: marcin-kordas-hoc
- asserted-at: 2026-07-13T12:30:00Z

[dec_7] SORT and UNIQUE propagate the first CellError found in the input range
- type: transcript
- spec: this ADR §Decisions; lt/gt/eq operate on no-error scalars; extends dec_4 to range contents
- verify: echo "Manual — propagate first in-range error; Excel in-array error behavior unverifiable"
- expect: .
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:30:00Z

[dec_8] Empty UNIQUE result (exactly_once with no once-only row/col) -> #NA (EmptyRange), mirroring FILTER
- type: transcript
- spec: this ADR §Decisions; Excel returns #CALC! (no HF equivalent); mirror FILTER empty-result mapping
- verify: echo "Manual — empty UNIQUE -> NA/EmptyRange like FILTER"
- expect: .
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:30:00Z

[con_1] No live Excel in this environment; MS docs are the oracle; undocumented quirks (sort_order=0) flagged for live-Excel/Kuba, not asserted from memory
- type: transcript
- spec: this ADR §Context (Verification constraint)
- verify: echo "Manual — no live Excel; documented behavior only; quirks deferred to live-Excel verification"
- expect: .
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:30:00Z

[con_2] Dual test env (jest + karma/Jasmine): no it.each / toHaveLength / arrayContaining / fs; specs must compile with tsconfig.test.json
- type: transcript
- spec: HF-68/HF-69 handoff (Stage 3 dual test env) + reference_dual_test_env_jasmine
- verify: echo "Manual — dual-env spec constraints per handoff Stage 3"
- expect: .
- asserted-by: marcin-kordas-hoc
- asserted-at: 2026-07-13T12:30:00Z

[con_3] SORT output shape = input shape (deterministic size); UNIQUE dynamic size mirrors FILTER (input size as upper bound)
- type: transcript
- spec: this ADR §Decisions; FILTER pattern per vrf_4
- verify: echo "Manual — SORT deterministic size; UNIQUE dynamic, mirrors FILTER"
- expect: .
- asserted-by: claude-opus-4-8
- asserted-at: 2026-07-13T12:30:00Z
