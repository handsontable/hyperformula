# HyperFormula documentation

We treat documentation as an integral part of the HyperFormula developer experience.

View the documentation's latest production version at [hyperformula.handsontable.com](https://hyperformula.handsontable.com/).

**See also:**

- [Documentation standards](./CLAUDE.md) -- authoring rules for humans and AI agents
- [Documentation editing guidelines](./README-EDITING.md) -- practical reference for frontmatter, markdown containers, links, and interactive examples
- [Documentation deployment guidelines](./README-DEPLOYMENT.md) -- Netlify, CI, and the `docs:build` pipeline

## Getting started

The docs site is built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build). **Requires Node 20** (separate from the HyperFormula core's Node version).

1. From the `docs` directory, install dependencies:
   ```bash
   npm install
   ```
2. Start the local docs server:
   ```bash
   npm run dev
   ```
3. In your browser, go to [http://localhost:4321/docs/](http://localhost:4321/docs/).

> **Note:** Content collection files (`.md` under `src/content/docs/`) are cached by Astro's data store. After editing `.md` content files, restart the dev server with `npm run dev -- --force` to invalidate the cache. CSS and component changes are picked up by HMR automatically.

## npm scripts

From the `docs` directory:

- `npm run dev` -- Generates content, then starts the local docs server at `localhost:4321/docs/`.
- `npm run start` -- Alias for `npm run dev`.
- `npm run build` -- Generates content, then builds the production output into `dist/`.
- `npm run preview` -- Previews the built output locally.
- `npm run generate:content` -- Runs `scripts/generate-content.mjs` to populate `src/content/docs/{guide,api}` from the legacy `docs/{guide,api}` trees plus the TypeDoc-generated API reference.
- `npm run test:build` -- Smoke-test the production build via `scripts/test-build.mjs`.
- `npm run docs:lint` -- Runs ESLint on `.js,.mjs,.ts,.astro` files in `src/`.

## Directory structure

```bash
docs/                            # All documentation files
├── astro.config.mjs             # Astro + Starlight configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Docs-only dependencies and scripts
├── CLAUDE.md                    # Documentation authoring standards
├── AGENTS.md                    # → symlink to CLAUDE.md
├── README.md                    # The file you're looking at right now
│
├── src/                         # Astro source
│   ├── components/              # Astro component overrides (Header, Footer, Head, ThemeSelect)
│   ├── content/                 # Generated content collection (build artifact)
│   │   └── docs/                # Starlight content root
│   │       ├── guide/           # Guide pages -- authored here going forward
│   │       ├── api/             # API reference (auto-generated from TypeDoc)
│   │       └── index.md         # Home page
│   ├── content.config.ts        # Content collection schema (extends Starlight's docsSchema)
│   ├── plugins/                 # Build-time plugins (vuepress-preprocessor, docs-data)
│   ├── scripts/                 # Client-side runtime (example-runner, theme-toggle)
│   ├── sidebar.mjs              # Sidebar navigation tree
│   └── styles/                  # CSS partials
│       ├── base/                # Tokens (variables.css)
│       └── components/          # Per-component styles (header, footer, content, interactive-example)
│
├── scripts/                     # Docs build helpers
│   ├── generate-content.mjs     # Populates src/content/docs/ from legacy sources
│   └── test-build.mjs           # Production-build smoke test
│
├── public/                      # Static assets served as-is (logos, images, favicons)
└── examples/                    # Live example source files referenced from `::: example` blocks
```

## Content sources

New guide pages are authored directly in `src/content/docs/guide/`. A legacy `docs/guide/` tree exists from the VuePress era and is scheduled for migration -- it should not receive new content. The API reference under `src/content/docs/api/` is auto-generated from TypeDoc; do not edit those files by hand. See [CLAUDE.md §11](./CLAUDE.md#11-content-sources) for the full set of rules.
