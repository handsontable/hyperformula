const path = require('path');
const fs = require('fs');
const { BannerPlugin } = require('webpack');

let licenseBody = fs.readFileSync(path.resolve(__dirname, '../../LICENSE.txt'), 'utf8');

licenseBody += '\nVersion: ' + process.env.HT_VERSION;
licenseBody += '\nRelease date: ' + process.env.HT_RELEASE_DATE + ' (built at ' + process.env.HT_BUILD_DATE + ')';

module.exports.create = function create(processedFile) {
  const config = {
    devtool: false,
    mode: 'none',
    performance: {
      hints: false,
    },
    output: {
      globalObject: `typeof self !== 'undefined' ? self : this`,
      library: 'HyperFormula',
      libraryExport: 'default',
      libraryTarget: 'umd',
      path: path.resolve(__dirname, '../../dist'),
      umdNamedDefine: true,
    },
    resolve: {
      alias: {},
      extensions: [ '.tsx', '.ts', '.js' ],
    },
    module: {
      rules: [
        {
          test: /\.(js|ts)$/,
          exclude: [
            /node_modules/,
          ],
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: false, // Disable cache. Necessary for injected variables into source code via ht.config.js
              },
            }
          ]
        },
      ]
    },
    plugins: [
      new BannerPlugin(licenseBody),
    ],
  };

  return [config];
}
