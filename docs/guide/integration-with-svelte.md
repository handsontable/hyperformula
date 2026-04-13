# Integration with Svelte

Installing HyperFormula in a Svelte application works the same as with vanilla JavaScript.

For more details, see the [client-side installation](client-side-installation.md) section.

## Basic usage

Initialize HyperFormula at the top of a component's `<script>` block. Svelte's reactivity handles updates automatically when you reassign the variable that holds the calculated values.

```html
<script>
  import { HyperFormula } from 'hyperformula';

  const hf = HyperFormula.buildFromArray(
    [
      // your data goes here
    ],
    {
      // your configuration goes here
    }
  );

  let values = hf.getSheetValues(0);

  function updateCell(row, col, value) {
    hf.setCellContents({ sheet: 0, row, col }, value);
    values = hf.getSheetValues(0);
  }
</script>
```

## Demo

For a more advanced example, check out the [Svelte demo on Stackblitz](https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/svelte-demo?v=${$page.buildDateURIEncoded}).
