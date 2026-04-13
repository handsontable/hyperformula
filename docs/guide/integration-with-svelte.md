# Integration with Svelte

The HyperFormula API is identical in a Svelte app and in plain JavaScript. What changes is how you scope the engine to a component's lifetime and how you bridge its values into Svelte's reactivity.

Install with `npm install hyperformula`. For other options, see the [client-side installation](client-side-installation.md) section.

::: warning SvelteKit SSR
The primary snippet below assumes a browser environment. If you use SvelteKit with default SSR, skip to [Server-side rendering](#server-side-rendering-sveltekit) — `HyperFormula.buildFromArray` at `<script>` top level will crash on the server.
:::

## Basic usage (Svelte 5, with runes)

Declare the engine at the top of `<script>` so it lives for the component's lifetime. Hold derived data in a `$state` rune so reassignment triggers re-rendering. Release the engine with `onDestroy`.

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { HyperFormula, type CellValue } from 'hyperformula';

  const hf = HyperFormula.buildFromArray(
    [
      [1, 2, '=A1+B1'],
      // your data rows go here
    ],
    {
      licenseKey: 'gpl-v3',
      // more configuration options go here
    }
  );

  let values = $state<CellValue[][]>(hf.getSheetValues(0));

  function updateCell(row: number, col: number, value: unknown) {
    hf.setCellContents({ sheet: 0, row, col }, value);
    values = hf.getSheetValues(0);
  }

  onDestroy(() => hf.destroy());
</script>

<table>
  {#each values as row, r}
    <tr>
      {#each row as cell, c}
        <td>
          <input
            value={cell ?? ''}
            onchange={(e) => updateCell(r, c, (e.target as HTMLInputElement).value)}
          />
        </td>
      {/each}
    </tr>
  {/each}
</table>
```

### Svelte 4

Under Svelte 4, replace `let values = $state<CellValue[][]>(...)` with plain `let values: CellValue[][] = ...`. The compiler transforms `let` reassignments into reactive updates automatically. Use `on:change` (colon syntax) instead of the Svelte 5 `onchange` attribute. Everything else — including `onDestroy` — is unchanged.

## Server-side rendering (SvelteKit)

HyperFormula depends on browser-only APIs. In SvelteKit, initialize the engine inside `onMount` so the code never runs during SSR:

```svelte
<script lang="ts">
  // Svelte 5 + SvelteKit
  import { onMount, onDestroy } from 'svelte';
  import type { HyperFormula as HyperFormulaType, CellValue } from 'hyperformula';

  let hf: HyperFormulaType | null = null;
  let values = $state<CellValue[][]>([]);

  onMount(async () => {
    const { HyperFormula } = await import('hyperformula');
    hf = HyperFormula.buildFromArray(
      [
        [1, 2, '=A1+B1'],
        // your data rows go here
      ],
      { licenseKey: 'gpl-v3' }
    );
    values = hf.getSheetValues(0);
  });

  function updateCell(row: number, col: number, value: unknown) {
    if (!hf) return;
    hf.setCellContents({ sheet: 0, row, col }, value);
    values = hf.getSheetValues(0);
  }

  onDestroy(() => hf?.destroy());
</script>
```

Wire `updateCell` in the template the same way as in the Basic usage section (`<input ... onchange=...>`). For Svelte 4, replace `let values = $state<CellValue[][]>([])` with `let values: CellValue[][] = []`; the rest is identical. As an alternative, guard the top-level init with `if (browser)` from `$app/environment`.

## Next steps

- [Configuration options](configuration-options.md) — full list of `buildFromArray` / `buildEmpty` options
- [Basic operations](basic-operations.md) — CRUD on cells, rows, columns, sheets
- [Advanced usage](advanced-usage.md) — multi-sheet workbooks, named expressions
- [Custom functions](custom-functions.md) — register your own formulas

## Demo

For a more advanced example, check out the [Svelte demo on Stackblitz](https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/svelte-demo?v=${$page.buildDateURIEncoded}).
