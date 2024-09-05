# Migrating from 1.x to 2.0

To upgrade your HyperFormula version from 1.x.x to 2.0.0, follow this guide.

## Drop the `gpujs` and `gpuMode` options

Remove the `gpujs` and `gpuMode` options from your HyperFormula configuration.

Before:
```js
const engine = HyperFormula.buildFromArray([[]], {
    gpujs: true,
    gpuMode: 'cpu',
    licenseKey: 'gpl-v3',
});
```

After:
```js
const engine = HyperFormula.buildFromArray([[]], {
    licenseKey: 'gpl-v3',
});
```

::: tip
Functions that used GPU acceleration before (MMULT, MAXPOOL, MEDIANPOOL, and TRANSPOSE), still work. Their performance remains largely the same, except for very large data sets.
:::