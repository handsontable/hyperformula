# Contributing

You are welcome to contribute to HyperFormula's development. Your help
is much appreciated in any of the following topics:

* Making pull requests
  * Adding new functions
  * Adding new features
  * Improving the quality of the existing code
  * Improving performance
  * Improving documentation and public API
* Reporting bugs
* Suggesting improvements
* Suggesting new features

## Good first issue

Adding a new function would be a huge help for the growth of the
library and should not be too problematic for a first issue. Extending the
library of translations is also a good task to start with.
[Here](https://docs.google.com/spreadsheets/d/1UUskn4ZDDjLGSpO6kg73DOvabNoeqLbkJYyVfLyYlYw)
you can find a list of function translations.

Visit the [building](building.md) section to
get more info about the development process and check the list of commands you
can run in this project. Check the `/i18n`
folder in the project - all translations are kept there.
For the functions see the `interpreter/plugin` folder. Both of them
are a good starting point.

## How to get started

1. First, sign the [Contributor License Agreement](#contributor-license-agreement)
to allow us to use and publish your changes.
2. Always make your changes on a separate branch. This will speed up
the merging process.
3. Always make the target of your pull request the `develop` branch,
not `master`.
4. For any change you make, add test specs to the `test` folder.
5. Please lint the code. See the section about using linter.
6. Add a comprehensive description of all the changes.

## Contributor License Agreement

Handsoncode publishes the code it merges — in open-source releases and in
commercial products. Doing that requires the right to use, relicense, and
distribute your contribution, and the Contributor License Agreement (CLA) is the
record of that permission. You keep the copyright to your work; the CLA grants
Handsoncode a licence to it.

**Sign it once, for every project.** The signature is recorded against your
GitHub account, not against a repository, and covers both
[HyperFormula](https://github.com/handsontable/hyperformula) and
[Handsontable](https://github.com/handsontable/handsontable). If you have
already signed for either one, you are done.

**Sign here:
[cla-gate.handsontable-sandbox.workers.dev/sign](https://cla-gate.handsontable-sandbox.workers.dev/sign)**
— the [process is explained in
full](https://cla-gate.handsontable-sandbox.workers.dev/) on the same site.

How it works on your pull request:

1. You open a PR. A GitHub App looks up your GitHub login and sets the
`cla/signed` status check.
2. If you have not signed, the check fails and a bot comments with your signing
link.
3. Open the link, authenticate with GitHub, read the agreement, and submit the
form.
4. The check turns green — on this PR and on any other open PR of yours, in
either repository.

`cla/signed` is a **required check**, so an unsigned PR cannot be merged.
Members of the `handsontable` GitHub organization and known bots are exempt.

Signature records are stored in Cloudflare D1 in the EU. For a correction to
your record or an erasure request, email
[support@handsontable.com](mailto:support@handsontable.com).

Reviewers: there is nothing to verify by hand — the required check is the
verification. Never merge a PR whose `cla/signed` check is red, and do not work
around it.

## Code of conduct

By participating in this project, you are expected to uphold our
[Code of Conduct](code-of-conduct.md).