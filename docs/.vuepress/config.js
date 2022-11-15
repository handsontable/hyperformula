const highlight = require('./highlight');
const regexPlugin = require('markdown-it-regex').default;
const searchBoxPlugin = require('./plugins/search-box');
const HyperFormula = require('../../dist/hyperformula.full');
const fs = require('fs');
const path = require('path');

const searchPattern = new RegExp('^/api', 'i');

module.exports = {
  title: 'HyperFormula (v' + HyperFormula.version + ')',
  description: 'HyperFormula is an open-source, high-performance calculation engine for spreadsheets and web applications.',
  head: [
    // Google Tag Manager, an extra element within the `ssr.html` file.
    ['script', {}, `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','GTM-N59TZXR');
    `],
    // Google Console
    ['meta', { name: 'google-site-verification', content: 'MZpSOa8SNvFLRRGwUQpYVZ78kIHQoPVdVbafHhJ_d4Q' }]
  ],
  base: '/',
  plugins: [
    searchBoxPlugin,
    // [
    //   'vuepress-plugin-clean-urls',
    //   {
    //     normalSuffix: '',
    //     indexSuffix: '/',
    //     notFoundPath: '/404.html',
    //   },
    // ],
    {
      extendPageData ($page) {
        // inject current HF version as {{ $page.version }} variable
        $page.version = HyperFormula.version
        // inject current HF buildDate as {{ $page.buildDate }} variable
        $page.buildDate = HyperFormula.buildDate
        // inject current HF releaseDate as {{ $page.releaseDate }} variable
        $page.releaseDate = HyperFormula.releaseDate
        // inject current HF function count as {{ $page.functionsCount }} variable
        $page.functionsCount = HyperFormula.getRegisteredFunctionNames('enGB').length

        if (searchPattern.test($page.path)) {
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
          title: 'Introduction',
          path: '/api/',
        },
        {
          title: 'HyperFormula Class',
          path: '/api/classes/hyperformula',
          collapsable: true,
        },
        {
          title: 'Configuration Options',
          path: '/api/interfaces/configparams',
          collapsable: true,
        },
        {
          title: 'Event Types',
          path: '/api/interfaces/listeners',
          alias: '/api/events',
          collapsable: true,
        },
        {
          title: 'Error Types',
          collapsable: true,
          children: fs.readdirSync(path.join(__dirname, '../api/classes'))
            .filter((n) => n.match(/.*error\.md$/))
            .map(f => `/api/classes/${f}`)
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
          title: 'Overview',
          collapsable: false,
          children: [
            ['/guide/supported-browsers', 'Supported browsers'],
            ['/guide/dependencies', 'Dependencies'],
            ['/guide/licensing', 'Licensing'],
            ['/guide/support', 'Support'],
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
          ]
        },
        {
          title: 'Framework integration',
          collapsable: false,
          children: [
            ['/guide/integration-with-react', 'Integration with React'],
            ['/guide/integration-with-vue', 'Integration with Vue'],
            ['/guide/integration-with-angular', 'Integration with Angular'],
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
          ]
        },
        {
          title: 'Internationalization',
          collapsable: false,
          children: [
            ['/guide/i18n-overview', 'Internationalization overview'],
            ['/guide/localizing-functions', 'Localizing functions'],
            ['/guide/date-and-time-handling', 'Date and time handling'],
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
            ['/guide/importing-files', 'Importing XLSX/CSV files'],
          ]
        },
        {
          title: 'Upgrade and migration',
          collapsable: false,
          children: [
            ['/guide/release-notes', 'Release notes'],
            ['/guide/migration-from-0.6-to-1.0', 'Migrating from 0.6 to 1.0'],
            ['/guide/migration-from-1.0-to-2.0', 'Migrating from 1.x to 2.0'],
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
