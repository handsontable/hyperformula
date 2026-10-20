import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  appType: "mpa",
  resolve: {
    conditions: ["development", "import", "module", "browser", "default"],
  },
  css: {
    preprocessorOptions: {
      scss: { api: "modern-compiler" },
    },
  },
  server: { port: 5173, open: true },
  build: {
    rollupOptions: {
      input: {
        index: resolve(dirname, "index.html"),
        basic: resolve(dirname, "basic/index.html"),
      },
    },
  },
});
