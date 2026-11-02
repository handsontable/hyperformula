import { createRspackConfig } from "../../rspack.base.mjs";

export default createRspackConfig({
  url: import.meta.url,
  externals: { hyperformula: "hyperformula" },
});
