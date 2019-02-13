const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const chevrotain = require('chevrotain');
const buildLexerConfig = require('./lib/src/parser/LexerConfig.js').buildLexerConfig;
const HtmlWebpackPlugin = require('html-webpack-plugin')

// We need to compute token names, these variables can't be mangled.
// http://sap.github.io/chevrotain/docs/FAQ.html#MINIFIED
const reservedTokenNames = buildLexerConfig({ functionArgSeparator: /,/ }).allTokens.map(function (currentToken) {
  return chevrotain.tokenName(currentToken)
})

const buildConfiguration = ({ name, mode, excludeDependencies }) => {
  const optimization = {
    minimizer: [new TerserPlugin({
      terserOptions: {
        mangle: {
          reserved: reservedTokenNames,
        }
      }
    })]
  }
  const configuration = {
    entry: './src/index.ts',
    module: {
      rules: [
        {
          test: /\.worker\.ts$/,
          use: { loader: 'worker-loader' }
        },
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ]
    },
    output: {
      filename: `${name}.bundle.js`,
      library: "HandsOnEngine",
      libraryTarget: "umd",
      path: path.resolve(__dirname, 'lib'),

      // https://github.com/webpack/webpack/issues/6784
      globalObject: 'typeof self !== \'undefined\' ? self : this',
    },
    externals: (excludeDependencies ? ['moment', 'chevrotain', /csv-parse/, /csv-stringify/] : []),
    mode,
    optimization: (mode === 'production' ? optimization : undefined),
    performance: {
      hints: false
    },
    plugins: [
      new HtmlWebpackPlugin()
    ],
  }
  return configuration
};

const unoptimized_full = buildConfiguration({
  name: "unoptimized-full",
  mode: "development",
  excludeDependencies: false,
});
const unoptimized_without_dependencies = buildConfiguration({
  name: "unoptimized-without-dependencies",
  mode: "development",
  excludeDependencies: true,
})
const optimized_full = buildConfiguration({
  name: "optimized-full",
  mode: "production",
  excludeDependencies: false,
})
const optimized_without_dependencies = buildConfiguration({
  name: "optimized-without-dependencies",
  mode: "production",
  excludeDependencies: true,
})

module.exports = [
  unoptimized_full,
  // unoptimized_without_dependencies,
  // optimized_full,
  // optimized_without_dependencies,
];
