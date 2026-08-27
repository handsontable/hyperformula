# Documentation content guide

## The one principle

**Every page and every section is retrieved and read in isolation, out of order,
by a reader with zero prior context.** RAG systems pull one chunk at a time; a
search result or an AI answer may show only part of a page. So:

> If the answer to a question is not present on a single page, in plain text, in a
> self-contained place — it effectively does not exist.

Write so any one page fully answers one real question. Everything below serves this.

The good news: this is just *good documentation*. The same clarity that helps the AI
helps humans and search. You are not gaming an algorithm — you are writing clearly.

---



## Project context

- **Product:** HyperFormula — an open-source, headless spreadsheet and formula
engine written in TypeScript. It parses and evaluates ~400 Excel/Google
Sheets–compatible functions. It has **no UI**. It runs in the browser or Node.js.
- **Sibling product:** Handsontable (the data grid). HyperFormula is maintained by
the same team but is a **separate product** — do not blur the two.
- **Docs source:** Markdown in the `docs/` folder of the `handsontable/hyperformula`
repo. Guide pages live at `docs/guide/<slug>.md`; the landing page is
`docs/index.md`; API reference under `docs/api/` is **generated from source code
TSDoc — do not hand-edit it**, improve the code comments instead.
- **Toolchain:** VuePress 1.9.10 (static site generator). Pages support YAML
frontmatter, `::: tip / warning / danger` containers, and fenced code blocks.
- **Runnable demos:** hosted on StackBlitz (`handsontable/hyperformula-demos`),
linked per version branch (e.g. `3.3.x`).

---



## What to write (coverage & gap prioritization)

Optimization cannot recover a page that doesn't exist. Coverage comes first.

1. **Write the "obvious" pages.** The journeys teams skip because they feel too
  basic are the ones users ask first: installation (client- and server-side), basic
   usage, configuration options, the **license key** (a top gotcha), a first working
   formula, reading/writing cell values, named expressions, custom functions.
2. **Prioritize by real demand, not intuition.** Rank what to write next using:
  - Support tickets and GitHub issues from the last quarter — each recurring one
   should map to a single findable page. If it doesn't, that's your next page.
  - The docs AI assistant / search logs — repeated questions signal a missing or
  hard-to-find page; questions that span sections signal an organization problem;
  requests for examples signal thin practical guidance.
  - Start with the boring, high-traffic paths before advanced/edge topics.
3. **Prefer less, but better.** Quality beats coverage for retrieval. Delete or
  archive outdated tutorials, deprecated-feature guides, near-duplicate pages, and
   thin placeholder stubs. Stale content competes with correct content and the model
   cannot tell which is current.
4. **Never contradict yourself across pages.** Two pages that disagree are worse than
  one correct page, because retrieval may surface either. When you add or change a
   fact, grep the docs for the old statement and fix every occurrence.
5. **Document errors with their exact text.** Users (and assistants) search by
  pasting the literal error string. For each common error, use the exact message as
   a heading, then give the cause and the fix:
   `### Error: "Named expression 'X' already exists"` → why it happens → how to
   resolve. Reference HyperFormula's error types (`#REF!`, `#VALUE!`, `#NAME?`, etc.)
   by their real symbols.

---



## How to structure a page

Treat **every page as page one.**

1. **Open with scope and prerequisites.** The first lines state what the page covers,
  which version it applies to, and what the reader must already have done. Example
   opener: "This guide covers custom functions in HyperFormula. You need HyperFormula
   installed and a working instance (see Basic usage)."
2. **Name the subject in the body, not just the title.** Write "HyperFormula's
  `buildFromArray` method…", not "the `buildFromArray` method…". A retrieved chunk
   must carry a clear signal of what product/feature it belongs to, because the title
   and breadcrumb may be stripped away. Don't overdo it — once per section is enough.
3. **Front-load the essential context**, then the details. A reader who sees only the
  first chunk should still get the core answer.
