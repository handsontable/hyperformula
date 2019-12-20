/**
 * Config responsible for building HyperFormula `dist/` minified files:
 *  - hyperformula.min.js
 *  - hyperformula.full.min.js
 */
const WebpackBar = require('webpackbar');
const TerserPlugin = require('terser-webpack-plugin');
const configFactory = require('./development');

module.exports.create = function create() {
  const config = configFactory.create();

  // Enable minification plugin for each configuration
  config.forEach(function(c) {
    c.devtool = false;
    c.output.filename = c.output.filename.replace(/\.js$/, '.min.js');

    c.optimization = {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            mangle: false,    // This option has to be disabled, otherwise GPU function doesn't work for min files.
            compress: false,  // This option has to be disabled, otherwise GPU function doesn't work for min files.
          }
        })
      ]
    };

    c.plugins.forEach((plugin) => {
      if (plugin instanceof WebpackBar) {
        plugin.options.name = ` ${c.output.filename}`;
      }
    })
  });

  return config;
}
