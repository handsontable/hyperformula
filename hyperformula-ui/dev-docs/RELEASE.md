# Releasing hyperformula-ui

`hyperformula-ui` is released on its own, by hand, with the steps below. `script/release/release.sh` releases the engine only.

Releasing is maintainer-owned. Do not run any of these steps as part of another task.

Which sections to follow:

| Release | Follow |
|---|---|
| The first one, `0.3.5`, which creates the package on npm | [Before every release](#before-every-release), then [The first release](#the-first-release) |
| Every later one | [Before every release](#before-every-release), then [Release steps](#release-steps) |

## Versions and tags

- The package versions on its own `0.x` line, where any minor release may break. It joins the engine's version later; see [`dev-docs/STRUCTURE.md`](../../dev-docs/STRUCTURE.md#what-the-move-decided).
- The first published version is `0.3.5`.
- A stable version (`0.3.5`, `0.3.6`, `0.4.0`) is published under the `latest` dist-tag, which is what `npm install hyperformula-ui` installs.
- A prerelease (`0.4.0-next.0`, `0.4.0-next.1`) is published under the `next` dist-tag, never `latest`. Before the stable version it leads to, decide which of its prereleases to deprecate with `npm deprecate`.
- Tags carry the package name as a prefix, `hyperformula-ui@0.3.5`, so they never collide with the engine's bare `3.5.0`.
- Every release adds a section to [`CHANGELOG.md`](../CHANGELOG.md).
- The package is unscoped, `hyperformula-ui`, and the `handsoncode` npm organization maintains it, as it does `hyperformula`.

## Name the workspace by path

Run every command from the repository root with `--workspace=hyperformula-ui/packages/core`. A bare `--workspace=hyperformula-ui` also matches workspaces by folder and would act on more than this package.

## Before every release

On your own machine, with Node.js 22 and a clone of this repository:

1. Log in to npm with an account that is a member of the `handsoncode` organization, and check which account is active:

   ```bash
   npm login
   npm whoami
   ```

2. Check that the account may publish the package. For the first release, `npm org ls handsoncode <username>` must show `admin` or `owner`, because only they can give the organization access to a new package. For a later release, the account must appear in:

   ```bash
   npm access list collaborators hyperformula-ui
   ```

If your account has two-factor authentication for publishing, `npm publish` and `npm access grant` ask for a one-time password. Pass it as `--otp=<code>` when they fail without it.

## The first release

Do this once, when `hyperformula-ui` does not exist on npm yet. It publishes `0.3.5` under `latest` and gives the organization access.

1. Check that the name is still free:

   ```bash
   npm view hyperformula-ui
   ```

   It must fail with `E404`. If it prints a package, someone else owns the name: stop and do not publish.

2. Run every one of the [Release steps](#release-steps) below, with `VERSION=0.3.5` and `TAG=latest`. Step 8 creates the package, owned by your npm account alone.

3. Find the `handsoncode` team that maintains `hyperformula`:

   ```bash
   npm team ls handsoncode
   npm access list packages handsoncode:<team>
   ```

   Pick the team whose list includes `hyperformula` with `read-write`.

4. Give that team write access to the new package:

   ```bash
   npm access grant read-write handsoncode:<team> hyperformula-ui
   ```

   A permission error means your account is not an `admin` or `owner` of `handsoncode`; ask one to run this command.

5. Check the result:

   ```bash
   npm access list packages handsoncode:<team>
   npm view hyperformula-ui dist-tags
   ```

   The first must list `hyperformula-ui` with `read-write`. The second must show `latest: 0.3.5`.

Later releases skip this section and follow the [Release steps](#release-steps) only.

## Release steps

For every release, the first one included.

1. Set the version and the dist-tag for this release in your shell. The commands below read them:

   ```bash
   VERSION=0.3.5   # the next version; npm view hyperformula-ui versions lists the published ones
   TAG=latest      # latest for a stable version, next for a prerelease such as 0.4.0-next.0
   ```

2. Start from an up-to-date `develop` with a clean install:

   ```bash
   git checkout develop
   git pull
   npm ci
   ```

3. Build and check everything:

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

4. Set the version, without a tag yet:

   ```bash
   npm version "$VERSION" --workspace=hyperformula-ui/packages/core --no-git-tag-version
   ```

5. In `hyperformula-ui/CHANGELOG.md`, rename `## [Unreleased]` to `## [<version>] - YYYY-MM-DD`, with today's date, and add a new empty `## [Unreleased]` above it.

6. Commit and tag:

   ```bash
   git add hyperformula-ui/packages/core/package.json hyperformula-ui/CHANGELOG.md package-lock.json
   git commit -m "Release hyperformula-ui $VERSION"
   git tag "hyperformula-ui@$VERSION"
   ```

7. Check the tarball:

   ```bash
   npm pack --dry-run --workspace=hyperformula-ui/packages/core
   npm run check:types --workspace=hyperformula-ui/packages/core
   ```

   The pack lists `LICENSE.txt`, `README.md`, `DOCS.md`, `package.json`, `dist/` and `src/`, and nothing from the shared configuration, the demo or the end-to-end suite. `dist/index.js` and `dist/index.d.ts` must be there. The type check must show no problem for `node16 (from ESM)` or `bundler`.

8. Publish:

   ```bash
   npm publish --workspace=hyperformula-ui/packages/core --tag "$TAG" --access public
   ```

   A published version can never be published again, even after `npm unpublish`. Check step 7 before running this.

9. Check the registry, and push:

   ```bash
   npm view hyperformula-ui dist-tags
   git push origin develop
   git push origin "hyperformula-ui@$VERSION"
   ```

   `$TAG` must point at `$VERSION`. If branch protection rejects the push to `develop`, push the commit on a branch, open a pull request, and merge it with a merge commit so the tagged commit lands unchanged.

On the first release, go back to step 3 of [The first release](#the-first-release).
