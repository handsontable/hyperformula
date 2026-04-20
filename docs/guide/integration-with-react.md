# Integration with React

The HyperFormula API is identical in a React app and in plain JavaScript. What changes is where the engine lives in a component tree and how its lifecycle maps to React hooks.

Install with `npm install hyperformula`. For other options, see the [client-side installation](client-side-installation.md) section.

## Basic usage

Hold the HyperFormula instance in a `useRef` so it survives re-renders. Initialize it inside `useEffect` and release it in the cleanup function. Use `useState` to toggle between raw formulas and computed values.

```tsx
import { useEffect, useRef, useState } from 'react';
import { HyperFormula } from 'hyperformula';
import type { CellValue } from 'hyperformula';

export default function SpreadsheetComponent() {
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

In development, React 18 runs effects twice (mount → unmount → mount) to surface cleanup bugs. The pattern above is correct for StrictMode because `destroy()` runs before the re-mount creates a new instance, so no work leaks between the two lifecycles. Do not switch to a module-scoped singleton as a workaround — it will break StrictMode semantics.

### Server-side rendering (Next.js App Router)

The component above is already SSR-safe — the engine is constructed in `useEffect`, which never runs on the server. If you still want to skip the initial bundle on the server (it is a few hundred kB), wrap it in a client-only dynamic import.

In the App Router, `dynamic(..., { ssr: false })` is only allowed inside a client component. Put the dynamic call in a `'use client'` wrapper and import the wrapper from your server page:

```tsx
// app/spreadsheet/SpreadsheetLazy.tsx
'use client';
import dynamic from 'next/dynamic';

const SpreadsheetComponent = dynamic(
  () => import('./SpreadsheetComponent'),
  { ssr: false }
);

export default function SpreadsheetLazy() {
  return <SpreadsheetComponent />;
}
```

```tsx
// app/spreadsheet/page.tsx  ← server component, no 'use client'
import SpreadsheetLazy from './SpreadsheetLazy';

export default function Page() {
  return <SpreadsheetLazy />;
}
```

In the Pages Router, the same `dynamic(..., { ssr: false })` call works directly in the page file without a wrapper.

## Next steps

- [Configuration options](configuration-options.md) — full list of `buildFromArray` / `buildEmpty` options
- [Basic operations](basic-operations.md) — CRUD on cells, rows, columns, sheets
- [Advanced usage](advanced-usage.md) — multi-sheet workbooks, named expressions
- [Custom functions](custom-functions.md) — register your own formulas

## Demo

For a more advanced example, check out the <a :href="'https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/react-demo?v=' + $page.buildDateURIEncoded">React demo on Stackblitz</a>.
