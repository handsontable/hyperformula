# Sensitive information

The repository, its pull requests and issues, and the documentation built from it are public. This page says what must never appear in any of them. It binds everyone who writes here: the team, external contributors, and the AI agents they run.

## Where it applies

Never write sensitive information into code, comments, tests, commit messages, branch names, pull request titles or descriptions, GitHub issues or comments, changelog entries, or documentation pages.

## What counts as sensitive

- **Clients, customers, and partners** — their names, and details that identify them indirectly: their domains, their deployments, the wording of their reports.
- **Personal data of any kind** — names, e-mail addresses, phone numbers, user accounts, IP addresses.
- **Credentials and secrets** — API keys, tokens, passwords, licence keys, private URLs.
- **Internal-only material** — the contents of private repositories and internal tickets, unreleased plans, contract and pricing details.

Nothing internal goes into the public documentation either — the guides in `docs/` and the JSDoc the API reference is generated from. That covers contract details, internal validation mechanisms, and internal tooling.

## Describe the change on its own terms

Describe the change on its own technical terms: write "fix an off-by-one error in `SUMIFS` when the criteria range is empty", not "fix the bug reported by \<company\>". An internal ticket identifier such as `HF-123` is fine on its own; the contents of that ticket are not.
