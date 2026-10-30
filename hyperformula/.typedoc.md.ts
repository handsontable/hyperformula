module.exports = {
  ...require('./.typedoc.ts'),
  "theme": "../docs/typedoc-theme",
  "out": "../docs/api",
  "name": "API Reference Overview",
  "categorizeByGroup": true,
  "readme": "../docs/api-ref-readme.md",
  "plugin": ["typedoc-plugin-markdown"],
}
