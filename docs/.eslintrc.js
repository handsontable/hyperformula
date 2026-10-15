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
};
