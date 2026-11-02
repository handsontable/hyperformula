// Loaded by the engine's typedoc (`typedoc:build-api` in hyperformula/), so this must resolve to the
// engine's typedoc-plugin-markdown, which hyperformula/package.json declares - not to a portal copy.
const MarkdownTheme = require('typedoc-plugin-markdown/dist/theme');

class HyperFormulaTheme extends MarkdownTheme.default {
  constructor(renderer, basePath) {
    super(renderer, basePath);
  }
}

exports.default = HyperFormulaTheme;
