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
      // The build configuration and the typedoc theme, loaded by Node.
      files: ['build.config.js', 'typedoc-theme/**/*.js'],
      env: {
        worker: false,
        node: true,
      },
      parserOptions: {
        sourceType: 'script',
      },
    },
    {
      // The Astro configuration and its Markdown plugins and integrations, loaded by Node as ES modules.
      files: ['astro.config.mjs', 'src/**/*.mjs'],
      env: {
        worker: false,
        node: true,
      },
    },
    {
      // Bundled into the pages by Astro.
      files: ['src/scripts/**/*.mjs'],
      env: {
        node: false,
        browser: true,
      },
    },
  ],
};
