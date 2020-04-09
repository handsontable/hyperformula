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
=COUNTIFS($C$7:$C$350;"<>S";$F$7:$F$350;2;S$7:S$350;"*C")+COUNTIFS($C$7:$C$350;"<>S";$F$7:$F$350;3;S$7:S$350;"*C")
```

```hf
=COUNTIFS($C$7:$C$350;"<>S";$F$7:$F$350;2;S$7:S$350;"*C")+COUNTIFS($C$7:$C$350;"<>S";$F$7:$F$350;3;S$7:S$350;"*C")
```

```hyperformula
=COUNTIFS($C$7:$C$350;"<>S";$F$7:$F$350;2;S$7:S$350;"*C")+COUNTIFS($C$7:$C$350;"<>S";$F$7:$F$350;3;S$7:S$350;"*C")
```

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
