# release.sh

Local automation for the HyperFormula
[release process](https://app.clickup.com/9015210959/v/dc/8cnjcyf-9495/8cnjcyf-12135).

Usage:

```bash
npm run release -- <command> [options]     # or: bash script/release/release.sh
```

## Command: `code-freeze`

Starts a HyperFormula code freeze. **Previews by default** — prints every command
and changes nothing. Add `--real-run` to actually do it.

```bash
# Preview (dry run) — the default:
npm run release -- code-freeze 2.1.0 2026-08-30

# Do it for real:
npm run release -- code-freeze 2.1.0 2026-08-30 --real-run
```

(The `--` tells npm to pass the rest through to the script. Or run it directly:
`bash script/release/release.sh code-freeze 2.1.0 2026-08-30 --real-run`.)

Arguments are `<version>` (e.g. `2.1.0`) and `<release-date>` in `YYYY-MM-DD`.

### Options

| Flag | Effect |
|------|--------|
| `--real-run` | Actually run the commands. Without it, the script only previews (dry run). |
| `--demos-dir PATH` | Path to your `hyperformula-demos` clone. |
| `--tests-dir PATH` | Path to your `hyperformula-tests` clone. |
| `-h`, `--help` | Show help for this command. |

### What it does

1. `git checkout develop && git pull`, then `npm run test:setup-private` to put
   `test/hyperformula-tests` on an up-to-date `develop`
2. Creates `release/<version>` off develop
3. Sets `version` in `package.json` and `HT_RELEASE_DATE` in `ht.config.js`
4. Wipes `node_modules`, deletes `package-lock.json`, runs `npm i`
5. `npm run bundle-all`, then `npm run test:setup-private` (points
   `test/hyperformula-tests` at a branch matching `release/<version>`), then
   `npm run lint` and `npm run test`
6. Inserts `## [<version>] - <date>` under `## [Unreleased]` in `CHANGELOG.md`
7. **Generates the release notes**: turns that changelog entry into a
   `docs/guide/release-notes.md` entry (`## <version>` +
   `**Release date: Month D, YYYY**` + the same bullets)
8. **Major/minor only:** in `hyperformula-demos` runs `set-hyperformula-version.sh`,
   commits, pushes, and creates the `M.m.x` branch; then find-replaces the
   CodeSandbox demo URLs in `docs/`
9. `git add . && git commit -m <version> && git push -u origin release/<version>`
   (the plain-git equivalent of `git flow release publish`)
10. In `hyperformula-tests`: `git checkout master && git pull origin develop`

### What stays manual

The script finishes by printing these as a highlighted `[ ]` checklist, so they
are hard to miss in the output:

```
  [ ] Post a heads-up about the code freeze in #hyperformula and #release

  During the freeze:
  [ ] Review the documentation changes (GitHub compare)
  [ ] Test the code examples on staging
  [ ] Work with marketing team on the release blog post and social media announcements
```

## Command: `publish`

Placeholder for the later "Release steps" (npm publish, tags, GitHub release,
post-release). Not implemented yet — running it prints a notice and exits.

```bash
npm run release -- publish 2.1.0        # prints "not implemented yet"
```

## Notes

- Dry run is the default; nothing changes until you pass `--real-run`. Wherever
  the script generates or edits content it previews the exact text, fenced by
  `-----` lines, so you can proofread it before the real run: the new
  `CHANGELOG.md` section, the new `release-notes.md` entry, and every
  CodeSandbox URL line it would rewrite (`-` current, `+` replacement).
- If any step fails, the script stops right there, prints which step failed, and
  runs nothing further.
- If `release/<version>` already exists (locally or on origin), the script prints
  a message and does nothing. Delete the branch first if you want to redo the freeze.
- Release notes come straight from the changelog, so keep the `[Unreleased]`
  section tidy during development — that's exactly what becomes the notes.
- The git-flow steps are translated to plain git: `release start` →
  `git checkout -b release/<v> develop`; `release publish` →
  `git push -u origin release/<v>`. (`code-freeze` only covers the *freeze*, so it
  never merges/tags — that's a future command.)

## Adding a command later

Each command is a `cmd_<name>` function plus a line in the `case` at the bottom of
the script, and a `usage_<name>` help function. To add, say, `post-release`: write
`cmd_post_release()`, add `post-release) cmd_post_release "$@" ;;` to the dispatch,
and list it in `usage_top`. (`publish` is already stubbed this way — a good template.)
