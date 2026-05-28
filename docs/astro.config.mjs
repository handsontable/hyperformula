import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections';
import starlightThemeRapide from 'starlight-theme-rapide';
import starlightPageActions from 'starlight-page-actions';
import { sidebar } from './src/sidebar.mjs';

// BUILD_MODE is set by the deployment pipeline. Production-only third-party
// scripts (analytics) are injected only when it equals 'production'.
const isProduction = process.env.BUILD_MODE === 'production';

// Host and base path are env-overridable to preserve the existing VuePress
// DOCS_HOSTNAME / DOCS_BASE knobs. The live site is served under `/docs`.
const SITE = process.env.DOCS_HOSTNAME || 'https://hyperformula.handsontable.com';
const BASE = process.env.DOCS_BASE || '/docs';

export default defineConfig({
  site: SITE,
  base: BASE,

  // The dev toolbar adds noise to a docs project; keep it off.
  devToolbar: { enabled: false },

  integrations: [
    starlight({
      title: 'HyperFormula',
      description:
        'HyperFormula is an open-source, high-performance calculation engine for spreadsheets and web applications.',

      favicon: '/favicon/favicon-32x32.png',

      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/handsontable/hyperformula' },
      ],

      editLink: {
        baseUrl: 'https://github.com/handsontable/hyperformula/edit/develop/docs/content/',
      },

      expressiveCode: {
        plugins: [pluginLineNumbers(), pluginCollapsibleSections()],
        themes: ['github-dark', 'github-light'],
      },

      customCss: ['./src/styles/custom.css'],

      head: [
        // Google Search Console verification.
        {
          tag: 'meta',
          attrs: {
            name: 'google-site-verification',
            content: 'MZpSOa8SNvFLRRGwUQpYVZ78kIHQoPVdVbafHhJ_d4Q',
          },
        },
        // Sentry error monitoring (all environments).
        {
          tag: 'script',
          attrs: {
            id: 'Sentry.io',
            src: 'https://js.sentry-cdn.com/50617701901516ce348cb7b252564a60.min.js',
            crossorigin: 'anonymous',
            defer: true,
          },
        },
        // Google Tag Manager (production only).
        ...(isProduction
          ? [
              {
                tag: 'script',
                content:
                  "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-N59TZXR');",
              },
            ]
          : []),
      ],

      sidebar,

      // Apply Handsontable's Rapide theme on top of Starlight; custom CSS in
      // src/styles/* still wins because customCss loads after plugins. The
      // page-actions plugin adds the "Copy Markdown", "Open in ChatGPT",
      // "Open in Claude", and "Edit on GitHub" buttons under the page title.
      plugins: [starlightThemeRapide(), starlightPageActions()],

      components: {
        // Extends the default Head to load Inter + the example runner.
        Head: './src/components/Head.astro',
        // Custom 2-row header: logo + version, search, stars, nav, support.
        Header: './src/components/Header.astro',
        // Custom HT-style footer (links grid + social row).
        Footer: './src/components/Footer.astro',
        // Sun/moon toggle replacing the Auto/Light/Dark <select>.
        ThemeSelect: './src/components/ThemeSelect.astro',
      },
    }),

    sitemap(),
  ],

  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: false,
    },
  },

});
