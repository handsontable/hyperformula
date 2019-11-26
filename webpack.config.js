const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const WebpackBar = require('webpackbar');

const optimization = {
  minimizer: [new TerserPlugin()]
}

const buildConfiguration = ({ name, mode, excludeDependencies, plugins = [] }) => {
  const configuration = {
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          include: /src/
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
    externals: (excludeDependencies ? ['moment', 'chevrotain', /csv-parse/, /csv-stringify/, 'gpu.js'] : []),
    mode,
    optimization: (mode === 'production' ? optimization : undefined),
    performance: {
      hints: false
    },
    plugins: [
        new WebpackBar({name: name}),
        ...plugins
    ]
  }
  return configuration
};

const libraryBundleConfiguration = (props) => {
  const config = buildConfiguration(props)
  config.entry = "./src/index.ts"
  config.output.library = "HyperFormula"
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
];
