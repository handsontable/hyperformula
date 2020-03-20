module.exports = {
  "inputFiles": [
    "./src/HyperFormula.ts",
    "./src/Config.ts",
    "./src/Emitter.ts",
  ],
  "exclude": [
    "./test/**",
    "./src/interpreter/**",
    "./src/i18n/**",
    "./src/parser/**",
    "./src/dependencyTransformers/**",
    "./src/DependencyGraph/**",
    "./src/ColumnSearch/**",
  ],
  "mode": "modules",
  "out": "./typedoc",
  "excludeExternals": true,
  "excludeProtected": true,
  "excludePrivate": true,
  "hideGenerator": true,
  "stripInternal": true,
  "plugin": "none",
  "name": "HyperFormula API",
  "disableSources": true,
  "categoryOrder": [
    "Factory",
    "Instance",
    "Events",
    "Sheet",
    "Row",
    "Range",
    "Column",
    "Cell",
    "Named Expression",
    "Helper",
    "Clipboard",
    "*"
  ],
  "toc": [
    "HyperFormula",
    "Config",
    "Emitter"
  ]
}
