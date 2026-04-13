# Integration with Vue

Installing HyperFormula in a Vue application works the same as with vanilla JavaScript.

For more details, see the [client-side installation](client-side-installation.md) section.

## Basic usage

Wrap the HyperFormula instance in `markRaw` to prevent Vue from converting it into a reactive proxy (see [Troubleshooting](#vue-reactivity-issues) below). Hold derived data in `ref` so the template updates automatically.

```javascript
<script setup>
import { markRaw, ref } from 'vue';
import { HyperFormula } from 'hyperformula';

const hf = markRaw(
  HyperFormula.buildFromArray(
    [
      // your data goes here
    ],
    {
      // your configuration goes here
    }
  )
);

const values = ref(hf.getSheetValues(0));

function updateCell(row, col, value) {
  hf.setCellContents({ sheet: 0, row, col }, value);
  values.value = hf.getSheetValues(0);
}
</script>
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

For a more advanced example, check out the [Vue 3 demo on Stackblitz](https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/vue-3-demo?v=${$page.buildDateURIEncoded}).

::: tip
This demo uses the [Vue 3](https://v3.vuejs.org/) framework. If you are looking for an example using Vue 2, check out the [code on GitHub](https://github.com/handsontable/hyperformula-demos/tree/2.5.x/vue-demo).
:::
