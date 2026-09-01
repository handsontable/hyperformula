# Agent tooling

How this repository is configured for AI coding agents. The rules an agent must follow are elsewhere — this page is about the machinery.

## The three layers

| Layer | Answers | Loaded | Rule |
|---|---|---|---|
| `AGENTS.md` | *What is this directory, and where do I look next?* | Always, within its subtree | A pointer of a few lines. Never a place to explain anything. |
| `dev-docs/` | *How does this work and why?* | On demand | **The single source of truth for internal knowledge.** |
| `.claude/skills/` | *How do I do task X?* | On skill trigger | Steps and ordering. Links to `dev-docs/` for the rules. |

`CLAUDE.md` is a symlink to the sibling `AGENTS.md` in every directory that has one, so Claude Code and Cursor read the same file.

**Nothing outside `dev-docs/` restates what is in `dev-docs/`.** An `AGENTS.md`, a `README.md`, or a `SKILL.md` carries only what is so specific to its own context that it would be useless anywhere else; everything else is a link. Two copies of a rule means one of them is wrong within a release, and the reader cannot tell which.

## `.claude/settings.json`

Committed, so every developer gets the same setup.

| Key | Why |
|---|---|
| `enabledPlugins` | `typescript-lsp` — language-server go-to-definition and find-references. Use it instead of grepping for a symbol's definition or callers; grep stays right for text searches. |
| `permissions.deny` | Blocks agent reads of **build artifacts**. They are git-ignored, so content searches already skip them, but nothing otherwise stops an agent opening `dist/hyperformula.js` or answering a behaviour question from `typings/` instead of `hyperformula/src/`. |

**Generated documentation is not a build artifact, and is deliberately readable.** `docs/api/` and `docs/guide/built-in-functions.md` are produced by a build step, but they are the API reference and the function reference — reading them to answer a question is the right move, and `FUNCTION-CATALOGUE.md` links straight into them. The rule is about *artifacts*: bundles, declarations, coverage, and the compiled site. Editing either of those files is still always wrong; that is what the build regenerates.

`node_modules/` and `package-lock.json` are deliberately readable too: reading a dependency's source is sometimes the right move when debugging, and a deny rule would also block a targeted grep for a dependency version.

Relative deny patterns anchor at the session's working directory, and project settings are not inherited from parent directories — these rules apply to sessions started at the repository root.

## Read the repository, not the web

The guides in `docs/guide/` and the generated API reference in `docs/api/` are the same content the documentation portal serves. Read the local files rather than fetching the rendered pages, and read `hyperformula/src/` rather than either when the question is what the code actually does.

## Skills

All skills live in `.claude/skills/`, at the repository root — one directory to look in, one to keep consistent. A skill that belongs to part of the tree is scoped by the `paths` frontmatter field (one glob, or a comma-separated list) rather than by placement. A skill that applies anywhere — writing a changelog entry, opening a pull request, test discipline, reviewing a diff — carries no `paths` and is chosen from its description alone.

A skill holds the **steps**: what to do, in what order, and what to check. It does not restate the rules those steps enforce — it links to the `dev-docs/` page that owns them.

**Step 1 of every skill is "Read the relevant files from `dev-docs/`", and it names them.** Not a general pointer at the directory: a table of the specific pages, each with one line saying why that page matters for this task. Where a task's reference depends on what it touches, the step lists the always-read pages first and then the conditional ones. A skill whose first step is anything else is missing it.

| Skill | For |
|---|---|
| `hyperformula-dev` | Any work in `hyperformula/src/` — the entry point |
| `hyperformula-function-dev` | Adding or changing a built-in function |
| `hyperformula-unit-testing` | Writing or modifying tests |
| `test-writing-discipline` | Any red test, and any test that might be going green for the wrong reason |
| `i18n-translations` | Function-name translations |
| `writing-docs-pages` | The documentation portal |
| `changelog-creation` | The changelog entry |
| `pr-creation` | Opening or updating a pull request |
| `hyperformula-code-review` | Reviewing a diff, a branch, or a pull request |
