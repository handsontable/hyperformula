/**
 * Config responsible for building HyperFormula `dist/` minified files:
 *  - hyperformula.min.js
 *  - hyperformula.full.min.js
 */
const webpack = require('webpack');
const WebpackBar = require('webpackbar');
const configFactory = require('./development');

const PACKAGE_FILENAME = process.env.HT_FILENAME;

module.exports.create = function create() {
  const config = configFactory.create();

  // Enable minification plugin for each configuration
  config.forEach(function(c) {
    const isFullBuild = /\.full\.js$/.test(c.output.filename);

    c.devtool = false;
    c.output.filename = c.output.filename.replace(/\.js$/, '.min.js');

    c.optimization = {
      minimize: true,
    };

    c.plugins.forEach((plugin) => {
      if (plugin instanceof WebpackBar) {
        plugin.options.name = ` ${c.output.filename}`;
      }
    })
  });

  return config;
}
