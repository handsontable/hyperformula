module.exports = {
  ...require('./.typedoc.ts'),
  "theme": "./docs/.vuepress/subtheme",
  "out": "docs/api",
  "name": "Introduction",
  "categorizeByGroup": false,
  "readme": "./docs/api-template.md",
  "plugin": ["typedoc-plugin-markdown"],
}
