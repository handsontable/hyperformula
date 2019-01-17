const path = require('path');

module.exports = {
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
    filename: 'minified-full.js',
    library: "HandsOnEngine",
    libraryTarget: "umd",
    path: path.resolve(__dirname, 'lib'),

    // https://github.com/webpack/webpack/issues/6784
    globalObject: 'typeof self !== \'undefined\' ? self : this',
  },
  mode: 'development'
};
