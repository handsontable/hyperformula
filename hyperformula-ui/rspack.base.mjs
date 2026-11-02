import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function createRspackConfig({ url, externals = {} }) {
  const packageDir = fileURLToPath(new URL(".", url));
  const extensions = [".ts", ".js"];

  const swcOptions = {
    jsc: {
      parser: { syntax: "typescript" },
      target: "es2022",
    },
  };

  const rules = [
    {
      test: /\.ts$/,
      exclude: /node_modules/,
      loader: "builtin:swc-loader",
      options: swcOptions,
    },
  ];

  return {
    mode: "production",
    target: "web",
    entry: { index: "./src/index.ts" },
    output: {
      path: resolve(packageDir, "dist"),
      filename: "[name].js",
      chunkFormat: "module",
      library: { type: "module" },
      module: true,
      clean: true,
      environment: { module: true, dynamicImport: true },
    },
    experiments: { outputModule: true },
    resolve: {
      extensions,
      extensionAlias: { ".js": extensions },
    },
    module: { rules },
    externals,
    externalsType: "module",
    optimization: { minimize: false },
    performance: false,
  };
}
