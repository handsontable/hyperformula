# Integration with React

The HyperFormula API is identical in a React app and in plain JavaScript. What changes is where the engine lives in a component tree and how its lifecycle maps to React hooks.

Install with `npm install hyperformula`. For other options, see the [client-side installation](client-side-installation.md) section.

## Basic usage

Hold the HyperFormula instance in a `useRef` so it survives re-renders. Initialize it inside `useEffect` and release it in the cleanup function. Mirror the computed sheet values in `useState` so React re-renders when they change.

```tsx
import { useEffect, useRef, useState } from 'react';
import { HyperFormula, CellValue, RawCellContent } from 'hyperformula';

export function SpreadsheetComponent() {
  const hfRef = useRef<HyperFormula | null>(null);
  const [values, setValues] = useState<CellValue[][]>([]);

  useEffect(() => {
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
    hfRef.current = hf;
    setValues(hf.getSheetValues(0));

    return () => {
      hf.destroy();
      hfRef.current = null;
    };
  }, []);

  function handleCellEdit(row: number, col: number, newValue: RawCellContent) {
    if (!hfRef.current) return;
    try {
      hfRef.current.setCellContents({ sheet: 0, row, col }, newValue);
      setValues(hfRef.current.getSheetValues(0));
    } catch (error) {
      // setCellContents can throw on invalid addresses or sheet-size limits.
      // Handle or surface the error according to your app's UX.
      console.error(error);
    }
  }

  return (
    <table>
      <tbody>
        {values.map((row, r) => (
          <tr key={r}>
            {row.map((cell, c) => (
              <td key={c}>
                <input
                  value={String(cell ?? '')}
                  onChange={(e) => handleCellEdit(r, c, e.target.value)}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

If you use JavaScript instead of TypeScript, drop the type annotations — the rest of the pattern is unchanged.

## Notes

### `React.StrictMode` double invocation

In development, React 18 runs effects twice (mount → unmount → mount) to surface cleanup bugs. The pattern above is correct for StrictMode because `destroy()` runs before the re-mount creates a new instance, so no work leaks between the two lifecycles. Do not switch to a module-scoped singleton as a workaround — it will break StrictMode semantics.

### Server-side rendering (Next.js)

HyperFormula depends on browser-only APIs. In the Next.js App Router, mark the file with `'use client'` and load the component only on the client:

```tsx
// app/spreadsheet/page.tsx
'use client';

import dynamic from 'next/dynamic';
const SpreadsheetComponent = dynamic(
  () => import('./SpreadsheetComponent').then((m) => m.SpreadsheetComponent),
  { ssr: false }
);

export default function Page() {
  return <SpreadsheetComponent />;
}
```

In the Pages Router, the same `dynamic(..., { ssr: false })` pattern works without `'use client'`.

## Next steps

- [Configuration options](configuration-options.md) — full list of `buildFromArray` / `buildEmpty` options
- [Basic operations](basic-operations.md) — CRUD on cells, rows, columns, sheets
- [Advanced usage](advanced-usage.md) — multi-sheet workbooks, named expressions
- [Custom functions](custom-functions.md) — register your own formulas

## Demo

For a more advanced example, check out the [React demo on Stackblitz](https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/react-demo?v={{ $page.buildDateURIEncoded }}).
