# Releasing hyperformula-ui

`hyperformula-ui` is released on its own, by hand, with the steps below. `script/release/release.sh` releases the engine only.

Releasing is maintainer-owned. Do not run any of these steps as part of another task.

## Versions and tags

- The package versions on its own `0.x` line, where any minor release may break. It joins the engine's version later; see [`dev-docs/STRUCTURE.md`](../../dev-docs/STRUCTURE.md#what-the-move-decided).
- A prerelease is published under the `next` dist-tag, never `latest`: `0.1.0-next.0`, `0.1.0-next.1`, and so on.
- Tags carry the package name as a prefix, `hyperformula-ui@0.1.0`, so they never collide with the engine's bare `3.5.0`.
- Every release adds a section to [`CHANGELOG.md`](../CHANGELOG.md).

## Name the workspace by path

Run every command from the repository root with `--workspace=hyperformula-ui/packages/core`. A bare `--workspace=hyperformula-ui` also matches workspaces by folder and would act on more than this package.

## Steps

The example releases `0.1.0-next.0`. Replace the version throughout.

1. Start from an up-to-date `develop` with a clean install:

   ```bash
   git checkout develop
   git pull
   npm ci
   ```

2. Build and check everything:

   ```bash
   npm run build:ui
   git diff --exit-code -- 'hyperformula-ui/**/cssText.ts'
   npm run lint
   npm run bundle-all
   npm run typecheck
   npm run test:ui
   npm run test:e2e
   ```

   `bundle-all` builds the engine, which the demo and the end-to-end suite resolve from this workspace. Stop if anything fails.

3. Set the version, without a tag yet:

   ```bash
   npm version 0.1.0-next.0 --workspace=hyperformula-ui/packages/core --no-git-tag-version
   ```

4. In `hyperformula-ui/CHANGELOG.md`, rename `## [Unreleased]` to `## [0.1.0-next.0] - YYYY-MM-DD` and add a new empty `## [Unreleased]` above it.

5. Commit and tag:

   ```bash
   git add hyperformula-ui/packages/core/package.json hyperformula-ui/CHANGELOG.md package-lock.json
   git commit -m "Release hyperformula-ui 0.1.0-next.0"
   git tag hyperformula-ui@0.1.0-next.0
   ```

6. Copy the licence into the package. `prepack` does this too, but npm skips it when `ignore-scripts` is set, so do not rely on it:

   ```bash
   npm run copy-root-files --workspace=hyperformula-ui/packages/core
   ```

7. Check the tarball:

   ```bash
   npm pack --dry-run --workspace=hyperformula-ui/packages/core
   ```

   It lists `LICENSE.txt`, `README.md`, `DOCS.md`, `package.json`, `dist/` and `src/`, and nothing from the shared configuration, the demo or the end-to-end suite. `dist/index.js` and `dist/index.d.ts` must be there.

8. Publish under `next`:

   ```bash
   npm publish --workspace=hyperformula-ui/packages/core --tag next --access public
   ```

   The first publish creates the package on npm. Use an account in the Handsontable npm organization, then add the organization as the package's owner.

9. Remove the copied licence, check the registry, and push:

   ```bash
   rm hyperformula-ui/packages/core/LICENSE.txt
   npm view hyperformula-ui dist-tags
   git push origin develop
   git push origin hyperformula-ui@0.1.0-next.0
   ```

   If branch protection rejects the push to `develop`, push the commit on a branch, open a pull request, and merge it with a merge commit so the tagged commit lands unchanged.

## A stable release

The same steps without `-next.N` in the version, published with `--tag latest`. Before the first stable release, decide which `next` builds to deprecate with `npm deprecate`.
