const highlight = require('./highlight');
const regexPlugin = require('markdown-it-regex').default;
const HyperFormula = require('../../dist/hyperformula.full');
const fs = require('fs');
const path = require('path');

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
          title: 'HyperFormula',
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
            ['/guide/changelog', 'Changelog'],
            ['/guide/roadmap', 'Roadmap'],
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
            ['/guide/basic-operations', 'Basic operations'],
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
            ['/guide/types-of-values', 'Types of values'],
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
            ['/guide/localizing-functions', 'Localizing functions'],
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
            ['/guide/custom-functions', 'Custom functions'],
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
