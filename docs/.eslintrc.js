// The documentation portal's own lint configuration. Every directory that is
// linted carries its own; see dev-docs/STRUCTURE.md. The code examples are
// formatted with a separate configuration, examples/eslintrc.examples.js.
module.exports = {
  root: true,
  ignorePatterns: ['.eslintrc.js'],
  env: {
    es2022: true,
    worker: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: ['eslint:recommended'],
  overrides: [
    {
      // The VuePress configuration, plugins and themes, loaded by Node.
      files: ['.vuepress/**/*.js'],
      env: {
        worker: false,
        node: true,
      },
      parserOptions: {
        sourceType: 'script',
      },
    },
    {
      // Bundled into the client by webpack.
      files: [
        '.vuepress/enhanceApp.js',
        '.vuepress/components/**/*.js',
        '.vuepress/plugins/search-box/match-query.js',
      ],
      env: {
        node: false,
        browser: true,
      },
      parserOptions: {
        sourceType: 'module',
      },
    },
  ],
};
