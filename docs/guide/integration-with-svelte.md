# Integration with Svelte

The HyperFormula API is identical in a Svelte app and in plain JavaScript. What changes is how you scope the engine to a component's lifetime and how you bridge its values into Svelte's reactivity.

Install with `npm install hyperformula`. For other options, see the [client-side installation](client-side-installation.md) section.

::: warning SvelteKit SSR
The primary snippet below assumes a browser environment. If you use SvelteKit with default SSR, skip to [Server-side rendering](#server-side-rendering-sveltekit) — `HyperFormula.buildFromArray` at `<script>` top level will crash on the server.
:::

## Basic usage

Declare the engine at the top of `<script>` so it lives for the component's lifetime. Call `getCellValue` on demand and display results in the template. Release the engine with `onDestroy`.

```svelte
<script>
  import { onDestroy } from 'svelte';
  import { HyperFormula } from 'hyperformula';

  const data = [
    [1, 2, '=A1+B1'],
    // your data rows go here
  ];

  const hf = HyperFormula.buildFromArray(data, {
    licenseKey: 'gpl-v3',
    // more configuration options go here
  });

  const sheetId = 0;
  let result = '';

  function calculate() {
    result = hf.getCellValue({ sheet: sheetId, row: 0, col: 2 });
  }

  onDestroy(() => hf.destroy());
</script>

<button on:click={calculate}>Calculate</button>
{#if result !== ''}
  <p>Result: <strong>{result}</strong></p>
{/if}

<table>
  <tbody>
    {#each data as row, r}
      <tr>
        {#each row as cell, c}
          <td>
            {#if hf.doesCellHaveFormula({ sheet: sheetId, row: r, col: c })}
              {hf.getCellFormula({ sheet: sheetId, row: r, col: c })}
            {:else}
              {hf.getCellValue({ sheet: sheetId, row: r, col: c })}
            {/if}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
```

### Svelte 5 (runes)

Under Svelte 5, hold the sheet values in a `$state` rune so reassignment triggers re-rendering. Replace `on:click` with the `onclick` attribute:

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { HyperFormula, type CellValue, type RawCellContent } from 'hyperformula';

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

  function updateCell(row: number, col: number, value: RawCellContent) {
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

## Server-side rendering (SvelteKit)

HyperFormula depends on browser-only APIs. In SvelteKit, initialize the engine inside `onMount` so the code never runs during SSR:

```svelte
<script>
  // Svelte 4 + SvelteKit
  import { onMount, onDestroy } from 'svelte';

  let hf;
  let result = '';

  onMount(async () => {
    const { HyperFormula } = await import('hyperformula');
    hf = HyperFormula.buildFromArray(
      [
        [1, 2, '=A1+B1'],
        // your data rows go here
      ],
      { licenseKey: 'gpl-v3' }
    );
  });

  function calculate() {
    if (!hf) return;
    result = hf.getCellValue({ sheet: 0, row: 0, col: 2 });
  }

  onDestroy(() => hf?.destroy());
</script>

<button on:click={calculate}>Calculate</button>
{#if result !== ''}
  <p>Result: <strong>{result}</strong></p>
{/if}
```

For Svelte 5 + SvelteKit, replace `let result = ''` with `let result = $state('')` and `on:click` with `onclick`. As an alternative, guard the top-level init with `if (browser)` from `$app/environment`.

## Next steps

- [Configuration options](configuration-options.md) — full list of `buildFromArray` / `buildEmpty` options
- [Basic operations](basic-operations.md) — CRUD on cells, rows, columns, sheets
- [Advanced usage](advanced-usage.md) — multi-sheet workbooks, named expressions
- [Custom functions](custom-functions.md) — register your own formulas

## Demo

For a more advanced example, check out the [Svelte demo on Stackblitz](https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/svelte-demo?v={{ $page.buildDateURIEncoded }}).
