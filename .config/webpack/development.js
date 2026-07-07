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
      chevrotain: {
        root: 'chevrotain',
        commonjs2: 'chevrotain',
        commonjs: 'chevrotain',
        amd: 'chevrotain',
      },
      'tiny-emitter': {
        root: 'TinyEmitter',
        commonjs2: 'tiny-emitter',
        commonjs: 'tiny-emitter',
        amd: 'tiny-emitter',
      },
      exceljs: {
        root: 'ExcelJS',
        commonjs2: 'exceljs',
        commonjs: 'exceljs',
        amd: 'exceljs',
      },
    };
    c.plugins.push(new WebpackBar({ name: ` ${PACKAGE_FILENAME}.js` }));
  });

  configFull.forEach(function(c) {
    c.output.filename = `${PACKAGE_FILENAME}.full.js`;
    // The 'full' bundle inlines HyperFormula's own dependencies, but exceljs is
    // kept external: it is large and its transitive licenses would break the
    // single-preamble bundle invariant. xlsx import/export in the UMD 'full'
    // build therefore requires providing exceljs (global `ExcelJS`) separately.
    c.externals = {
      exceljs: {
        root: 'ExcelJS',
        commonjs2: 'exceljs',
        commonjs: 'exceljs',
        amd: 'exceljs',
      },
    };
    c.plugins.push(new WebpackBar({ name: ` ${PACKAGE_FILENAME}.full.js` }));
  });

  return [].concat(configBase, configFull);
}
