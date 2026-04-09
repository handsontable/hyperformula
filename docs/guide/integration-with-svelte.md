# Integration with Svelte

Installing HyperFormula in a Svelte application works the same as with vanilla JavaScript.

For more details, see the [client-side installation](client-side-installation.md) section.

## Basic usage

### Step 1. Initialize HyperFormula

Create the HyperFormula instance directly in the component's `<script>` block. Use a reactive variable for the results.

```html
<script>
  import { HyperFormula } from 'hyperformula';

  // Create a HyperFormula instance with initial data.
  const hf = HyperFormula.buildFromArray(
    [
      [10, 20, '=SUM(A1:B1)'],
      [30, 40, '=SUM(A2:B2)'],
    ],
    { licenseKey: 'gpl-v3' }
  );

  const sheetId = 0;
  let data = [];

  function calculate() {
    data = hf.getSheetValues(sheetId);
  }
</script>
```

### Step 2. Render the results

Display the data in a table and trigger calculation with a button.

```html
<button on:click={calculate}>Calculate</button>

<table>
  {#each data as row, rowIdx}
    <tr>
      {#each row as cell, colIdx}
        <td>{cell}</td>
      {/each}
    </tr>
  {/each}
</table>
```

## Demo

Explore the full working example on [Stackblitz](https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/svelte-demo?v=${$page.buildDateURIEncoded}).
