const highlight = require('./highlight');
const regexPlugin = require('markdown-it-regex').default;
const footnotePlugin = require('markdown-it-footnote');
const searchBoxPlugin = require('./plugins/search-box');
const examples = require('./plugins/examples/examples');
const HyperFormula = require('../../dist/hyperformula.full');
const fs = require('fs');
const path = require('path');

// HF-282: count HF built-in languages from `src/i18n/languages` (source of truth): one module
// per shipped language, next to the `index.ts` export barrel. Counted by listing the directory
// rather than by matching `export {default as xxYY}` lines in the barrel, so the total cannot
// depend on how those lines are punctuated: `export { default as ukUA }` is the same export to
// TypeScript, but a regex anchored on the brace spacing misses it and then quietly publishes a
// stale total with every check below still green. Read once at config load — no dist/
// dependency, so it resolves identically in `docs:dev` and `docs:build`.
const languagesDir = path.resolve(__dirname, '../../src/i18n/languages');
const languageCodes = fs.readdirSync(languagesDir)
  .filter((file) => file.endsWith('.ts') && !file.endsWith('.d.ts') && file !== 'index.ts')
  .map((file) => path.basename(file, '.ts'));
const languagesCount = languageCodes.length;
if (!languagesCount) {
  throw new Error(`HF-282: derived languagesCount is 0 — no language modules found in ${languagesDir}; check the path in docs/.vuepress/config.js.`);
}
// Listing the directory counts what is *present*, and only the barrel decides what actually
// ships, so a module nobody re-exported would overstate the total. Cross-check by language code
// (no brace matching, so barrel formatting stays irrelevant) and fail loudly on the mismatch.
const languagesBarrel = fs.readFileSync(path.join(languagesDir, 'index.ts'), 'utf8');
const unexportedLanguages = languageCodes.filter((code) => !new RegExp(`\\bdefault as ${code}\\b`).test(languagesBarrel));
if (unexportedLanguages.length) {
  throw new Error(`HF-282: language modules present in src/i18n/languages/ but not re-exported from index.ts, so they do not ship and must not be counted: ${unexportedLanguages.join(', ')} — add them to the barrel, or remove the files.`);
}

