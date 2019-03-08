const path = require("path");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js"
  },
  plugins: [
    new HtmlWebpackPlugin(),
    new WasmPackPlugin({
      crateDirectory: path.resolve(__dirname, "wasminterpreter"),
      withTypeScript: true // this is new
    }),
  ],
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".wasm"]
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: "ts-loader"
    }]
  }
};
