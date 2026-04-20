# Integration with Svelte

The HyperFormula API is identical in a Svelte app and in plain JavaScript. What changes is how you scope the engine to a component's lifetime and how you bridge its values into Svelte's reactivity.

Install with `npm install hyperformula`. For other options, see the [client-side installation](client-side-installation.md) section.

The snippets below target **Svelte 5** (runes mode) — the current stable release. They assume a project created from the official `sv` / SvelteKit templates, which enable runes by default.

::: warning SvelteKit SSR
The primary snippet below assumes a browser environment. If you use SvelteKit with default SSR, skip to [Server-side rendering](#server-side-rendering-sveltekit) — initializing `HyperFormula.buildFromArray` at `<script>` top level would run on every server render, duplicating work and creating instances the server never releases.
:::

## Basic usage

Declare the engine at the top of `<script>` so it lives for the component's lifetime. Wrap values that drive the UI in the `$state` rune so the template updates when you reassign them. Release the engine with `onDestroy`.

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { HyperFormula, type CellValue } from 'hyperformula';

  const data = [
    [1, 2, '=A1+B1'],
    // your data rows go here
  ];

  const hf = HyperFormula.buildFromArray(data, {
    licenseKey: 'gpl-v3',
    // more configuration options go here
  });

  const sheetId = 0;
  let result = $state<CellValue>(null);

  function calculate() {
    result = hf.getCellValue({ sheet: sheetId, row: 0, col: 2 });
  }

  function reset() {
    result = null;
  }

  onDestroy(() => hf.destroy());
</script>

<button onclick={calculate}>Run calculations</button>
<button onclick={reset}>Reset</button>
{#if result !== null}
  <p>Result: <strong>{result}</strong></p>
{/if}

<table>
  <tbody>
    {#each data as row, r}
      <tr>
        {#each row as _cell, c}
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

A few things worth calling out:

- `hf` stays a plain `const` — it's a reference that never changes, so it doesn't need `$state`. Svelte 5 doesn't deeply proxy class instances passed to `$state`, so storing an engine there is safe if you do need re-assignability, but don't reach for it without a reason.
- The table cell expressions read no reactive state, so they run once at render time. If you later mutate the sheet via `hf.setCellContents(...)` and want the table to refresh, copy the rows you need into a `$state` (or a `$derived`) and update that value after each mutation.

If you prefer plain JavaScript, drop `lang="ts"` and the type annotations — the runtime behavior is unchanged.

## Server-side rendering (SvelteKit)

HyperFormula is a heavyweight engine that has no role in server-rendered markup. Build it inside `onMount`, which only runs in the browser, and release it in `onDestroy`.

`onMount` is allowed to be `async`, but its cleanup function must be returned **synchronously** — an async callback always returns a Promise, so any cleanup you `return` from it is silently ignored. Put the teardown in a separate `onDestroy` instead.

```svelte
<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { CellValue, HyperFormula } from 'hyperformula';

  let hf = $state<HyperFormula | undefined>();
  let result = $state<CellValue>(null);

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

  // Separate onDestroy: onMount cannot return a cleanup from an async callback.
  onDestroy(() => hf?.destroy());

  function calculate() {
    if (!hf) return;
    result = hf.getCellValue({ sheet: 0, row: 0, col: 2 });
  }

  function reset() {
    result = null;
  }
</script>

<button onclick={calculate} disabled={!hf}>Run calculations</button>
<button onclick={reset}>Reset</button>
{#if result !== null}
  <p>Result: <strong>{result}</strong></p>
{/if}
```

Two details that matter for correctness:

- **`$state` around `hf`** — the engine is assigned asynchronously inside `onMount`, so the variable needs to be reactive for `disabled={!hf}` to flip once the engine is ready. Svelte 5 does not deep-proxy class instances stored in `$state`, so the HyperFormula instance remains untouched; only the reassignment is tracked.
- **Dynamic `await import('hyperformula')` + type-only `import type`** — the runtime import keeps the module out of the server bundle, while `import type` is erased at compile time, so it adds nothing to the server payload while still giving you full type checking.

## Next steps

- [Configuration options](configuration-options.md) — full list of `buildFromArray` / `buildEmpty` options
- [Basic operations](basic-operations.md) — CRUD on cells, rows, columns, sheets
- [Advanced usage](advanced-usage.md) — multi-sheet workbooks, named expressions
- [Custom functions](custom-functions.md) — register your own formulas

## Demo

For a more advanced example, check out the <a :href="'https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/svelte-demo?v=' + $page.buildDateURIEncoded">Svelte demo on Stackblitz</a>.
