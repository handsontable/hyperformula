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
| `permissions.deny` | Blocks agent reads of every generated and built path. The build outputs are git-ignored, so content searches already skip them, but nothing otherwise stops an agent opening `dist/hyperformula.js` or answering a behaviour question from `typings/` instead of `src/`. |
| `worktree.symlinkDirectories` | Symlinks `node_modules` into each worktree rather than duplicating it. See [`WORKTREES.md`](WORKTREES.md). |
| `hooks` | The `PostToolUse` lint hook below. |

`node_modules/` and `package-lock.json` are deliberately readable: reading a dependency's source is sometimes the right move when debugging, and a deny rule would also block a targeted grep for a dependency version.

Relative deny patterns anchor at the session's working directory, and project settings are not inherited from parent directories — these rules apply to sessions started at the repository root.

## The `PostToolUse` lint hook

[`script/claude/post-tool-use.mjs`](../script/claude/post-tool-use.mjs), matched on `Edit|Write`. Claude Code passes the tool payload as JSON on stdin; the hook reads `tool_input.file_path`, lints that one file, and exits 2 with the remaining errors on stderr, which Claude Code shows to the agent. ESLint rules are applied while the change is being written rather than when someone runs `npm run lint` at the end.

Three properties to preserve when changing it:

- **Errors only, never warnings.** `npm run lint` reports tens of thousands of warnings across the repository. Reporting them per edit would bury the agent in noise unrelated to the change it just made.
- **`--fix-type problem,layout`.** Never plain `--fix`. `jsdoc/require-jsdoc` is a suggestion-type rule whose autofix inserts an **empty** JSDoc block above every undocumented declaration, so an unconstrained `--fix` quietly scatters those stubs through any file the agent edits. The restriction keeps the fixes that are unambiguously right — the licence header, semicolons, quotes, spacing — and drops the ones that need a human.
- **Fails open.** A missing ESLint binary, a spawn failure, or unparseable output exits 0 silently. A broken hook must never block work.

`script/` is in [`.eslintignore`](../.eslintignore), so the hook is not linted by itself. Verify a change to it by piping a payload in by hand:

```bash
printf '{"tool_name":"Edit","cwd":"'"$PWD"'","tool_input":{"file_path":"src/interpreter/plugin/AbsPlugin.ts"}}' \
  | node script/claude/post-tool-use.mjs; echo "exit=$?"
```

## Skills

All skills live in `.claude/skills/`, at the repository root, and are scoped by the `paths` frontmatter field rather than by placement — one glob, or a comma-separated list. One directory to look in, one directory to keep consistent.

A skill holds the **steps**: what to do, in what order, and what to check. It does not restate the rules those steps enforce — it links to the `dev-docs/` page that owns them.

**Step 1 of every skill is "Read the relevant files from `dev-docs/`", and it names them.** Not a general pointer at the directory: a table of the specific pages, each with one line saying why that page matters for this task. Where a task's reference depends on what it touches, the step lists the always-read pages first and then the conditional ones. A skill whose first step is anything else is missing it.

| Skill | For |
|---|---|
| `hyperformula-dev` | Any work in `src/` — the entry point |
| `hyperformula-function-dev` | Adding or changing a built-in function |
| `hyperformula-unit-testing` | Writing or modifying tests |
| `test-writing-discipline` | Any red test, and any test that might be going green for the wrong reason |
| `i18n-translations` | Function-name translations |
| `writing-docs-pages` | The documentation portal |
| `changelog-creation` | The changelog entry |
| `pr-creation` | Opening or updating a pull request |
| `hyperformula-code-review` | Reviewing a diff, a branch, or a pull request |
