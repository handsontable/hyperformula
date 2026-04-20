# Integration with Vue

The HyperFormula API is identical in a Vue 3 app and in plain JavaScript. What changes is how you keep the engine out of Vue's reactivity system and how you surface its values into the template.

Install with `npm install hyperformula`. For other options, see the [client-side installation](client-side-installation.md) section.

## Basic usage

The idiomatic Vue 3 way to encapsulate stateful logic is a [composable](https://vuejs.org/guide/reusability/composables.html). Create one function that owns the HyperFormula instance, exposes the derived state as refs, and cleans up on unmount.

```typescript
// use-spreadsheet.ts
import { onBeforeUnmount, shallowRef } from 'vue';
import { HyperFormula, type CellValue, type Sheet } from 'hyperformula';

export function useSpreadsheet(initialData: Sheet) {
  // Plain `const` — Vue only proxies values passed to ref()/reactive(),
  // so the engine never enters the reactivity system. See Troubleshooting
  // for the case where you do need to hold it in reactive state.
  const hf = HyperFormula.buildFromArray(initialData, {
    licenseKey: 'gpl-v3',
    // more configuration options go here
  });

  // shallowRef triggers re-renders on reassignment of `.value` but
  // does not recursively proxy the grid — cheap for large result sets.
  const values = shallowRef<CellValue[][]>([]);

  function runCalculations() {
    values.value = hf.getSheetValues(0);
  }

  function reset() {
    values.value = [];
  }

  onBeforeUnmount(() => hf.destroy());

  return { values, runCalculations, reset };
}
```

Use the composable from a component with `<script setup>`:

```vue
<script setup lang="ts">
import { useSpreadsheet } from './use-spreadsheet';

const { values, runCalculations, reset } = useSpreadsheet([
  [1, 2, '=A1+B1'],
  // your data rows go here
]);
</script>

<template>
  <button type="button" @click="runCalculations">Run calculations</button>
  <button type="button" @click="reset">Reset</button>
  <table v-if="values.length">
    <tr v-for="(row, r) in values" :key="r">
      <td v-for="(cell, c) in row" :key="c">{{ cell }}</td>
    </tr>
  </table>
</template>
```

Two things are doing the real work here:

- `hf` is a plain local variable, so Vue never wraps it in a Proxy. Reactivity is opt-in in Vue 3 — only values passed through `ref`, `reactive`, `shallowRef`, etc. become reactive.
- `values` is a `shallowRef`, so the template re-renders whenever you reassign `values.value`, but the rows and cells themselves are not recursively converted to reactive Proxies. This is the right default for data you replace wholesale (as opposed to mutating in place).

## Notes

### Server-side rendering (Nuxt)

HyperFormula depends on browser-only APIs and should not run during SSR. In Nuxt, wrap the component with [`<ClientOnly>`](https://nuxt.com/docs/api/components/client-only) so its `setup` executes on the client only:

```vue
<template>
  <ClientOnly>
    <Spreadsheet />
  </ClientOnly>
</template>
```

## Troubleshooting

### Vue reactivity issues

If you encounter an error like

```
Uncaught TypeError: Cannot read properties of undefined (reading 'licenseKeyValidityState')
```

it means Vue's reactivity system wrapped the HyperFormula instance in a `Proxy`. That proxy intercepts every property access; when it reaches a non-trivial instance with its own internal state, identity checks and lazy-initialized maps break.

This only happens when you place the instance inside reactive state — for example, in a `reactive({...})` object, a Pinia store, or a `ref()`. The fix is to mark it raw with [`markRaw`](https://vuejs.org/api/reactivity-advanced.html#markraw) before it gets there:

```typescript
import { markRaw } from 'vue';
import { HyperFormula } from 'hyperformula';

const hf = markRaw(
  HyperFormula.buildEmpty({
    licenseKey: 'gpl-v3',
  })
);
```

`markRaw` flags the object so Vue skips it on every subsequent call to `reactive`, `ref`, or similar. It must be applied to the instance itself — `shallowRef` only skips proxying at the top level, so writing the raw instance into a nested reactive structure (e.g. a Pinia store) would still wrap it.

If you keep the instance in a plain `const` (or inside a composable, as shown [above](#basic-usage)), you do not need `markRaw` — the instance never enters the reactivity system in the first place.

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
