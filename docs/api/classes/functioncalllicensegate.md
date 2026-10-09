# FunctionCallLicenseGate

Decides whether the license stops a function call, and with which `#LIC!` error.

The one rule behind two consumers: the interpreter, which evaluates a stopped call to that
error, and the array size predictor, which sizes a stopped call as a single cell. A stopped call
therefore reserves no spill range, so its `#LIC!` appears in its own cell only and a non-empty
cell below it cannot turn it into `#SPILL!`. Sharing one object keeps the two from disagreeing
about the same call.

Built from an engine's config, once per consumer. The license decisions are read off the config
here rather than through its getters (a WeakMap lookup each), because the interpreter asks on the
hottest path of evaluation. They cannot go stale: a Config never changes once built, and
`updateConfig` builds a new engine, and with it new consumers.

## Constructors

### constructor 

\+ **new FunctionCallLicenseGate**(`config`: [Config](config.md), `functionRegistry`: FunctionRegistry): *[FunctionCallLicenseGate](functioncalllicensegate.md)*

*Defined in [src/license/FunctionCallLicenseGate.ts:33](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/FunctionCallLicenseGate.ts#L33)*

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`config` | [Config](config.md) | the engine's config, holding its resolved license |
`functionRegistry` | FunctionRegistry | the engine's registry, which resolves aliases  |

**Returns:** *[FunctionCallLicenseGate](functioncalllicensegate.md)*

## Methods

### stoppedCallError 

▸ **stoppedCallError**(`procedureName`: string): *[CellError](cellerror.md) | undefined*

*Defined in [src/license/FunctionCallLicenseGate.ts:55](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/FunctionCallLicenseGate.ts#L55)*

Returns the `#LIC!` error a call to the function evaluates to, or `undefined` when the license
lets the call run. The checks run in the specification's order: a protected function always
runs; a key that blocks evaluation stops every other call (C1); a key that evaluates stops a
call to a function it does not grant (C2), checking an alias as its canonical function.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`procedureName` | string | the function id as written in the formula  |

**Returns:** *[CellError](cellerror.md) | undefined*

___

### stopsCall 

▸ **stopsCall**(`procedureName`: string): *boolean*

*Defined in [src/license/FunctionCallLicenseGate.ts:77](https://github.com/handsontable/hyperformula/blob/99a45ea/src/license/FunctionCallLicenseGate.ts#L77)*

Whether the license stops a call to the function, so that the call evaluates to `#LIC!`.

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`procedureName` | string | the function id as written in the formula  |

**Returns:** *boolean*