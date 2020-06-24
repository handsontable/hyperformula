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
    logo: '/assets/img/logo.png',
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
      { text: 'Guide', link: '/guide/' },
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
            ['/guide/changelog', 'Changelog'],
            ['/guide/roadmap', 'Roadmap'],
            ['/guide/support', 'Support'],
          ]
        },
        {
          title: 'Getting started',
          collapsable: false,
          children: [
            ['/guide/client-side', 'Client-side installation'],
            ['/guide/server-side', 'Server-side installation'],
            ['/guide/basic-usage', 'Basic usage'],
            ['/guide/advanced-usage', 'Advanced usage'],
            ['/guide/configuration-options', 'Configuration options'],
            ['/guide/license-key', 'License key'],
            ['/guide/known-limitations', 'Known limitations'],
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
          title: 'Data Operations',
          collapsable: false,
          children: [
            ['/guide/crud-operations', 'Basic operations'],
            ['/guide/batch-operations', 'Batch operations'],
            ['/guide/clipboard-operations', 'Clipboard operations'],
            ['/guide/undo-redo', 'Undo-redo'],
            ['/guide/sorting-data', 'Sorting data'],
          ]
        },
        {
          title: 'Formula Reference',
          collapsable: false,
          children: [
            ['/guide/specifications-and-limits', 'Specifications and limits'],
            ['/guide/cell-references', 'Cell references'],
            ['/guide/types-of-data', 'Types of values'],
            ['/guide/types-of-errors', 'Types of errors'],
            ['/guide/types-of-operators', 'Types of operators'],
            ['/guide/order-of-precendece', 'Order of precedence'],
            ['/guide/built-in-functions', 'Built-in functions'],
            ['/guide/volatile-functions', 'Volatile functions'],
            ['/guide/named-ranges', 'Named ranges'],
          ]
        },
        {
          title: 'Internationalization',
          collapsable: false,
          children: [
            ['/guide/culture-definition', 'Localizing functions'],
            ['/guide/date-and-time-handling', 'Date and time handling'],
          ]
        },
        {
          title: 'Advanced topics',
          collapsable: false,
          children: [
            ['/guide/key-concepts', 'Key concepts'],
            ['/guide/building', 'Building'],
            ['/guide/testing', 'Testing'],
            ['/guide/creating-custom-functions', 'Custom functions'],
            ['/guide/performance', 'Performance'],
          ]
        },
        {
          title: 'Miscellaneous',
          collapsable: false,
          children: [
            ['/guide/contributing', 'Contributing'],
            ['/guide/code-of-conduct.md', 'Code of conduct'],
            ['/guide/branding', 'Branding'],
            ['/guide/acknowledgements', 'Acknowledgments'],
            ['/guide/contact', 'Contact'],
          ]
        }
      ],
    },
  }
};
