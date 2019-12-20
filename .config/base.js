const path = require('path');
const fs = require('fs');
const { BannerPlugin } = require('webpack');

let licenseBody = fs.readFileSync(path.resolve(__dirname, '../LICENSE'), 'utf8');

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
      libraryTarget: 'umd',
      path: path.resolve(__dirname, '../dist'),
      umdNamedDefine: true,
    },
    resolve: {
      alias: {},
      extensions: [ '.tsx', '.ts', '.js' ],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: [
            /node_modules\/(?!gpu\.js).*/, // The gpu.js library is distributed with non transpiled files
          ],
        },
      ]
    },
    plugins: [
      new BannerPlugin(licenseBody),
    ],
  };

  return [config];
}
