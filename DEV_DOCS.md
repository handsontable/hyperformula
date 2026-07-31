# Dev Docs

Random notes and things to know useful for maintainers and contributors.

## Definition of Done for the code changes

Each change to the production code (bugfixes, new features, improvements) must include these elements. They must be present in the pull request BEFORE requesting the code review.

- changes to the production code
  - including changes to all supported language packs in `src/i18n/languages` directory (if applicable)
- automatic tests
  - for bugfixes: at least one test reproducing the bug
  - for new features: a set of tests describing the feature specification precisely
  - pull requests from external contributors should include tests in `tests/` directory (they will be moved to the private repository by the internal team)
  - internal team adds tests directly to the private repository (through a separate pull request)
- updates to documentation related to the change
  - for breaking changes: a section in the migration guide
- technical documentation in the form of the jsdoc comments (high-level description of the concepts used in the more complex code fragments)
- changelog entry
- pull request description

## Documentation deployment (Cloudflare Workers)

The documentation site is deployed to Cloudflare Workers as the `hyperformula-docs` Worker in the Handsontable account (`15111272c53ed0aaf84a908f0c9c7f8b`). Deployments are driven by [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), the Git integration configured on the Cloudflare side — the repository holds no deployment workflow, API token or account secret.

| Trigger | Command run by Workers Builds | Result |
| --- | --- | --- |
| push to `master` | `npx wrangler deploy` | production deployment |
| push to any other branch, and every pull request | `npx wrangler versions upload` | preview deployment at `https://<branch>-hyperformula-docs.handsoncode.workers.dev`, posted as a pull request comment |

### Configuration in the repository

- `wrangler.jsonc` — Worker name, asset directory and asset routing.
- `worker/index.js` — resolves directory and extensionless URLs, so that the URL behaviour matches the previous hosting.
- `docs/.vuepress/cf/_headers`, `docs/.vuepress/cf/_redirects` — asset headers and redirects, copied into the root of the build output by `script/prepare-cf-assets.js`.
- `.nvmrc` — Node.js version used by the build.

The asset directory is `docs/.vuepress/dist`, while VuePress writes to `docs/.vuepress/dist/docs` (see `docs/.vuepress/build.config.js`). This keeps the `/docs/` prefix that every document is built with, so the site is served under `https://hyperformula.handsontable.com/docs/`.

Production traffic reaches this Worker through the `hyperformula-website` Worker, which proxies `/docs*` to `https://hyperformula-docs.handsoncode.workers.dev` (the `DOCS_ORIGIN` constant in that project).

### Build settings in the Cloudflare dashboard

One-time setup, under **Workers & Pages > hyperformula-docs > Settings > Build**:

- **Git repository**: `handsontable/hyperformula`, connected through the Cloudflare GitHub App.
- **Production branch**: `master`, with **non-production branch builds** enabled (this is what produces preview URLs and pull request comments).
- **Build command**: `npm run docs:build:cf`
- **Deploy command**: `npx wrangler deploy`
- **Non-production branch deploy command**: `npx wrangler versions upload`

### Deploying by hand

Only needed for debugging; regular deployments go through Workers Builds.

```bash
npm run docs:build:cf     # build the documentation and prepare the asset directory
npx wrangler dev          # serve the built site locally at http://localhost:8787
npm run docs:preview:cf   # upload a preview version (does not touch production)
npm run docs:deploy:cf    # deploy to production
```

## Sources of the function translations

HF supports internationalization and provides the localized function names for all built-in languages. When looking for the valid translations for the new functions, try these sources:
- https://support.microsoft.com/en-us/office/excel-functions-translator-f262d0c0-991c-485b-89b6-32cc8d326889
- http://dolf.trieschnigg.nl/excel/index.php
