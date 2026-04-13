# Integration with React

Installing HyperFormula in a React application works the same as with vanilla JavaScript.

For more details, see the [client-side installation](client-side-installation.md) section.

## Basic usage

Hold the HyperFormula instance in a `useRef` so it persists across re-renders. Initialize it inside a `useEffect` hook and destroy it in the cleanup function.

```javascript
import { useEffect, useRef, useState } from 'react';
import { HyperFormula } from 'hyperformula';

function SpreadsheetComponent() {
  const hfRef = useRef(null);
  const [values, setValues] = useState([]);

  useEffect(() => {
    hfRef.current = HyperFormula.buildFromArray(
      [
        // your data goes here
      ],
      {
        // your configuration goes here
      }
    );

    setValues(hfRef.current.getSheetValues(0));

    return () => hfRef.current?.destroy();
  }, []);

  // render `values` as a table
}
```

To update a cell and re-render with the new calculated values, call `setCellContents` and re-read the sheet:

```javascript
hfRef.current.setCellContents({ sheet: 0, row, col }, newValue);
setValues(hfRef.current.getSheetValues(0));
```

## Demo

For a more advanced example, check out the [React demo on Stackblitz](https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/react-demo?v=${$page.buildDateURIEncoded}).