4. **Self-containment beats DRY — resolve the tension deliberately.** RAG wants
  repetition; engineering instinct wants "don't repeat yourself." For docs content,
   **self-containment wins**:
  - Repeat the small essential context a reader needs to act here (e.g. that an
  instance is created with a `licenseKey`), even if it appears on other pages.
  - **Link** to another page for *depth* or *related* topics — never make the reader
  leave this page to understand or complete *this* task.
  - Rule of thumb: if removing a link would make the current task impossible to
  finish, that information belongs on the page, not behind the link.
5. **Author the frontmatter.** Every page gets a specific `title` and a one-sentence
  `description` that names the concept (this becomes the meta description and helps
    scoping). Titles describe the *thing*, not the category: "WebSocket configuration"
    → good; "Configuration" → bad. Give the file a meaningful slug
    (`custom-functions.md`, not `page3.md`).

---



## How to structure sections (chunking)

1. **One purpose per section.** Each `##`/`###` answers exactly one question. Don't
  mix installation, configuration, and troubleshooting under one heading — split
    them so each chunk retrieves cleanly. Keep procedures ("how to…") separate from
    reference ("what the options are").
2. **Keep related facts physically close.** A constraint and its consequence go in
  the same paragraph or adjacent ones, so chunking can't separate them. Bad: state
    a limit in section 1 and its handling in section 4. Good: state both together.
3. **Kill backward references.** Delete "as mentioned above," "now that you've done
  X," "with everything configured." These break the moment the section is read
    alone. Replace with the explicit context.
4. **Use a real heading hierarchy.** `#` once (page title), then `##` → `###`, in
  order, reflecting true topic structure. Headings are descriptive and specific.
    Never skip levels or use a heading purely for visual size.
5. **Never leave long, undivided prose — make it granular.** Break any long stretch
  of text into smaller, focused pieces under their own `##` or `###` headings. A
    wall of text buries several distinct answers in one chunk and retrieves poorly.
    Each subsection should be short enough that its heading accurately describes
    everything beneath it. If a section runs past a few paragraphs, or starts drifting
    into a second idea, split it and give the new part its own descriptive H2/H3.
    Prefer more, well-labeled subsections over fewer long ones.
6. **Give each variation its own section.** When documenting multiple methods,
  modes, or versions (e.g. `buildFromArray` vs `buildFromSheets` vs `buildEmpty`),
    write a labeled section per variation rather than interleaving them.

---



## Language & terminology

1. **Write plainly.** Aim for a ~6th–7th-grade reading level: short sentences, one
  idea each. Simple prose reduces both human confusion and AI misinterpretation.
2. **Use active voice.** "HyperFormula evaluates the formula," not "the formula is
  evaluated."
3. **One term per concept, everywhere.** Pick the canonical term and never drift.
  HyperFormula-specific vocabulary to keep consistent: *instance* (not "object"),
    *sheet*, *cell address*, *named expression*, *formula*, *custom function*,
    *config/options object*. Don't alternate "config" / "settings" / "options" for
    the same thing.
4. **Keep a glossary and spell out acronyms on first use** on each page — "Abstract
  Syntax Tree (AST)", "Cyclic Reference (CREF)". Link related glossary terms.
5. **One language per page.** Write docs in English; do not interleave other natural
  languages. (This is about prose, not about supporting HyperFormula's 17 formula
    locales — those are a documented feature.)
6. **State everything explicitly; assume no prior knowledge.** List prerequisites
  inside the procedure instead of assuming setup. If a step depends on an external
    tool or concept, give one line of context or a link. The AI cannot infer what you
    didn't write.

---



## Code examples

Code is the primary content of these docs. Models reproduce complete examples well
and hallucinate the parts you omit.

1. **Make every example complete and runnable.** Include imports, instance creation
  with the `licenseKey` (a required, commonly-missed step —
    `HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' })`), the data setup, the call,
    and how to read the result. No fragments that assume invisible surrounding code.
2. **Show where code lives when structure matters** — a filename comment
  (`// src/calc.ts`) or a short file tree for multi-file examples, so the reader can
    place it correctly.
