import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function createRspackConfig({ url, tsx = false, externals = {} }) {
  const packageDir = fileURLToPath(new URL(".", url));
  const scriptTest = tsx ? /\.tsx?$/ : /\.ts$/;
  const extensions = tsx ? [".ts", ".tsx", ".js"] : [".ts", ".js"];

  const swcOptions = {
    jsc: {
      parser: tsx ? { syntax: "typescript", tsx: true } : { syntax: "typescript" },
      target: "es2022",
      ...(tsx ? { transform: { react: { runtime: "automatic" } } } : {}),
    },
  };

  const rules = [
    {
      test: scriptTest,
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
