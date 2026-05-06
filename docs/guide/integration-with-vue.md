# Integration with Vue

The HyperFormula API is identical in a Vue 3 app and in plain JavaScript. What changes is how you keep the engine out of Vue's reactivity system and how you surface its values into the template.

Install with `npm install hyperformula`. For other options, see the [client-side installation](client-side-installation.md) section.

## Basic usage

Wrap the HyperFormula instance inside a plain class so it stays outside Vue's reactivity system (see [Troubleshooting](#vue-reactivity-issues) below for why this matters). Hold derived data in `ref` so the template updates when you reassign the ref's `.value`.

```typescript
// spreadsheet-provider.ts
import { HyperFormula, type CellValue } from 'hyperformula';

export class SpreadsheetProvider {
  private hf: HyperFormula;

  constructor(data: (string | number | null)[][]) {
    this.hf = HyperFormula.buildFromArray(data, {
      licenseKey: 'gpl-v3',
      // more configuration options go here
    });
  }

  getCalculatedValues(): CellValue[][] {
    return this.hf.getSheetValues(0);
  }

  getRawFormulas(): (string | number | null)[][] {
    return this.hf.getSheetSerialized(0) as (string | number | null)[][];
  }

  destroy() {
    this.hf.destroy();
  }
}
```

Use the class from a component with `<script setup>`:

```vue
<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import type { CellValue } from 'hyperformula';
import { SpreadsheetProvider } from './spreadsheet-provider';

const provider = new SpreadsheetProvider([
  [1, 2, '=A1+B1'],
  // your data rows go here
]);

const values = ref<CellValue[][]>([]);

function runCalculations() {
  values.value = provider.getCalculatedValues();
}

function reset() {
  values.value = [];
}

onUnmounted(() => provider.destroy());
</script>

<template>
  <button @click="runCalculations">Run calculations</button>
  <button @click="reset">Reset</button>
  <table v-if="values.length">
    <tr v-for="(row, r) in values" :key="r">
      <td v-for="(cell, c) in row" :key="c">{{ cell }}</td>
    </tr>
  </table>
</template>
```

The class keeps the HyperFormula instance as a private field, so Vue's reactivity Proxy never reaches it. This is the same pattern used in the [Vue 3 demo](#demo).

## Notes

### Server-side rendering (Nuxt)

The class above is already SSR-safe — HyperFormula has no browser-only API dependency. To skip the (otherwise wasted) server-side instantiation in Nuxt, wrap the component with `<ClientOnly>`.

## Troubleshooting

### Vue reactivity issues

If you encounter an error like

```
Uncaught TypeError: Cannot read properties of undefined (reading 'licenseKeyValidityState')
```

it means that Vue's reactivity system tried to deeply observe the HyperFormula instance. Vue wraps reactive objects in a `Proxy` that intercepts every property access; when that proxy reaches a non-trivial instance with its own internal state, identity checks and lazy-initialized maps break. The fix is to opt the instance out of reactivity with Vue's [`markRaw`](https://vuejs.org/api/reactivity-advanced.html#markraw):

```typescript
import { markRaw } from 'vue';
import { HyperFormula } from 'hyperformula';

const hfInstance = markRaw(
  HyperFormula.buildEmpty({
    licenseKey: 'gpl-v3',
  })
);
```

`shallowRef` is not a substitute: it skips proxying only at the top level, so writing the instance into a nested reactive structure (Pinia state, `reactive({...})`) will still wrap it. Always pass the instance itself through `markRaw` before putting it anywhere Vue can reach.

## Next steps

- [Configuration options](configuration-options.md) — full list of `buildFromArray` / `buildEmpty` options
- [Basic operations](basic-operations.md) — CRUD on cells, rows, columns, sheets
- [Advanced usage](advanced-usage.md) — multi-sheet workbooks, named expressions
- [Custom functions](custom-functions.md) — register your own formulas

## Demo

For a more advanced example, check out the <a :href="'https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/vue-3-demo?v=' + $page.buildDateURIEncoded">Vue 3 demo on Stackblitz</a>.

::: tip
This demo uses the [Vue 3](https://v3.vuejs.org/) framework. If you are looking for an example using Vue 2, check out the [code on GitHub](https://github.com/handsontable/hyperformula-demos/tree/2.5.x/vue-demo).
:::
