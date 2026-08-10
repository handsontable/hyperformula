# Integration with Vue

The HyperFormula API is identical in a Vue 3 app and in plain JavaScript. This guide demonstrates how HyperFormula integrates with the Vue reactivity system and how to surface its values in the template.

Install with `npm install hyperformula`. For other options, see the [client-side installation](client-side-installation.md) section.

> **TypeScript**
>
> All examples use TypeScript. Remove the type annotations to use plain JavaScript.

## Basic usage

Pass the HyperFormula instance through Vue's [`markRaw`](https://vuejs.org/api/reactivity-advanced.html#markraw) to opt it out of the reactivity system (see [Troubleshooting](#vue-reactivity-issues) below for why this matters). Hold derived data in `ref` so the template updates when you reassign the ref's `.value`.

```vue
<script setup lang="ts">
import { markRaw, onUnmounted, ref } from "vue";
import { HyperFormula, type CellValue } from "hyperformula";

const hf = markRaw(
  HyperFormula.buildFromArray(
    [
      [1, 2, "=A1+B1"],
      // your data rows go here
    ],
    { licenseKey: "gpl-v3" },
  ),
);

const values = ref<CellValue[][]>([]);

function runCalculations() {
  values.value = hf.getSheetValues(0);
}

function reset() {
  values.value = [];
}

onUnmounted(() => hf.destroy());
</script>

<template>
  <button @click="runCalculations" :disabled="!!values.length">
    Run calculations
  </button>
  <button @click="reset" :disabled="!values.length">Reset</button>
  <table v-if="values.length">
    <tr v-for="(row, r) in values" :key="r">
      <td v-for="(cell, c) in row" :key="c">{{ cell }}</td>
    </tr>
  </table>
</template>
```

`hf` is marked raw so Vue never proxies it — `values` is the only reactive piece. To mutate data, call any HyperFormula method (e.g. `setCellContents`) then reassign `values.value` to trigger a re-render. See [Basic operations](basic-operations.md) for the full mutation API.

## Server-side rendering (Nuxt)

HyperFormula has no browser-only API dependency. To skip server-side computation, wrap the component with `<ClientOnly>`.

## Troubleshooting

### Vue reactivity issues

If you encounter an error like

```
Uncaught TypeError: Cannot read properties of undefined (reading 'licenseKeyValidityState')
```

it means that Vue's reactivity system tried to deeply observe the HyperFormula instance. Vue wraps reactive objects in a `Proxy` that intercepts every property access; when that proxy reaches a non-trivial instance with its own internal state, identity checks and lazy-initialized maps break. The fix is to opt the instance out of reactivity with [`markRaw`](https://vuejs.org/api/reactivity-advanced.html#markraw):

```typescript
import { markRaw } from "vue";
import { HyperFormula } from "hyperformula";

const hf = markRaw(
  HyperFormula.buildEmpty({
    licenseKey: "gpl-v3",
  }),
);
```

`shallowRef` is not a substitute: it skips proxying only at the top level, so writing the instance into a nested reactive structure (Pinia state, `reactive({...})`) will still wrap it. Always pass the instance itself through `markRaw` before putting it anywhere Vue can reach.

## Next steps

- [Configuration options](configuration-options.md) — full list of `buildFromArray` / `buildEmpty` options
- [Basic operations](basic-operations.md) — CRUD on cells, rows, columns, sheets
- [Advanced usage](advanced-usage.md) — multi-sheet workbooks, named expressions
- [Custom functions](custom-functions.md) — register your own formulas

## Demo

For a more advanced example, check out the [Vue 3 demo on Stackblitz](https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.4.x/vue-3-demo?v=).

> This demo uses the [Vue 3](https://v3.vuejs.org/) framework. If you are looking for an example using Vue 2, check out the [code on GitHub](https://github.com/handsontable/hyperformula-demos/tree/2.5.x/vue-demo).