const highlight = require('./highlight');
const regexPlugin = require('markdown-it-regex').default;
const HyperFormula = require('../../dist/hyperformula.full');
const fs = require('fs');
const path = require('path');

module.exports = {
  title: 'HyperFormula (v' + HyperFormula.version + ')',
  description: 'HyperFormula is an open-source, high-performance calculation engine for spreadsheets and web applications.',
  head: [
    ['meta', { name: 'robots', content: 'noindex,nofollow' }],
  ],
  base: '/hyperformula/',
  plugins: [
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
  themeConfig: {
    logo: '/logo.png',
    nextLinks: true,
    prevLinks: true,
    repo: 'handsontable/hyperformula',
    docsRepo: 'handsontable/hyperformula',
    docsDir: 'docs',
    docsBranch: 'develop',
    editLinks: false,
    lastUpdated: false,
    smoothScroll: false,
    searchPlaceholder: 'Search...',
    // algolia: {
    //   apiKey: '<API_KEY>',
    //   indexName: '<INDEX_NAME>'
    // },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      // { text: 'Functions', link: '/functions/' },
      { text: 'API Reference', link: '/api/' },
    ],
    displayAllHeaders: false, // collapse other pages
    activeHeaderLinks: true,
    sidebarDepth: 3,
    sidebar: {
      '/guide/': [
        {
          title: 'Overview',
          collapsable: false,
          children: [
            ['/guide/overview/supported-browsers', 'Supported browsers'],
            ['/guide/overview/dependencies', 'Dependencies'],
            ['/guide/overview/licensing', 'Licensing'],
            ['/guide/overview/changelog', 'Changelog'],
            ['/guide/overview/roadmap', 'Roadmap'],
            ['/guide/overview/support', 'Support'],
          ]
        },
        {
          title: 'Getting started',
          collapsable: false,
          children: [
            ['/guide/getting-started/client-side', 'Client-side installation'],
            ['/guide/getting-started/server-side', 'Server-side installation'],
            ['/guide/getting-started/basic-usage', 'Basic usage'],
            ['/guide/getting-started/advanced-usage', 'Advanced usage'],
            ['/guide/getting-started/configuration-options', 'Configuration options'],
            ['/guide/getting-started/license-key', 'License key'],
            ['/guide/getting-started/known-limitations', 'Known limitations'],
          ]
        },
        {
          title: 'Framework integration',
          collapsable: false,
          children: [
            ['/guide/framework-integration/integration-with-react', 'Integration with React'],
            ['/guide/framework-integration/integration-with-vue', 'Integration with Vue'],
            ['/guide/framework-integration/integration-with-angular', 'Integration with Angular'],
          ]
        },
        {
          title: 'Data Operations',
          collapsable: false,
          children: [
            ['/guide/data-operations/crud-operations', 'Basic operations'],
            ['/guide/data-operations/batch-operations', 'Batch operations'],
            ['/guide/data-operations/clipboard-operations', 'Clipboard operations'],
            ['/guide/data-operations/undo-redo', 'Undo-redo'],
            ['/guide/data-operations/sorting-data', 'Sorting data'],
          ]
        },
        {
          title: 'Formula Reference',
          collapsable: false,
          children: [
            ['/guide/formula-reference/specifications-and-limits', 'Specifications and limits'],
            ['/guide/formula-reference/cell-references', 'Cell references'],
            ['/guide/formula-reference/types-of-data', 'Types of values'],
            ['/guide/formula-reference/types-of-errors', 'Types of errors'],
            ['/guide/formula-reference/types-of-operators', 'Types of operators'],
            ['/guide/formula-reference/order-of-precendece', 'Order of precedence'],
            ['/guide/formula-reference/built-in-functions', 'Built-in functions'],
            ['/guide/formula-reference/volatile-functions', 'Volatile functions'],
            ['/guide/formula-reference/named-ranges', 'Named ranges'],
          ]
        },
        {
          title: 'Internationalization',
          collapsable: false,
          children: [
            ['/guide/internationalization/culture-definition', 'Localizing functions'],
            ['/guide/internationalization/date-and-time-handling', 'Date and time handling'],
          ]
        },
        {
          title: 'Advanced topics',
          collapsable: false,
          children: [
            ['/guide/advanced-topics/key-concepts', 'Key concepts'],
            ['/guide/advanced-topics/building', 'Building'],
            ['/guide/advanced-topics/testing', 'Testing'],
            ['/guide/advanced-topics/creating-custom-functions', 'Custom functions'],
            ['/guide/advanced-topics/performance', 'Performance'],
          ]
        },
        {
          title: 'Contributing',
          path: '/guide/contributing',
        },

        {
          title: 'Code of conduct',
          path: '/guide/code-of-conduct.md',
        },
        {
          title: 'Branding',
          path: '/guide/branding',
        },
        {
          title: 'Acknowledgments',
          path: '/guide/acknowledgements',
        },
        {
          title: 'Contact',
          path: '/guide/contact',
        },
      ],
      '/api/': [
        {
          title: 'Introduction',
          path: '/api/',
        },
        {
          title: 'HyperFormula',
          path: '/api/classes/hyperformula',
          collapsable: true,
        },
        {
          title: 'Event Types',
          path: '/api/interfaces/listeners',
          alias: '/api/events',
          collapsable: true,
        },
        {
          title: 'Configuration Options',
          path: '/api/interfaces/configparams',
          collapsable: true,
        },
        {
          title: 'Error Types',
          collapsable: true,
          children: fs.readdirSync(path.join(__dirname, '../api/classes'))
            .filter((n) => n.match(/.*error\.md$/))
            .map(f => `/api/classes/${f}`)
        },
        {
          title: 'Globals',
          path: '/api/globals',
        },
      ],
    },
  }
};
