/**
 * Starlight sidebar navigation for the HyperFormula docs.
 *
 * Ported from the VuePress `themeConfig.sidebar` tree. Links are site-root
 * relative; Starlight prepends the configured `base` (`/docs`) automatically.
 * The API Reference group is auto-generated from the `api/` content directory
 * (populated by TypeDoc).
 */
export const sidebar = [
  {
    label: 'Introduction',
    items: [
      { label: 'Welcome', link: '/' },
      { label: 'Demo', link: '/guide/demo' },
    ],
  },
  {
    label: 'Getting started',
    items: [
      { label: 'Client-side installation', link: '/guide/client-side-installation' },
      { label: 'Server-side installation', link: '/guide/server-side-installation' },
      { label: 'Basic usage', link: '/guide/basic-usage' },
      { label: 'Advanced usage', link: '/guide/advanced-usage' },
      { label: 'Configuration options', link: '/guide/configuration-options' },
      { label: 'License key', link: '/guide/license-key' },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { label: 'Integration with React', link: '/guide/integration-with-react' },
      { label: 'Integration with Vue', link: '/guide/integration-with-vue' },
      { label: 'Integration with Angular', link: '/guide/integration-with-angular' },
      { label: 'Integration with Svelte', link: '/guide/integration-with-svelte' },
      { label: 'Integration with Vercel AI SDK', link: '/guide/ai-sdk' },
      { label: 'Integration with LangChain', link: '/guide/integration-with-langchain' },
      { label: 'HyperFormula MCP Server', link: '/guide/mcp-server' },
    ],
  },
  {
    label: 'Data operations',
    items: [
      { label: 'Basic operations', link: '/guide/basic-operations' },
      { label: 'Batch operations', link: '/guide/batch-operations' },
      { label: 'Clipboard operations', link: '/guide/clipboard-operations' },
      { label: 'Undo-redo', link: '/guide/undo-redo' },
      { label: 'Sorting data', link: '/guide/sorting-data' },
    ],
  },
  {
    label: 'Formulas',
    items: [
      { label: 'Specifications and limits', link: '/guide/specifications-and-limits' },
      { label: 'Cell references', link: '/guide/cell-references' },
      { label: 'Types of values', link: '/guide/types-of-values' },
      { label: 'Types of errors', link: '/guide/types-of-errors' },
      { label: 'Types of operators', link: '/guide/types-of-operators' },
      { label: 'Order of precedence', link: '/guide/order-of-precendece' },
      { label: 'Built-in functions', link: '/guide/built-in-functions' },
      { label: 'Volatile functions', link: '/guide/volatile-functions' },
      { label: 'Named expressions', link: '/guide/named-expressions' },
      { label: 'Array formulas', link: '/guide/arrays' },
    ],
  },
  {
    label: 'Internationalization',
    items: [
      { label: 'Internationalization features', link: '/guide/i18n-features' },
      { label: 'Localizing functions', link: '/guide/localizing-functions' },
      { label: 'Date and time handling', link: '/guide/date-and-time-handling' },
    ],
  },
  {
    label: 'Compatibility',
    items: [
      { label: 'Compatibility with Microsoft Excel', link: '/guide/compatibility-with-microsoft-excel' },
      { label: 'Compatibility with Google Sheets', link: '/guide/compatibility-with-google-sheets' },
      { label: 'Runtime differences with Microsoft Excel and Google Sheets', link: '/guide/list-of-differences' },
    ],
  },
  {
    label: 'Advanced topics',
    items: [
      { label: 'Key concepts', link: '/guide/key-concepts' },
      { label: 'Dependency graph', link: '/guide/dependency-graph' },
      { label: 'Building & testing', link: '/guide/building' },
      { label: 'Custom functions', link: '/guide/custom-functions' },
      { label: 'Performance', link: '/guide/performance' },
      { label: 'Known limitations', link: '/guide/known-limitations' },
      { label: 'File import', link: '/guide/file-import' },
    ],
  },
  {
    label: 'Upgrade and migration',
    items: [
      { label: 'Release notes', link: '/guide/release-notes' },
      { label: 'Migrating from 0.6 to 1.0', link: '/guide/migration-from-0-6-to-1-0' },
      { label: 'Migrating from 1.x to 2.0', link: '/guide/migration-from-1-x-to-2-0' },
      { label: 'Migrating from 2.x to 3.0', link: '/guide/migration-from-2-x-to-3-0' },
    ],
  },
  {
    label: 'About',
    items: [
      { label: 'Quality', link: '/guide/quality' },
      { label: 'Supported browsers', link: '/guide/supported-browsers' },
      { label: 'Dependencies', link: '/guide/dependencies' },
      { label: 'Licensing', link: '/guide/licensing' },
      { label: 'Support', link: '/guide/support' },
    ],
  },
  {
    label: 'Miscellaneous',
    items: [
      { label: 'Contributing', link: '/guide/contributing' },
      { label: 'Code of conduct', link: '/guide/code-of-conduct' },
      { label: 'Branding', link: '/guide/branding' },
      { label: 'Contact', link: '/guide/contact' },
    ],
  },
  {
    label: 'API Reference',
    collapsed: true,
    autogenerate: { directory: 'api' },
  },
];
