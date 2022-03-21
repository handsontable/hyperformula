# Migrating from 1.x.x to 2.0

To upgrade your HyperFormula version from 1.x.x to 2.0.0, follow this guide.

## Step 1: Remove GPU-related config parameters

GPU support has been removed. You need to remove all the usages of config parameters:
- `gpujs`
- `gpuMode`

Before:
```js
const engine = HyperFormula.buildFromArray(
    [[]],
    { gpujs: true, gpuMode: 'cpu', licenseKey: 'gpl-v3' },
)
```

After:
```js
const engine = HyperFormula.buildFromArray(
    [[]],
    { licenseKey: 'gpl-v3' },
)
```