// HF-282: the root README.md is rendered by GitHub and npm, not VuePress, so it cannot
// use the `{{ $page.languagesCount }}` interpolation and states the count literally.
// Assert it against the count derived above so it cannot rot unnoticed — it already did once, when
// the Indonesian pack (#1674) left the README saying 17. The function count needs no
// such check: "over 400" stays true as functions are added.
//
// The claim under test is one specific line: the features bullet linking to the i18n guide. Matched
// there rather than loose against the whole file, because `String.match` without /g returns the
// first hit anywhere — inside a fenced example, or in a sentence about an older release — and would
// then report a number from a line that was never the claim, sending the reader to correct text
// that is already right. Fenced blocks are skipped for the same reason.
const readmeLanguagesClaims = [];
let inReadmeFence = false;
for (const line of fs.readFileSync(path.resolve(__dirname, '../../README.md'), 'utf8').split('\n')) {
  if (/^\s*(```|~~~)/.test(line)) {
    inReadmeFence = !inReadmeFence;
    continue;
  }
  if (inReadmeFence || !line.startsWith('- ') || !line.includes('guide/i18n-features')) {
    continue;
  }
  const match = line.match(/(\d+) built-in languages/);
  if (match) {
    readmeLanguagesClaims.push(match[1]);
  }
}
if (readmeLanguagesClaims.length !== 1) {
  throw new Error(`HF-282: expected exactly one README.md features bullet linking to the i18n guide and stating "<n> built-in languages", found ${readmeLanguagesClaims.length} — if the wording changed on purpose, update this check in docs/.vuepress/config.js.`);
}
if (Number(readmeLanguagesClaims[0]) !== languagesCount) {
  throw new Error(`HF-282: README.md says ${readmeLanguagesClaims[0]} built-in languages but src/i18n/languages/ ships ${languagesCount} — update README.md.`);
}

// HF-282: the function total. Derived from `getAvailableFunctions` on a default-config engine —
// the same API, and the same engine options, as `script/generate-builtin-functions-doc.ts`, so the
// total and the rows of the page it heads cannot describe different function sets. Default-config
// is the point: `functionPlugins` restrictions would give a narrower count than the generated
// table. The GPLv3 key only keeps the build quiet — a keyless engine logs a missing-key warning —
// but see the LICENSE_KEY note in that script for why it has to stay the fully-entitled one.
// Built once here, not per page: `extendPageData` runs for every page and the count is invariant.
const functionsCount = HyperFormula
  .buildEmpty({language: 'enGB', licenseKey: 'gpl-v3'})
  .getAvailableFunctions().length;

const includeCodeSnippet = require('./plugins/markdown-it-include-code-snippet');
const mdCompanions = require('./plugins/md-companions');

const searchPattern = new RegExp('^/api', 'i');
// Pages generated at build time have no editable source file in the repository, so the "edit this page" link would
// point at a path that does not exist. The built-in functions page is spliced together from
// built-in-functions.tmpl.md and the function metadata catalogue (see docs/README.md).
// Anchored, so a hand-written sibling page (e.g. /guide/built-in-functions-faq) keeps its edit link.
const generatedPagePattern = new RegExp('^/guide/built-in-functions(\\.html)?$', 'i');

// Build configuration (override via env vars or docs/.vuepress/build.config.js)
const buildConfigOverrides = (() => {
  try {
    return require('./build.config.js');
  } catch (e) {
    return {};
  }
})();

const normalizeBase = (b) => {
  if (!b) return '/';
  let v = b.startsWith('/') ? b : '/' + b;
  if (!v.endsWith('/')) v += '/';
  return v;
};

const DOCS_BASE = normalizeBase(process.env.DOCS_BASE || buildConfigOverrides.base || '/');
const DOCS_DEST = process.env.DOCS_DEST || buildConfigOverrides.dest || 'docs/.vuepress/dist';
const DOCS_HOSTNAME = process.env.DOCS_HOSTNAME || buildConfigOverrides.hostname || 'https://hyperformula.handsontable.com';

module.exports = {
  // Default page globs, minus the built-in-functions template: it is the INPUT of docs:generate-function-docs,
  // not a page, and without this exclusion VuePress would publish it as a duplicate, table-less
  // /guide/built-in-functions.tmpl.html (also polluting the sitemap, search index, and llms.txt corpus).
  patterns: ['**/*.md', '**/*.vue', '!guide/built-in-functions.tmpl.md'],
  title: 'HyperFormula (v' + HyperFormula.version + ')',
  description: 'HyperFormula is an open-source, high-performance calculation engine for spreadsheets and web applications.',
  head: [
    // Import HF (required for the examples)
    [ 'script', { src: 'https://cdn.jsdelivr.net/npm/hyperformula/dist/hyperformula.full.min.js' } ],
    [ 'script', { src: 'https://cdn.jsdelivr.net/npm/hyperformula/dist/languages/enUS.js' } ],
    [ 'script', { src: 'https://cdn.jsdelivr.net/npm/hyperformula/dist/languages/frFR.js' } ],
    // Import moment (required for the examples)
    [ 'script', { src: 'https://cdn.jsdelivr.net/npm/moment/moment.min.js' } ],
    // Google Tag Manager, an extra element within the `ssr.html` file.
    ['script', {}, `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','GTM-N59TZXR');
    `],
    // Google Console
    ['meta', { name: 'google-site-verification', content: 'MZpSOa8SNvFLRRGwUQpYVZ78kIHQoPVdVbafHhJ_d4Q' }],
    // Sentry monitoring
    [
      'script', {}, `
        window.sentryOnLoad = function () {
          Sentry.init({
            integrations: [
              // If you use a bundle with performance monitoring enabled, add the BrowserTracing integration
              new Sentry.BrowserTracing(),
              // If you use a bundle with session replay enabled, add the SessionReplay integration
              new Sentry.Replay({
                maskAllText: false,
                blockAllMedia: false,
              }),
            ],
          });
        };
    `],
    [
      'script',
      {
        id: 'Sentry.io',
        src: 'https://js.sentry-cdn.com/50617701901516ce348cb7b252564a60.min.js',
        crossorigin: 'anonymous',
      },
    ],
    // Favicon
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon/apple-touch-icon.png' }],
    ['link', { rel: 'icon', sizes: '32x32', type: 'image/png', href: '/favicon/favicon-32x32.png' }],
    ['link', { rel: 'icon', sizes: '16x16', type: 'image/png', href: '/favicon/favicon-16x16.png' }],
    ['link', { rel: 'manifest', href: '/favicon/site.webmanifest' }],
    ['link', { rel: 'mask-icon', color: '#ffffff', href: '/favicon/safari-pinned-tab.svg' }],
  ],
  base: DOCS_BASE,
  dest: DOCS_DEST,
  plugins: [
    ['sitemap', {
      hostname: DOCS_HOSTNAME,
      exclude: ['/404.html'],
      changefreq: 'weekly'
    }],
    [mdCompanions, { hostname: DOCS_HOSTNAME }],
    searchBoxPlugin,
    ['container', examples()],
    {
      extendPageData ($page) {
        // inject current HF version as {{ $page.version }} variable
        $page.version = HyperFormula.version
        // inject current HF buildDate as {{ $page.buildDate }} variable
        $page.buildDate = HyperFormula.buildDate
        // inject current HF buildDate URI encoded as {{ $page.buildDateURIEncoded }} variable
        $page.buildDateURIEncoded = encodeURIComponent(HyperFormula.buildDate)
        // inject current HF releaseDate as {{ $page.releaseDate }} variable
        $page.releaseDate = HyperFormula.releaseDate
        // inject current HF function count as {{ $page.functionsCount }} variable
        $page.functionsCount = functionsCount
        // inject current HF built-in language count as {{ $page.languagesCount }} variable
        $page.languagesCount = languagesCount

        if (searchPattern.test($page.path) || generatedPagePattern.test($page.path)) {
          $page.frontmatter.editLink = false
        }
      },
      chainMarkdown (config) {
        // inject custom markdown highlight with our aliases to formula syntax
        config
          .options
          .highlight(highlight)
          .end()
      }
    },
  ],
  markdown: {
    extendMarkdown: md => {
      md.use(regexPlugin, {
        name: 'Replace HT_BUILD_DATE',
        regex: /(process\.env\.HT_BUILD_DATE as string)/,
        replace: () => `'${HyperFormula.buildDate}'`
      })
      md.use(regexPlugin, {
        name: 'Replace HT_VERSION',
        regex: /(process\.env\.HT_VERSION as string)/,
        replace: () => `'${HyperFormula.version}'`
      })
      md.use(regexPlugin, {
        name: 'Replace HT_RELEASE_DATE',
        regex: /(process\.env\.HT_RELEASE_DATE as string)/,
        replace: () => `'${HyperFormula.releaseDate}'`
      })
      md.use(footnotePlugin)
      md.use(includeCodeSnippet)
    }
  },
  // TODO: It doesn't work. It's seems that this option is bugged. Documentation says that this option is configurable,
  // but I can't do it. Resolving priority described here: https://github.com/vuejs/vuepress/issues/882#issuecomment-425323104
  // seems not working properlt. I've uploaded `ssr.html` file to `.vuepress/template` dictionary.
  // ssrTemplate: 'index.ssr.html',
  themeConfig: {
    logo: '/logo.png',
    nextLinks: true,
    prevLinks: true,
    repo: 'handsontable/hyperformula',
    docsRepo: 'handsontable/hyperformula',
    docsDir: 'docs',
    docsBranch: 'master',
    editLinks: true,
    editLinkText: 'Help us improve this page',
    lastUpdated: false,
    smoothScroll: false,
    searchPlaceholder: 'Search...',
    searchLimitApi: 10,
    searchLimitGuide: 10,
    nav: [
      { text: 'Guide', link: '/' },
      { text: 'API Reference', link: '/api/' },
    ],
    displayAllHeaders: false, // collapse other pages
    activeHeaderLinks: true,
    sidebarDepth: 1,
    sidebar: {
      '/api/': [
        {
          title: 'API Reference Overview',
          path: '/api/',
        },
        {
          title: 'HyperFormula',
          path: '/api/classes/hyperformula',
          collapsable: true,
        },
        {
          title: 'ConfigParams ',
          path: '/api/interfaces/configparams',
          collapsable: true,
        },
        {
          title: 'Listeners',
          path: '/api/interfaces/listeners',
          alias: '/api/events',
          collapsable: true,
        },
      ],
      '/': [
        {
          title: 'Introduction',
          collapsable: false,
          children: [
            ['/', 'Welcome'],
            ['/guide/demo', 'Demo'],
          ]
        },
        {
          title: 'Getting started',
          collapsable: false,
          children: [
            ['/guide/client-side-installation', 'Client-side installation'],
            ['/guide/server-side-installation', 'Server-side installation'],
            ['/guide/basic-usage', 'Basic usage'],
            ['/guide/advanced-usage', 'Advanced usage'],
            ['/guide/configuration-options', 'Configuration options'],
            ['/guide/license-key', 'License key'],
            ['/guide/setup-coding-agent', 'Set up your coding agent'],
          ]
        },
        {
          title: 'Integrations',
          collapsable: false,
          children: [
            ['/guide/integration-with-react', 'Integration with React'],
            ['/guide/integration-with-vue', 'Integration with Vue'],
            ['/guide/integration-with-angular', 'Integration with Angular'],
            ['/guide/integration-with-svelte', 'Integration with Svelte'],
            ['/guide/ai-sdk', 'Integration with Vercel AI SDK'],
            ['/guide/integration-with-langchain', 'Integration with LangChain'],
            ['/guide/mcp-server', 'HyperFormula MCP Server'],
          ]
        },
        {
          title: 'Data operations',
          collapsable: false,
          children: [
            ['/guide/basic-operations', 'Basic operations'],
            ['/guide/batch-operations', 'Batch operations'],
            ['/guide/clipboard-operations', 'Clipboard operations'],
            ['/guide/undo-redo', 'Undo-redo'],
            ['/guide/sorting-data', 'Sorting data'],
          ]
        },
        {
          title: 'Formulas',
          collapsable: false,
          children: [
            ['/guide/specifications-and-limits', 'Specifications and limits'],
            ['/guide/cell-references', 'Cell references'],
            ['/guide/types-of-values', 'Types of values'],
            ['/guide/types-of-errors', 'Types of errors'],
            ['/guide/types-of-operators', 'Types of operators'],
            ['/guide/order-of-precendece', 'Order of precedence'],
            ['/guide/built-in-functions', 'Built-in functions'],
            ['/guide/volatile-functions', 'Volatile functions'],
            ['/guide/named-expressions', 'Named expressions'],
            ['/guide/arrays', 'Array formulas'],
            ['/guide/iterative-calculation', 'Iterative calculation'],
          ]
        },
        {
          title: 'Internationalization',
          collapsable: false,
          children: [
            ['/guide/i18n-features', 'Internationalization features'],
            ['/guide/localizing-functions', 'Localizing functions'],
            ['/guide/date-and-time-handling', 'Date and time handling'],
            ['/guide/currency-handling', 'Currency handling'],
          ]
        },
        {
          title: 'Compatibility',
          collapsable: false,
          children: [
            ['/guide/compatibility-with-microsoft-excel', 'Compatibility with Microsoft Excel'],
            ['/guide/compatibility-with-google-sheets', 'Compatibility with Google Sheets'],
            ['/guide/list-of-differences', 'Runtime differences with Microsoft Excel and Google Sheets'],
          ]
        },
        {
          title: 'Advanced topics',
          collapsable: false,
          children: [
            ['/guide/key-concepts', 'Key concepts'],
            ['/guide/dependency-graph', 'Dependency graph'],
            ['/guide/building', 'Building & testing'],
            ['/guide/custom-functions', 'Custom functions'],
            ['/guide/performance', 'Performance'],
            ['/guide/known-limitations', 'Known limitations'],
            ['/guide/file-import', 'File import'],
          ]
        },
        {
          title: 'Upgrade and migration',
          collapsable: false,
          children: [
            ['/guide/release-notes', 'Release notes'],
            ['/guide/migration-from-0.6-to-1.0', 'Migrating from 0.6 to 1.0'],
            ['/guide/migration-from-1.x-to-2.0', 'Migrating from 1.x to 2.0'],
            ['/guide/migration-from-2.x-to-3.0', 'Migrating from 2.x to 3.0'],
          ]
        },
        {
          title: 'About',
          collapsable: false,
          children: [
            ['/guide/quality', 'Quality & Security'],
            ['/guide/supported-browsers', 'Supported browsers'],
            ['/guide/dependencies', 'Dependencies'],
            ['/guide/licensing', 'Licensing'],
          ]
        },
        {
          title: 'Miscellaneous',
          collapsable: false,
          children: [
            ['/guide/contributing', 'Contributing'],
            ['/guide/code-of-conduct.md', 'Code of conduct'],
            ['/guide/branding', 'Branding'],
            ['/guide/contact', 'Contact'],
          ]
        },
      ],
    },
  }
};
