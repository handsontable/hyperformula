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
  /** @type {import('hyperformula').CellValue} */
  let result = null;

  function calculate() {
    result = hf.getCellValue({ sheet: sheetId, row: 0, col: 2 });
  }

  function reset() {
    result = null;
  }

  onDestroy(() => hf.destroy());
</script>

<button on:click={calculate}>Run calculations</button>
<button on:click={reset}>Reset</button>
{#if result !== null}
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

## Server-side rendering (SvelteKit)

HyperFormula depends on browser-only APIs. In SvelteKit, initialize the engine inside `onMount` so the code never runs during SSR:

`onMount` is allowed to be `async`, but any cleanup function returned from an async callback is silently ignored — an async function always returns a `Promise`, not the cleanup. Put the teardown in a separate `onDestroy` instead:

```svelte
<script>
  // Svelte 4 + SvelteKit
  import { onDestroy, onMount } from 'svelte';

  let hf;
  /** @type {import('hyperformula').CellValue} */
  let result = null;

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

  // Separate onDestroy — async onMount cannot return a cleanup.
  onDestroy(() => hf?.destroy());

  function calculate() {
    if (!hf) return;
    result = hf.getCellValue({ sheet: 0, row: 0, col: 2 });
  }

  function reset() {
    result = null;
  }
</script>

<button on:click={calculate}>Run calculations</button>
<button on:click={reset}>Reset</button>
{#if result !== null}
  <p>Result: <strong>{result}</strong></p>
{/if}
```


## Next steps

- [Configuration options](configuration-options.md) — full list of `buildFromArray` / `buildEmpty` options
- [Basic operations](basic-operations.md) — CRUD on cells, rows, columns, sheets
- [Advanced usage](advanced-usage.md) — multi-sheet workbooks, named expressions
- [Custom functions](custom-functions.md) — register your own formulas

## Demo

For a more advanced example, check out the <a :href="'https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/svelte-demo?v=' + $page.buildDateURIEncoded">Svelte demo on Stackblitz</a>.
