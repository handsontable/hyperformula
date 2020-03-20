module.exports = {
  ...require('.typedoc.ts'),
  "theme": "vuepress",
  "out": "docs/api",
  "readme": "./docs/api.md",
  "plugin": ["typedoc-plugin-markdown"],
}
