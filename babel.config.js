module.exports = {
  plugins: [
    ['transform-inline-environment-variables'],
  ],
  env: {
    // Environment for transpiling files to be compatible with UMD.
    dist: {
      presets: [
        ['@babel/preset-env', {
          modules: false,
          useBuiltIns: 'usage',
          corejs: '3.39.0',
        }]
      ],
      plugins: [
        ['@babel/plugin-transform-runtime', {
          corejs: false,
          helpers: false,
          regenerator: false,
          useESModules: false,
          version: '^7.25.9',
        }],
        ['@babel/plugin-transform-modules-commonjs', { loose: true }]
      ]
    },
    // Environment for transpiling files to be compatible with CommonJS.
    commonjs: {
      plugins: [
        ['@babel/plugin-transform-modules-commonjs', { loose: true }],
      ],
    },
    // Environment for transpiling files to be compatible with ES Modules.
    es: {
      plugins: [
        ['./.config/babel/add-import-extension.js', { extension: 'mjs' }],
      ],
    },
  },
};
