module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'license-header',
  ],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.test.json',
    createDefaultProgram: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    // Automatic fixers
    '@typescript-eslint/member-delimiter-style': ['error', {
      multiline: {
        delimiter: 'comma',
      },
      singleline: {
        delimiter: 'comma',
      },
    }],
    '@typescript-eslint/camelcase': 'error',
    '@typescript-eslint/semi': ['error', 'never'],
    '@typescript-eslint/brace-style': 'error', // wtf
    '@typescript-eslint/no-unnecessary-boolean-literal-compare': ['error'],
    '@typescript-eslint/no-extra-non-null-assertion': ['error'],
    '@typescript-eslint/array-type': ['error'],
    '@typescript-eslint/space-before-function-paren': ['error', 'never'],
    '@typescript-eslint/quotes': ['error', 'single', { avoidEscape: true }],
    '@typescript-eslint/no-extra-semi': ['error'],
    '@typescript-eslint/comma-spacing': ['error'],
    '@typescript-eslint/func-call-spacing': ['error'],

    // Extensions (superseded by other rules)
    'semi': 'off', // superseded by @typescript-eslint/semi
    'semi-style': 'off', // superseded by @typescript-eslint/semi
    'brace-style': 'off', // superseded by @typescript-eslint/brace-style
    'indent': 'off', // superseded by @typescript-eslint/indent
    'comma-spacing': 'off', // superseded by @typescript-eslint/comma-spacing
    'func-call-spacing': 'off', // superseded by @typescript-eslint/func-call-spacing
    'no-extra-semi': 'off', // superseded by @typescript-eslint/no-extra-semi
    'quotes': 'off', // superseded by @typescript-eslint/quotes
    'space-before-function-paren': 'off', // superseded by @typescript-eslint/space-before-function-paren

    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-namespace': 'off',
    'no-useless-escape': 'off',
    'no-inner-declarations': 'off',

    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-regexp-exec': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/interface-name-prefix': 'warn',
  },
  overrides: [
    {
      files: ['**/src/**/*.ts'],
      rules: {
        'license-header/header': [ 'error', './.config/source-license-header.js' ],
      }
    },
    {
      files: ['**/src/i18n/languages/**/*.ts'],
      rules: {
        'sort-keys': ['error', 'asc'],
      }
    },
  ],
};
