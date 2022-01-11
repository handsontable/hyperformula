# Enabling GPU acceleration

You can speed up HyperFormula's [matrix functions](built-in-functions.md#matrix-functions) with GPU acceleration.

## About GPU acceleration

You can speed up HyperFormula's [matrix functions](built-in-functions.md#matrix-functions) ([MMULT](built-in-functions.md#matrix-functions), [MAXPOOL](built-in-functions.md#matrix-functions), [MEDIANPOOL](built-in-functions.md#matrix-functions), and [TRANSPOSE](built-in-functions.md#matrix-functions)) with GPU acceleration.

With GPU acceleration (thanks to cores running thousands of threads
at once) the matrix functions calculate input data sets up to 9x faster than
when using the CPU. From our observation, the bigger the data set,
the bigger the performance gain.

**For small data sets, the difference between the CPU and GPU is
non-significant.**

## Enabling GPU acceleration

To enable GPU acceleration, follow the steps below.

### Step 1: Install GPU.js

As GPU.js was removed from optional dependencies in [HyperFormula 1.2.0](../guide/release-notes.md#_1-2-0), you need to install GPU.js on your own.

HyperFormula supports GPU.js 2.3.0.

```js
// install GPU.js 2.3.0
npm install gpu.js@2.3.0
```
### Step 2: Import GPU

When configuring your HyperFormula instance, import the GPU module:
```js
// import the GPU module
import GPU from 'gpu.js'
```

### Step 3: Pass the GPU.js constructor

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
### Step 4: Enable the `gpuMode` option

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