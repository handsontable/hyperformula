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

const optimization = {
  minimizer: [new TerserPlugin({
    terserOptions: {
      mangle: {
        reserved: reservedTokenNames,
      }
    }
  })]
}

const buildConfiguration = ({ name, mode, excludeDependencies }) => {
  const configuration = {
    module: {
      rules: [
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
      filename: `bundle.js`,
      path: path.resolve(__dirname, 'dist', name),

      // https://github.com/webpack/webpack/issues/6784
      globalObject: 'typeof self !== \'undefined\' ? self : this',
    },
    externals: (excludeDependencies ? ['moment', 'chevrotain', /csv-parse/, /csv-stringify/] : []),
    mode,
    optimization: (mode === 'production' ? optimization : undefined),
    performance: {
      hints: false
    }
  }
  return configuration
};

const libraryBundleConfiguration = (props) => {
  const config = buildConfiguration(props)
  config.entry = "./src/index.ts"
  config.output.library = "HandsOnEngine"
  config.output.libraryTarget = "umd"
  return config
}

const circleBenchmark = () => {
  const config = buildConfiguration({
    name: "circle",
    mode: "development",
    excludeDependencies: false,
  })
  config.entry = "./benchmark/circle.ts"
  return config
}

const browserBenchmark = () => {
  const config = buildConfiguration({
    name: "browser",
    mode: "development",
    excludeDependencies: false,
  })
  config.entry = "./benchmark/browser/benchmark.ts"
  config.plugins = [
    new HtmlWebpackPlugin({
      template: "./benchmark/browser/index.html"
    })
  ]
  return config
}

const unoptimized_full = libraryBundleConfiguration({
  name: "unoptimized-full",
  mode: "development",
  excludeDependencies: false,
});
const unoptimized_without_dependencies = libraryBundleConfiguration({
  name: "unoptimized-without-dependencies",
  mode: "development",
  excludeDependencies: true,
})
const optimized_full = libraryBundleConfiguration({
  name: "optimized-full",
  mode: "production",
  excludeDependencies: false,
})
const optimized_without_dependencies = libraryBundleConfiguration({
  name: "optimized-without-dependencies",
  mode: "production",
  excludeDependencies: true,
})

module.exports = [
  unoptimized_full,
  unoptimized_without_dependencies,
  optimized_full,
  optimized_without_dependencies,
  // circleBenchmark(),
  browserBenchmark(),
];
