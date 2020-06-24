# Sorting data

**HyperFormula does not support sorting natively.** 

However, a similar result can be achieved by batching **move** operations for columns. It works in a similar way to spreadsheet software like Excel or Google Sheets. That means HyperFormula first sorts the formulas by their results \(values\). Then, when the sorting is done, the formulas are re-calculated with regard to their new position.

### Demo

<iframe
   src="https://codesandbox.io/embed/github/handsontable/hyperformula-demos/tree/develop/sorting?autoresize=1&fontsize=14&hidenavigation=1&theme=dark&view=preview"
   style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
   title="handsontable/hyperformula-demos: basic-usage"
   allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
   sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
/>

