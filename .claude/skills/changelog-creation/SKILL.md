---
name: changelog-creation
description: Use when a change to source code needs a changelog entry, and before pushing any bug fix, feature, or behaviour change. Covers when an entry is required, which section it belongs in, how to write the title, and the link format.
---

## When an entry is required

Every pull request that changes source code needs one: bug fixes, new features, behaviour changes, deprecations, removals, security fixes, and new or changed language packs.

**Not required for:** documentation-only changes (guides, JSDoc, README), test-only changes, and CI or tooling changes.

Also not required when the bug being fixed was introduced **and never released** — the regression never reached users, so there is nothing to document.

## Where it goes

`CHANGELOG.md`, under `## [Unreleased]`, in the section matching the change. The format is [Keep a Changelog](https://keepachangelog.com/en/1.0.0/); the project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Create the `### <Section>` heading under `## [Unreleased]` if it does not exist yet. Section order follows the released blocks above.

| Section | Use for |
|---|---|
| `### Added` | A wholly new capability — a function, an option, a language pack, an API method |
| `### Changed` | Modified behaviour of something that already existed |
| `### Fixed` | A bug fix |
| `### Deprecated` | Scheduled for removal |
| `### Removed` | Already removed in this release |
| `### Security` | A vulnerability fix |

## The format

One bullet per change, ending with a link to the pull request or the issue it resolves:

```markdown
- Fixed the `MOD` function returning a remainder with the sign of the dividend instead of the sign of the divisor, which made the results differ from Excel and Google Sheets for arguments with opposite signs (e.g. `=MOD(-3, 12)` now returns `9` instead of `-3`). [#1747](https://github.com/handsontable/hyperformula/issues/1747)
```

- Link the **public GitHub issue** when one exists; otherwise link the pull request.
- The link needs the PR number, so write the entry after `gh pr create` returns the URL.

## Writing the title

- **From the user's perspective.** Describe what changed for someone using HyperFormula, not what you changed in the code.
- **Past tense, starting with the verb**: "Added…", "Fixed…", "Changed…", "Removed…".
- **Be specific.** "Fixed a bug" tells nobody anything. Name the function, the option, or the operation, and say what it does now.
- **Show the difference when a value changed.** `=MOD(-3, 12)` now returns `9` instead of `-3` is worth more than a paragraph of prose.
- **No internal identifiers.** No class names, no file paths, no private ticket contents. An identifier such as `HF-123` is fine on its own; what is in that ticket is not.
- **No client, customer, or partner names**, and nothing that identifies them indirectly.
- End with a period, then the link.

## Breaking changes

Say what breaks and what to do instead, in the entry itself. A breaking change also needs a migration-guide section — the changelog entry is not a substitute.

## Checklist

1. Confirm the change needs an entry at all.
2. Pick the section; create it under `## [Unreleased]` if absent.
3. Write one user-facing bullet, past tense, specific.
4. Append the issue link, or the PR link when there is no issue.
5. Confirm no sensitive or internal information appears in it.
