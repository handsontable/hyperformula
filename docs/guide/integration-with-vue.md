# Integration with Vue

The HyperFormula API is identical in a Vue 3 app and in plain JavaScript. What changes is how you keep the engine out of Vue's reactivity system and how you surface its values into the template.

Install with `npm install hyperformula`. For other options, see the [client-side installation](client-side-installation.md) section.

## Basic usage

Wrap the HyperFormula instance inside a plain class so it stays outside Vue's reactivity system (see [Troubleshooting](#vue-reactivity-issues) below for why this matters). Hold derived data in `ref` so the template updates when you reassign the ref's `.value`.

```typescript
// spreadsheet-provider.ts
import { HyperFormula, type CellValue, type RawCellContent } from 'hyperformula';

export class SpreadsheetProvider {
  private hf: HyperFormula;

  constructor(data: RawCellContent[][]) {
    this.hf = HyperFormula.buildFromArray(data, {
      licenseKey: 'gpl-v3',
      // more configuration options go here
    });
  }

  getValues(): CellValue[][] {
    return this.hf.getSheetValues(0);
  }

  updateCell(row: number, col: number, value: RawCellContent) {
    this.hf.setCellContents({ sheet: 0, row, col }, value);
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

const values = ref<CellValue[][]>(provider.getValues());

function handleUpdate(row: number, col: number, value: string) {
  provider.updateCell(row, col, value);
  values.value = provider.getValues();
}

onUnmounted(() => provider.destroy());
</script>

<template>
  <table>
    <tr v-for="(row, r) in values" :key="r">
      <td v-for="(cell, c) in row" :key="c">{{ cell }}</td>
    </tr>
  </table>
</template>
```

The class keeps the HyperFormula instance as a private field, so Vue's reactivity Proxy never reaches it. This is the same pattern used in the [Vue 3 demo](#demo).

## Notes

### Using `markRaw` instead of a class wrapper

If you prefer to use the HyperFormula instance directly in `<script setup>` without a wrapper class, apply [`markRaw`](https://vuejs.org/api/reactivity-advanced.html#markraw) to opt it out of Vue's reactivity:

```vue
<script setup lang="ts">
import { markRaw, onUnmounted, ref } from 'vue';
import { HyperFormula, type CellValue, type RawCellContent } from 'hyperformula';

const hf = markRaw(
  HyperFormula.buildFromArray([/* data */], { licenseKey: 'gpl-v3' })
);

const values = ref<CellValue[][]>(hf.getSheetValues(0));

function updateCell(row: number, col: number, value: RawCellContent) {
  hf.setCellContents({ sheet: 0, row, col }, value);
  values.value = hf.getSheetValues(0);
}

onUnmounted(() => hf.destroy());
</script>
```

`markRaw` is essential when the instance is exposed directly — without it, Vue wraps it in a Proxy that breaks internal state. The class wrapper approach avoids this because the instance stays private.

### Server-side rendering (Nuxt)

HyperFormula depends on browser-only APIs. In Nuxt, render the spreadsheet on the client only — wrap the component with `<ClientOnly>` or instantiate the instance inside `onMounted` rather than at the top of `<script setup>`:

```vue
<script setup lang="ts">
import { markRaw, onMounted, onUnmounted, ref } from 'vue';
import type { HyperFormula as HyperFormulaType, CellValue } from 'hyperformula';

const hf = ref<HyperFormulaType | null>(null);
const values = ref<CellValue[][]>([]);

onMounted(async () => {
  const { HyperFormula } = await import('hyperformula');
  // markRaw must be applied before the instance is assigned to any ref or reactive
  const instance = markRaw(HyperFormula.buildFromArray([/* data */], { licenseKey: 'gpl-v3' }));
  hf.value = instance;
  values.value = instance.getSheetValues(0);
});

onUnmounted(() => hf.value?.destroy());
</script>
```

### Reacting to internal changes

If you mutate the engine from multiple places (not just one `updateCell`), subscribe to HyperFormula's `valuesUpdated` event once and refresh `values.value` from the handler rather than calling `getSheetValues` after every mutation. Always remove the listener in `onUnmounted` to avoid stale closures:

```typescript
function onValuesUpdated() {
  values.value = hf.getSheetValues(0);
}

hf.on('valuesUpdated', onValuesUpdated);
onUnmounted(() => hf.off('valuesUpdated', onValuesUpdated));
```

### Sharing the instance across components (Pinia)

If the same engine is used from multiple components, put it in a Pinia store. Apply `markRaw` inside the store so Pinia does not proxy the instance:

```typescript
import { defineStore } from 'pinia';
import { markRaw, ref } from 'vue';
import { HyperFormula, type CellValue, type RawCellContent } from 'hyperformula';

export const useSpreadsheetStore = defineStore('spreadsheet', () => {
  // Keep hf private — exposing the raw instance lets callers bypass the store's
  // updateCell and also risks Pinia devtools trying to serialise it.
  const hf = markRaw(HyperFormula.buildFromArray([/* data */], { licenseKey: 'gpl-v3' }));
  const values = ref<CellValue[][]>(hf.getSheetValues(0));

  function updateCell(row: number, col: number, value: RawCellContent) {
    hf.setCellContents({ sheet: 0, row, col }, value);
    values.value = hf.getSheetValues(0);
  }

  return { values, updateCell };
});
```

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
