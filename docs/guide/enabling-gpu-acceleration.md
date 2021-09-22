# Enabling GPU acceleration.

::: tip
GPU acceleration is deprecated since [HyperFormula 1.2.0](../guide/release-notes.md#_1-2-0).
:::

To enable GPU acceleration, follow the steps below.

## Step 1: Use HyperFormula 1.1.0

As `gpu.js` was removed from optional dependencies in [HyperFormula 1.2.0](../guide/release-notes.md#_1-2-0), you can only use GPU acceleration in HyperFormula 1.1.0 (or lower).

::: tip
HyperFormula 1.1.0 supports GPU.js 2.3.0.
:::

## Step 2: Import GPU

GPU.js uses ES6 features and doesn't provide a proper ES5 package. To let HyperFormula run on browsers like Internet Explorer, GPU.js is not bundled with the HyperFormula package.

When configuring your HyperFormula 1.1.0 instance, import the GPU module:
```js
// import the GPU module
import GPU from 'gpu.js'
```

## Step 3: Pass the GPU.js constructor

Now, pass the GPU.js constructor to the [HyperFormula configuration](./configuration-options.md).

To do this, use the [`gpujs` option](../api/interfaces/configparams.md#gpujs):
```js
import GPU from 'gpu.js'

// your HyperFormula configuration options
const options = {
    // in the `gpujs` option, pass the GPU.js constructor
    gpujs: GPU.GPU ?? GPU,
};
```
## Step 4: Enable the `gpuMode` option

Now, set the [`gpuMode` option](../api/interfaces/configparams.md#gpumode) to `'gpu'`:
```js
import GPU from 'gpu.js'

// your HyperFormula configuration options 
const options = {
    gpujs: GPU.GPU ?? GPU,
    // enable the `gpuMode` option
    gpuMode: 'gpu',
};

// create a HyperFormula instance
// with options defined in `options`
const hfInstance = HyperFormula.buildEmpty(options);
```
