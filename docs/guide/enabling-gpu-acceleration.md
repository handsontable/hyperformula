# Enabling GPU acceleration.

Currently, GPU.js uses ES6 features and does not provide proper ES5 package. 
Therefore, to allow the engine to run on browsers like Internet Explorer, it is not bundled with the engine.

In order to take advantage of the GPU acceleration, the GPU.js constructor has to be passed to the engine configuration 
(supported version of GPU.js is 2.3.0):

```javascript
import GPU from 'gpu.js'

// define options 
const options = {
    gpujs: GPU.GPU ?? GPU
};

// call the static method to build a new instance
const hfInstance = HyperFormula.buildEmpty(options);
```
