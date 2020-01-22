/**
 * Config responsible for building HyperFormula `dist/` files:
 *  - hyperformula.js
 *  - hyperformula.full.js
 */
const WebpackBar = require('webpackbar');
const configFactory = require('./base');

const PACKAGE_FILENAME = process.env.HT_FILENAME;

module.exports.create = function create() {
  const configBase = configFactory.create();
  const configFull = configFactory.create();

  configBase.forEach(function(c) {
    c.output.filename = `${PACKAGE_FILENAME}.js`;
    c.devtool = 'source-map';
    // Exclude all external dependencies from 'base' bundle
    c.externals = {
      moment: {
        root: 'moment',
        commonjs2: 'moment',
        commonjs: 'moment',
        amd: 'moment',
      },
      chevrotain: {
        root: 'chevrotain',
        commonjs2: 'chevrotain',
        commonjs: 'chevrotain',
        amd: 'chevrotain',
      },
      'gpu.js': {
        root: 'GPU',
        commonjs2: 'gpu.js',
        commonjs: 'gpu.js',
        amd: 'gpu.js',
      },
    };
    c.plugins.push(new WebpackBar({ name: ` ${PACKAGE_FILENAME}.js` }));
  });

  configFull.forEach(function(c) {
    c.output.filename = `${PACKAGE_FILENAME}.full.js`;
    c.plugins.push(new WebpackBar({ name: ` ${PACKAGE_FILENAME}.full.js` }));
  });

  return [].concat(configBase, configFull);
}
