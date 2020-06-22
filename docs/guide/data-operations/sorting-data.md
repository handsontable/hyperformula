# Sorting data

**HyperFormula does not support sorting natively.** 

However, a similar result can be achieved by batching **move** operations for columns. It works in a similar way to spreadsheet software like Excel or Google Sheets. That means HyperFormula first sorts the formulas by their results \(values\). Then, when the sorting is done, the formulas are re-calculated with regard to their new position.

### Demo

{% embed url="https://codesandbox.io/s/hyperformula-sorting-data-lsz3c?file=/index.html" %}

{% embed url="https://codesandbox.io/s/hyperformula-sorting-with-move-operation-yl0tm" %}

