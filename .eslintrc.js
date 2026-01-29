module.exports = {
  root: true,
  ignorePatterns: ['.eslintrc.js'],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    'license-header',
    'jsdoc',
    'jasmine',
    'jest',
  ],
  env: {
    jasmine: true,
    'jest/globals': true,
  },
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
    'plugin:jasmine/recommended',
    'plugin:jest/recommended',
    'plugin:jest/style',
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
    '@typescript-eslint/naming-convention': [
      'error',
      { 'selector': 'variableLike', 'format': ['camelCase', 'UPPER_CASE', 'PascalCase'], 'leadingUnderscore': 'allow' },
      { 'selector': 'interface', 'format': ['PascalCase'], 'custom': { 'regex': '^I[A-Z]', 'match': false } },
    ],
    '@typescript-eslint/semi': ['error', 'never'],
    '@typescript-eslint/brace-style': 'error',
    '@typescript-eslint/no-unnecessary-boolean-literal-compare': ['error'],
    '@typescript-eslint/no-extra-non-null-assertion': ['error'],
    '@typescript-eslint/no-throw-literal': ['error'],
    '@typescript-eslint/array-type': ['error'],
    '@typescript-eslint/space-before-function-paren': ['error', {
      'anonymous': 'never',
      'named': 'never',
      'asyncArrow': 'always'
    }],
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

    // Overrides
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-regexp-exec': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/restrict-template-expressions': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',

    'jsdoc/check-access': 'warn',
    'jsdoc/check-alignment': 'warn',
    'jsdoc/check-param-names': 'warn',
    'jsdoc/check-property-names': 'warn',
    'jsdoc/check-tag-names': ['warn', { definedTags: ['category', 'internal'] }],
    'jsdoc/check-types': 'warn',
    'jsdoc/empty-tags': 'warn',
    'jsdoc/implements-on-classes': 'warn',
    'jsdoc/multiline-blocks': 'warn',
    'jsdoc/no-multi-asterisks': 'warn',
    'jsdoc/require-param-description': 'warn',
    'jsdoc/require-param-name': 'warn',
    'jsdoc/require-param-type': 'warn',
    'jsdoc/require-property-description': 'warn',
    'jsdoc/require-property-name': 'warn',
    'jsdoc/require-property-type': 'warn',
    'jsdoc/require-returns-check': 'warn',
    'jsdoc/require-returns-description': 'warn',
    'jsdoc/require-returns-type': 'warn',
    'jsdoc/require-yields-check': 'warn',
    'jsdoc/valid-types': 'warn',
    'jsdoc/require-jsdoc': ['warn', {
      checkConstructors: false,
      require: {
        ArrowFunctionExpression: false,
        ClassDeclaration: true,
        ClassExpression: true,
        FunctionDeclaration: true,
        FunctionExpression: true,
        MethodDefinition: true,
      }
    }],
    'jest/no-jasmine-globals': 'off',
    'jest/no-alias-methods': 'off',
    'jest/no-conditional-expect': 'warn',
    'jest/no-standalone-expect': 'warn',
    'jest/no-test-prefixes': 'off',
    'jest/prefer-to-be': 'warn',
    'jest/prefer-to-have-length': 'off',
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
    {
      files: ['**/*.spec.ts'],
      rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
      }
    }
  ],
}
