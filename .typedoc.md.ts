module.exports = {
  ...require('./.typedoc.ts'),
  "theme": "./docs/.vuepress/subtheme",
  "out": "docs/api",
  "name": "HyperFormula API reference",
  "categorizeByGroup": true,
  "readme": "./docs/api-template.md",
  "plugin": ["typedoc-plugin-markdown"],
}
