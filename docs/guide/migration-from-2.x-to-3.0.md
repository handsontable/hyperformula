# Migrating from 2.x to 3.0

To upgrade your HyperFormula version from 2.x.x to 3.0.0, follow this guide.

## Removal of the `binarySearchThreshold` configuration option (deprecated since version 1.1.0)

The `binarySearchThreshold` has no effect since version 1.1.0. If your codebase still uses this option, please remove it.

## Change in the default value of the `precisionRounding` configuration option

HyperFormula 3.0.0 introduces a change in the default value of the `precisionRounding` configuration option. The new default value is `10`. If you want to keep the old behavior, set the `precisionRounding` option to `14` in the HyperFormula configuration:

```javascript
const hf = HyperFormula.buildEmpty({
  precisionRounding: 14
});
``` 