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

### Code

```js
export default {
  name: 'MyComponent',
  // ...
}
```

Formula Syntax supports `xlsx`, `xls` and `excel-formula`. IMO we shouldn't use competition name so `xls` maybye?
```xls
=SUM(A1:C64)
```

Prism.js supports this, but I guess we have to update it first. Vuepress has the older version.

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
