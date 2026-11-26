const path = require('path');

// Loaded by the engine's typedoc (`typedoc:build-api` in hyperformula/), so this must resolve to the
// engine's typedoc-plugin-markdown, which hyperformula/package.json declares - not to a portal copy.
// The lookup starts in hyperformula/ because npm may install the plugin in hyperformula/node_modules,
// which a plain require() from this directory never searches.
const MarkdownTheme = require(require.resolve('typedoc-plugin-markdown/dist/theme', {
  paths: [path.resolve(__dirname, '../../hyperformula')],
}));

class HyperFormulaTheme extends MarkdownTheme.default {
  constructor(renderer, basePath) {
    super(renderer, basePath);
  }
}

exports.default = HyperFormulaTheme;