3. **Tag every code block with its language** (````javascript`, ````ts`,
  ````bash`). Never use an untagged fence.
4. **Use consistent, correct API shapes.** Cell addresses use a fixed property order
  every time — `{ sheet, row, col }` — don't reorder it between examples. Prefer the
    real method names (`setCellContents`, `getCellValue`, `addSheet`, `getSheetId`,
    `addNamedExpression`). When a runnable demo exists, link the StackBlitz for the
    matching version branch.
5. **Show the correct way; show a wrong way only when it prevents a frequent
  mistake.** If you include an anti-pattern, label it clearly ("Don't do this —
    it throws because…") so it can't be mistaken for a recommendation.

---



## Visuals, tables & the "why"

1. **Never put information only in an image, diagram, or video.** Assistants can't
  read pixels reliably. Put the same information in text next to the visual. Add a
    descriptive caption to every image.
2. **Write UI/interactive flows as numbered, literal steps** — name the exact method,
  option, or button and what it does at each step, so the steps stand without the
    screenshot.
3. **Keep diagrams simple:** one diagram per concept, readable labels, no vertical
  text, and represent multi-step workflows as a numbered list *in addition to* any
    flowchart.
4. **Tables: simple and self-describing.** Real header rows, one fact per cell, each
  row understandable on its own. Avoid merged cells or layouts where meaning comes
    from visual position — convert those to structured lists or sub-sections. If a
    table is only decorative grouping, use headings instead.
5. **Explain the "why," not just the "what."** Document intent, design decisions, and
  when to use a pattern — the context source code alone doesn't convey. Call out
    edge cases, gotchas, and common mistakes with their resolution (e.g. why
    `buildEmpty` needs a `licenseKey`, when to use named expressions vs. cell
    references, precision/rounding caveats).

---



## VuePress conventions (so your output fits the site)

- Start each page with frontmatter:
  ```yaml
  ---
  title: Custom functions
  description: Register and use your own functions in HyperFormula.
  ---
  ```
- Add a `tags` frontmatter **list** to make a page findable by words it does not use in
its title or its `##`/`###` headings — the search box matches those three things only,
never the body text (see `docs/guide/setup-coding-agent.md`, tagged `skills`, `Cursor`,
`MCP`). A plain string instead of a list breaks the search box site-wide.
- Use containers for asides: `::: tip`, `::: warning`, `::: danger` … `:::`. Put
essential steps in the body, not hidden inside a tip.
- Use **relative links** between guide pages (`./named-expressions.md`) and link to
API symbols under `/docs/api/`.
- Leave the auto-generated "Help us improve this page" edit link and sidebar to
VuePress — don't hand-write navigation.
- Don't hand-edit `docs/api/**` — it's generated from TSDoc in the source.

---




## Self-review checklist (run before finishing any page)

- [ ] **Stands alone:** a reader who lands here cold, seeing only this page, can
  ```
  finish the task without opening another page.
  ```
- [ ] **One question per section**, descriptive headings, hierarchy in order.
- [ ] **No walls of text:** long prose is broken into granular H2/H3 subsections,
  ```
  each short enough that its heading covers everything under it.
  ```
- [ ] **Product named** in the body; no bare "the library/the method/the grid."
- [ ] **No backward references** ("as above," "now that you've…").
- [ ] **Prerequisites stated explicitly**; nothing assumed.
- [ ] **Terminology consistent** with the canonical terms; acronyms expanded once.
- [ ] **Every code block** is language-tagged, complete, includes the `licenseKey`,
  ```
  and would actually run; cell-address property order is `{ sheet, row, col }`.
  ```
- [ ] **No info trapped in images/tables**; visuals have text equivalents and captions.
- [ ] **Frontmatter** has a specific `title` and a one-sentence `description`.
- [ ] **No contradiction** with other pages; old facts updated everywhere.
- [ ] **"Why" is covered:** intent, when-to-use, and known gotchas — not just syntax.
- [ ] Would an AI assistant quoting *only this page* give a correct, complete answer?
  ```
  If not, fix the page.
  ```
