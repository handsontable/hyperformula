/**
 * Config responsible for building not minified Handsontable `languages/` files.
 */
const NEW_LINE_CHAR = '\n';
const SOURCE_LANGUAGES_DIRECTORY = 'lib/i18n/languages';
const OUTPUT_LANGUAGES_DIRECTORY = 'languages';

const path = require('path');
const StringReplacePlugin  = require('string-replace-webpack-plugin');
const WebpackOnBuildPlugin = require('on-build-webpack');
const fs  = require('fs');
const fsExtra  = require('fs-extra');

const PACKAGE_FILENAME = process.env.HOT_FILENAME;

function getEntryJsFiles() {
  const entryObject = {};
  const filesInLanguagesDirectory = fs.readdirSync(SOURCE_LANGUAGES_DIRECTORY);

  filesInLanguagesDirectory.forEach((fileName) => {
    const jsExtensionRegExp = /\.js$/;

    if (jsExtensionRegExp.test(fileName)) {
      let fileNameWithoutExtension = fileName.replace(jsExtensionRegExp, '');

      if (fileNameWithoutExtension === 'index') {
        fileNameWithoutExtension = 'all';
      }

      entryObject[fileNameWithoutExtension] = path.resolve(SOURCE_LANGUAGES_DIRECTORY, fileName);
    }
  });

  return entryObject;
}

const ruleForSnippetsInjection = {
  test: /\.js$/,
  loader: StringReplacePlugin.replace({
    replacements: [
      {
        pattern: /\/\/.import/,
        replacement: function() {
          const snippet1 = `import HyperFormula from '../..';`;

          return `${snippet1}${NEW_LINE_CHAR.repeat(2)}`;
        }
      },
      {
        pattern: /export default dictionary/,
        replacement: function(matchingPhrase) {
          const snippet = `
            if (!HyperFormula.languages) {
              HyperFormula.languages = {};
            }
            HyperFormula.languages[dictionary.langCode] = dictionary;
          `;

          return `${snippet}${NEW_LINE_CHAR.repeat(2)}${matchingPhrase}`;
        }
      }
    ]
  })
};

module.exports.create = function create() {
  const config = {
    mode: 'none',
    entry: getEntryJsFiles(),
    output: {
      filename: '[name].js',
      globalObject: `typeof self !== 'undefined' ? self : this`,
      // Workaround below: Without this option webpack would export all language packs as globals
      libraryExport: '___',
      libraryTarget: 'umd',
      path: path.resolve(__dirname, '../../' + OUTPUT_LANGUAGES_DIRECTORY),
      umdNamedDefine: true,
      
    },
    externals: {
      ['../..']: {
        root: 'HyperFormula',
        commonjs2: 'hyperformula',
        commonjs: 'hyperformula',
        amd: 'hyperformula',
      },
    },
    module: {
      rules: [
        {test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
        ruleForSnippetsInjection
      ]
    },
    plugins: [
      new WebpackOnBuildPlugin(() => {
        const filesInOutputLanguagesDirectory = fs.readdirSync(OUTPUT_LANGUAGES_DIRECTORY);
        const indexFileName = 'index.js';
        const allLanguagesFileName = 'all.js';

        // copy files from `languages` directory to `dist/languages` directory
        filesInOutputLanguagesDirectory.forEach((fileName) => {
          if (fileName !== indexFileName) {
            fsExtra.copySync(`${OUTPUT_LANGUAGES_DIRECTORY}/${fileName}`, `dist/languages/${fileName}`);
          }
        });

        // copy from `languages/all.js` to `languages/index.js`
        if (filesInOutputLanguagesDirectory.includes(allLanguagesFileName)) {
          fsExtra.copySync(`${OUTPUT_LANGUAGES_DIRECTORY}/${allLanguagesFileName}`, `${OUTPUT_LANGUAGES_DIRECTORY}/${indexFileName}`);
        }
      })
    ]
  };

  return [config];
};