### Context
<!--- Why is this change needed, and what problem does it solve? Write for a reviewer who has not seen the ticket. -->
<!--- Give the rationale and the big picture: the approach you chose and the alternatives you rejected. -->
<!--- Keep this description current as the branch changes. Don't include client names, private links or the contents of internal tickets. -->

### How did you test your changes?
<!--- The commands you ran and what they showed – not "added tests". -->
<!--- Internal team: name the paired branch in `hyperformula-tests`. External contributors: put your tests in `hyperformula/test/`. -->

### Compatibility with Excel and Google Sheets
<!--- List the formulas you checked in real Excel (and in Google Sheets, where relevant) and the results. -->
<!--- If HyperFormula deliberately behaves differently, explain why here and add it to docs/guide/list-of-differences.md. -->
<!--- Write "Not applicable" if the change can't affect calculation results. -->

| Formula | Excel | Google Sheets | HyperFormula |
|---|---|---|---|
|   |   |   |   |

### Public API changes
<!--- List everything added, removed, renamed or changed in the public API: `HyperFormula` methods, configuration options, events, exported types and errors. Write "None" if there are none. -->

### Out of scope and follow-ups
<!--- What this PR deliberately doesn't do, and why. -->
<!--- Problems you found but didn't fix here, each with its follow-up issue or task ID. -->

### Types of changes
<!--- Put an `x` in each box that applies. -->
- [ ] Breaking change (existing functionality no longer works as before) – agreed with the maintainers
- [ ] New feature or improvement (a non-breaking change that adds functionality)
- [ ] Bug fix (a non-breaking change that fixes an issue)
- [ ] Additional language file, or a change to an existing language file (translations)
- [ ] Change to the documentation

### Related issues
<!--- `Fixes #...` for a public issue. You may name a private ticket ID, but not its contents. -->
1. Fixes #...

### Checklist
<!--- If you're unsure about any of these, ask us. We're always glad to help! -->
- [ ] My pull request meets the [Definition of Done](https://github.com/handsontable/hyperformula/blob/develop/dev-docs/DEFINITION-OF-DONE.md). External contributors: see also [Contributing to HyperFormula](https://handsontable.com/docs/hyperformula/guide/contributing.html).
- [ ] I have signed the [Contributor License Agreement](https://goo.gl/forms/yuutGuN0RjsikVpM2).
- [ ] I read my own diff end to end before requesting a review.
- [ ] I added a [CHANGELOG.md](https://github.com/handsontable/hyperformula/blob/develop/CHANGELOG.md) entry, written by [the changelog rules](https://github.com/handsontable/hyperformula/blob/develop/dev-docs/DOC-STANDARDS.md#the-changelog) – or none is needed (docs, tests or tooling only).
- [ ] I updated the documentation and JSDoc to match the change.
- [ ] Breaking change only: I added a section to the migration guide.
- [ ] I updated the `dev-docs/` pages this change affects – or none needed it.
