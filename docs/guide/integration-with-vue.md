# Integration with Vue

Installing HyperFormula in a Vue application works the same as with vanilla JavaScript.

For more details, see the [client-side installation](client-side-installation.md) section.

## Basic usage

### Step 1. Initialize HyperFormula

Wrap the HyperFormula instance in `markRaw` to prevent Vue's reactivity system from converting it into a proxy (see [Troubleshooting](#vue-reactivity-issues) below). Use `ref` for the data you want to display.

```javascript
<script setup>
import { ref, markRaw } from 'vue';
import { HyperFormula } from 'hyperformula';

// Create a HyperFormula instance with initial data.
const hf = markRaw(
  HyperFormula.buildFromArray(
    [
      [10, 20, '=SUM(A1:B1)'],
      [30, 40, '=SUM(A2:B2)'],
    ],
    { licenseKey: 'gpl-v3' }
  )
);

// Read calculated values from the sheet.
const sheetId = 0;
const data = ref(hf.getSheetValues(sheetId));
</script>
```

### Step 2. Render the results

Display the calculated values in a template.

```html
<template>
  <table>
    <tr v-for="(row, rowIdx) in data" :key="rowIdx">
      <td v-for="(cell, colIdx) in row" :key="colIdx">{{ cell }}</td>
    </tr>
  </table>
</template>
```

## Troubleshooting

### Vue reactivity issues

If you encounter an error like

```
Uncaught TypeError: Cannot read properties of undefined (reading 'licenseKeyValidityState')
```

it means that Vue's reactivity system tries to deeply observe the HyperFormula instance. To fix this, wrap your HyperFormula instance in Vue's [`markRaw`](https://vuejs.org/api/reactivity-advanced.html#markraw) function:

```javascript
import { markRaw } from 'vue';
import { HyperFormula } from 'hyperformula';

const hfInstance = markRaw(
  HyperFormula.buildEmpty({
    licenseKey: 'internal-use-in-handsontable',
  })
);
```

This function prevents Vue from converting the HyperFormula instance into a reactive proxy, which can cause errors and performance issues.

## Demo

Explore the full working example on [Stackblitz](https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/vue-3-demo?v=${$page.buildDateURIEncoded}).

::: tip
This demo uses the [Vue 3](https://v3.vuejs.org/) framework. If you are looking for an example using Vue 2, check out the [code on GitHub](https://github.com/handsontable/hyperformula-demos/tree/2.5.x/vue-demo).
:::
