const path = require('path');

const buildConfiguration = ({ name, mode, excludeDependencies }) => {
  const configuration = {
    entry: './src/index.ts',
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
      filename: `${name}.bundle.js`,
      library: "HandsOnEngine",
      libraryTarget: "umd",
      path: path.resolve(__dirname, 'lib'),

      // https://github.com/webpack/webpack/issues/6784
      globalObject: 'typeof self !== \'undefined\' ? self : this',
    },
    externals: (excludeDependencies ? ['moment', 'chevrotain', /csv-parse/, /csv-stringify/] : []),
    mode,
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
  unoptimized_without_dependencies,
  optimized_full,
  optimized_without_dependencies,
];
