import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import buildConfig from './build.config.js';
import { DOCS_DATA } from './src/docs-data.mjs';
import { docsMarkdownPlugin } from './src/markdown-plugins.mjs';
import { mdCompanions } from './src/md-companions/index.mjs';

/** A base path with exactly one leading and one trailing slash. */
const normalizeBase = (base) => `/${base.replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/');

const base = normalizeBase(process.env.DOCS_BASE || buildConfig.base);
const hostname = process.env.DOCS_HOSTNAME || buildConfig.hostname;

export default defineConfig({
  site: hostname,
  base,
  outDir: `./${process.env.DOCS_DEST || buildConfig.dest}`,
  build: {
    // `guide/basic-usage.html`, as the site has always been served: the Worker resolves extensionless and directory
    // URLs to these files, and every inbound link keeps working.
    format: 'file',
    // `cf/_headers` caches everything under `assets/` as immutable.
    assets: 'assets',
  },
  markdown: {
    processor: satteri({ mdastPlugins: [docsMarkdownPlugin(base)] }),
  },
  integrations: [
    starlight({
      title: `HyperFormula (v${DOCS_DATA.version})`,
      description: 'HyperFormula is an open-source, high-performance calculation engine for spreadsheets and web applications.',
      logo: { src: './public/logo.png' },
      favicon: '/favicon/favicon-32x32.png',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/handsontable/hyperformula' }],
      editLink: { baseUrl: 'https://github.com/handsontable/hyperformula/edit/master/docs/' },
      // The pages live in `guide/` and `api/` and the home page at the root (see `src/content.config.mjs`), not in
      // `src/content/docs/`, so Starlight's asides and heading links have to be enabled for them.
      markdown: { processedDirs: ['.'] },
      customCss: ['./src/styles/custom.css'],
      components: {
        MarkdownContent: './src/components/MarkdownContent.astro',
        PageTitle: './src/components/PageTitle.astro',
      },
      head: [
        // The live examples use the published engine and these globals.
        { tag: 'script', attrs: { src: 'https://cdn.jsdelivr.net/npm/hyperformula/dist/hyperformula.full.min.js' } },
        { tag: 'script', attrs: { src: 'https://cdn.jsdelivr.net/npm/hyperformula/dist/languages/enUS.js' } },
        { tag: 'script', attrs: { src: 'https://cdn.jsdelivr.net/npm/hyperformula/dist/languages/frFR.js' } },
        { tag: 'script', attrs: { src: 'https://cdn.jsdelivr.net/npm/moment/moment.min.js' } },
        // Google Tag Manager
        {
          tag: 'script',
          content: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N59TZXR');`,
        },
        // Google Search Console
        { tag: 'meta', attrs: { name: 'google-site-verification', content: 'MZpSOa8SNvFLRRGwUQpYVZ78kIHQoPVdVbafHhJ_d4Q' } },
        // Sentry
        {
          tag: 'script',
          content: `window.sentryOnLoad = function () {
  Sentry.init({
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay({ maskAllText: false, blockAllMedia: false }),
    ],
  });
};`,
        },
        { tag: 'script', attrs: { id: 'Sentry.io', src: 'https://js.sentry-cdn.com/50617701901516ce348cb7b252564a60.min.js', crossorigin: 'anonymous' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: `${base}favicon/apple-touch-icon.png` } },
        { tag: 'link', attrs: { rel: 'icon', sizes: '16x16', type: 'image/png', href: `${base}favicon/favicon-16x16.png` } },
        { tag: 'link', attrs: { rel: 'manifest', href: `${base}favicon/site.webmanifest` } },
        { tag: 'link', attrs: { rel: 'mask-icon', color: '#ffffff', href: `${base}favicon/safari-pinned-tab.svg` } },
      ],
      sidebar: [
        {
          label: 'Introduction',
          items: [
            { label: 'Welcome', slug: 'index' },
            { label: 'Demo', slug: 'guide/demo' },
          ],
        },
        {
          label: 'Getting started',
          items: [
            { label: 'Client-side installation', slug: 'guide/client-side-installation' },
            { label: 'Server-side installation', slug: 'guide/server-side-installation' },
            { label: 'Basic usage', slug: 'guide/basic-usage' },
            { label: 'Advanced usage', slug: 'guide/advanced-usage' },
            { label: 'Configuration options', slug: 'guide/configuration-options' },
            { label: 'License key', slug: 'guide/license-key' },
            { label: 'Set up your coding agent', slug: 'guide/setup-coding-agent' },
          ],
        },
        {
          label: 'Integrations',
          items: [
            { label: 'Integration with React', slug: 'guide/integration-with-react' },
            { label: 'Integration with Vue', slug: 'guide/integration-with-vue' },
            { label: 'Integration with Angular', slug: 'guide/integration-with-angular' },
            { label: 'Integration with Svelte', slug: 'guide/integration-with-svelte' },
            { label: 'Integration with Vercel AI SDK', slug: 'guide/ai-sdk' },
            { label: 'Integration with LangChain', slug: 'guide/integration-with-langchain' },
            { label: 'HyperFormula MCP Server', slug: 'guide/mcp-server' },
          ],
        },
        {
          label: 'Data operations',
          items: [
            { label: 'Basic operations', slug: 'guide/basic-operations' },
            { label: 'Batch operations', slug: 'guide/batch-operations' },
            { label: 'Clipboard operations', slug: 'guide/clipboard-operations' },
            { label: 'Undo-redo', slug: 'guide/undo-redo' },
            { label: 'Sorting data', slug: 'guide/sorting-data' },
          ],
        },
        {
          label: 'Formulas',
          items: [
            { label: 'Specifications and limits', slug: 'guide/specifications-and-limits' },
            { label: 'Cell references', slug: 'guide/cell-references' },
            { label: 'Types of values', slug: 'guide/types-of-values' },
            { label: 'Types of errors', slug: 'guide/types-of-errors' },
            { label: 'Types of operators', slug: 'guide/types-of-operators' },
            { label: 'Order of precedence', slug: 'guide/order-of-precendece' },
            { label: 'Built-in functions', slug: 'guide/built-in-functions' },
            { label: 'Volatile functions', slug: 'guide/volatile-functions' },
            { label: 'Named expressions', slug: 'guide/named-expressions' },
            { label: 'Array formulas', slug: 'guide/arrays' },
          ],
        },
        {
          label: 'Internationalization',
          items: [
            { label: 'Internationalization features', slug: 'guide/i18n-features' },
            { label: 'Localizing functions', slug: 'guide/localizing-functions' },
            { label: 'Date and time handling', slug: 'guide/date-and-time-handling' },
            { label: 'Currency handling', slug: 'guide/currency-handling' },
          ],
        },
        {
          label: 'Compatibility',
          items: [
            { label: 'Compatibility with Microsoft Excel', slug: 'guide/compatibility-with-microsoft-excel' },
            { label: 'Compatibility with Google Sheets', slug: 'guide/compatibility-with-google-sheets' },
            { label: 'Runtime differences with Microsoft Excel and Google Sheets', slug: 'guide/list-of-differences' },
          ],
        },
        {
          label: 'Advanced topics',
          items: [
            { label: 'Key concepts', slug: 'guide/key-concepts' },
            { label: 'Dependency graph', slug: 'guide/dependency-graph' },
            { label: 'Building & testing', slug: 'guide/building' },
            { label: 'Custom functions', slug: 'guide/custom-functions' },
            { label: 'Performance', slug: 'guide/performance' },
            { label: 'Known limitations', slug: 'guide/known-limitations' },
            { label: 'File import', slug: 'guide/file-import' },
          ],
        },
        {
          label: 'Upgrade and migration',
          items: [
            { label: 'Release notes', slug: 'guide/release-notes' },
            { label: 'Migrating from 0.6 to 1.0', slug: 'guide/migration-from-0.6-to-1.0' },
            { label: 'Migrating from 1.x to 2.0', slug: 'guide/migration-from-1.x-to-2.0' },
            { label: 'Migrating from 2.x to 3.0', slug: 'guide/migration-from-2.x-to-3.0' },
          ],
        },
        {
          label: 'About',
          items: [
            { label: 'Quality & Security', slug: 'guide/quality' },
            { label: 'Supported browsers', slug: 'guide/supported-browsers' },
            { label: 'Dependencies', slug: 'guide/dependencies' },
            { label: 'Licensing', slug: 'guide/licensing' },
          ],
        },
        {
          label: 'Miscellaneous',
          items: [
            { label: 'Contributing', slug: 'guide/contributing' },
            { label: 'Code of conduct', slug: 'guide/code-of-conduct' },
            { label: 'Branding', slug: 'guide/branding' },
            { label: 'Contact', slug: 'guide/contact' },
          ],
        },
        {
          label: 'API Reference',
          items: [
            { label: 'API Reference Overview', slug: 'api' },
            { label: 'HyperFormula', slug: 'api/classes/hyperformula' },
            { label: 'ConfigParams', slug: 'api/interfaces/configparams' },
            { label: 'Listeners', slug: 'api/interfaces/listeners' },
          ],
        },
      ],
    }),
    // Registered here rather than left to Starlight, which then skips its own. Every page is an `.html` file, but
    // Astro reports a page whose name has a dot without the extension (`guide/migration-from-2.x-to-3.0`), and the
    // Worker answers that address with a 404, so the sitemap gets the file name back.
    sitemap({
      serialize(item) {
        const { pathname } = new URL(item.url);

        return pathname.endsWith('/') || pathname.endsWith('.html') ? item : { ...item, url: `${item.url}.html` };
      },
    }),
    mdCompanions({ base, hostname }),
  ],
});
