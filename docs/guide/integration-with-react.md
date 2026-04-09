# Integration with React

Installing HyperFormula in a React application works the same as with vanilla JavaScript.

For more details, see the [client-side installation](client-side-installation.md) section.

## Basic usage

### Step 1. Initialize HyperFormula

Use `useRef` to hold the HyperFormula instance so it persists across re-renders. Initialize it inside a `useEffect` hook.

```javascript
import { useRef, useEffect, useState } from 'react';
import { HyperFormula } from 'hyperformula';

function SpreadsheetComponent() {
  const hfRef = useRef(null);
  const [sheetData, setSheetData] = useState([]);

  useEffect(() => {
    // Create a HyperFormula instance with initial data.
    hfRef.current = HyperFormula.buildFromArray(
      [
        [10, 20, '=SUM(A1:B1)'],
        [30, 40, '=SUM(A2:B2)'],
      ],
      { licenseKey: 'gpl-v3' }
    );

    // Read calculated values from the sheet.
    const sheetId = 0;
    setSheetData(hfRef.current.getSheetValues(sheetId));

    return () => {
      // Clean up the instance when the component unmounts.
      hfRef.current?.destroy();
    };
  }, []);
```

### Step 2. Render the results

Display the calculated values in a table.

```javascript
  return (
    <table>
      <tbody>
        {sheetData.map((row, rowIdx) => (
          <tr key={rowIdx}>
            {row.map((cell, colIdx) => (
              <td key={colIdx}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Demo

Explore the full working example on [Stackblitz](https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/react-demo?v=${$page.buildDateURIEncoded}).
