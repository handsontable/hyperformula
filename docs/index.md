---
title: Introduction
lang: en-US
---


First of all... we can use Emoji! :tada:

### Blocks

::: tip
This is a tip
:::

::: warning
This is a warning
:::

::: danger
This is a dangerous warning
:::

::: details
This is a details block, which does not work in IE / Edge
:::

### Code syntax

We can use `html`, `js`, `ts` and others supported by Prism.js

```ts
import { HyperFormula } from 'hyperformula'

const engine = HyperFormula.buildFromArray([[ ... ]]);

engine.getCellValue('A1')
```

### Formulas syntax
Formula Syntax is supported with `formula` and `hf` syntax.
```formula
=SUM(A1:C64)
```

```hf
<body></body>
```

::: warning
Current Prims.js (v1.19) does not have the language support yet. it's merged to master. Prism.js will supports the formula syntax after they publish a new release. 
:::


### Github style tables

| Tables        | Are           | Cool  |
| ------------- |:-------------:| -----:|
| col 3 is      | right-aligned | $1600 |
| col 2 is      | centered      |   $12 |
| zebra stripes | are neat      |    $1 |

### Links

[GPU Support](gpu-support.md)

### Frontmatter

The beginning of the file with meta data
