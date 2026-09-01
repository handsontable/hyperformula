# Tests

This folder contains only simple smoke tests that verify core HyperFormula functionality.

HyperFormula team maintains a comprehensive test suite that includes unit tests run in different environments, compatibility tests, and performance tests.

The full test suite is available on request. To obtain it, contact us at hyperformula@handsontable.com.

## Using the private test suite

The private test suite is kept in the `hyperformula-tests` repository. Once you have access to it, you can use it following this instructions:

Whenenever you switch branch in the main repository, you need to fetch the private test suite to the `test/hyperformula-tests` directory by running:
```
npm run test:setup-private

```

Then, you can run the test by calling one og the commands:

```
npm run test
npm run test:jest
npm run test:browser
npm run test:coverage
npm run test:performance
npm run test:compatibility
```

## `fetch-tests.sh`

This file is located in the `test` directory.

### What it does

1. **Clone if missing** – If `test/hyperformula-tests` does not exist:
   - With `DEPLOY_TOKEN` set: clones via HTTPS using the token
   - Otherwise: clones via SSH (`git@github.com:handsontable/hyperformula-tests.git`)

2. **Detect current branch** – Uses:
   - `GITHUB_HEAD_REF` (pull request source branch)
   - `GITHUB_REF_NAME` (push branch)
   - `git rev-parse --abbrev-ref HEAD` (local), falling back to `develop` on detached HEAD

3. **Checkout matching branch** – In `hyperformula-tests`:
   - Fetches from `origin`
   - Checks out the branch if it exists locally or on `origin`
   - If the branch doesn't exist, creates it from `develop`

4. **Pull latest** – Runs `git pull origin` on the checked-out branch.

### Environment variables

| Variable        | Purpose                                                                 |
|-----------------|-------------------------------------------------------------------------|
| `DEPLOY_TOKEN`  | GitHub token for HTTPS clone (used in CI when SSH is not available)     |
| `GITHUB_HEAD_REF` | Source branch for pull requests (set by GitHub Actions)             |
| `GITHUB_REF_NAME` | Branch/tag that triggered the workflow (set by GitHub Actions)       |
