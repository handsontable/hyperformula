# Integration with React

The HyperFormula API is identical in a React app and in plain JavaScript. What changes is where the engine lives in a component tree and how its lifecycle maps to React hooks.

Install with `npm install hyperformula`. For other options, see the [client-side installation](client-side-installation.md) section.

## Basic usage

Hold the HyperFormula instance in a `useRef` so it survives re-renders. Initialize it inside `useEffect` and release it in the cleanup function. Use `useState` to toggle between raw formulas and computed values.

```tsx
import { useEffect, useRef, useState } from 'react';
import { HyperFormula, CellValue } from 'hyperformula';

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

    return () => {
      hf.destroy();
      hfRef.current = null;
    };
  }, []);

  function runCalculations() {
    if (!hfRef.current) return;
    setValues(hfRef.current.getSheetValues(0));
  }

  function reset() {
    setValues([]);
  }

  return (
    <>
      <button onClick={runCalculations}>Run calculations</button>
      <button onClick={reset}>Reset</button>
      {values.length > 0 && (
        <table>
          <tbody>
            {values.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c}>{String(cell ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
```

If you use JavaScript instead of TypeScript, drop the type annotations — the rest of the pattern is unchanged.

## Notes

### `React.StrictMode` double invocation

In development, React runs effects twice (mount → unmount → mount) to surface cleanup bugs. The pattern above is correct for StrictMode because `destroy()` runs before the re-mount creates a new instance, so no work leaks between the two lifecycles. Do not switch to a module-scoped singleton as a workaround — it will break StrictMode semantics.

### Server-side rendering (Next.js)

HyperFormula itself runs in Node.js, and the component above is already safe under SSR: the engine is constructed inside `useEffect`, which runs only on the client, and the initial render emits no cell values. You only need to take extra steps if you want to keep the HyperFormula bundle out of the server-rendered HTML, in which case lazy-load the component with `next/dynamic` and `ssr: false`.

In the App Router, `ssr: false` is not allowed inside a Server Component, so declare the component with `'use client'` and create a small client-side wrapper that performs the dynamic import:

```tsx
// app/spreadsheet/SpreadsheetComponent.tsx
'use client';
// ... component definition as above
```

```tsx
// app/spreadsheet/SpreadsheetLazy.tsx  ← client component that owns the dynamic import
'use client';
import dynamic from 'next/dynamic';

export const SpreadsheetLazy = dynamic(
  () => import('./SpreadsheetComponent').then((m) => m.SpreadsheetComponent),
  { ssr: false }
);
```

```tsx
// app/spreadsheet/page.tsx  ← server component, no 'use client'
import { SpreadsheetLazy } from './SpreadsheetLazy';

export default function Page() {
  return <SpreadsheetLazy />;
}
```

Keeping `dynamic(..., { ssr: false })` in a dedicated client wrapper preserves the server component status of `page.tsx` so only the spreadsheet widget hydrates on the client. In the Pages Router, the same `dynamic(..., { ssr: false })` call can live directly in the page file — the App Router's Server Component restriction does not apply there.

## Next steps

- [Configuration options](configuration-options.md) — full list of `buildFromArray` / `buildEmpty` options
- [Basic operations](basic-operations.md) — CRUD on cells, rows, columns, sheets
- [Advanced usage](advanced-usage.md) — multi-sheet workbooks, named expressions
- [Custom functions](custom-functions.md) — register your own formulas

## Demo

For a more advanced example, check out the <a :href="'https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/react-demo?v=' + $page.buildDateURIEncoded">React demo on Stackblitz</a>.
