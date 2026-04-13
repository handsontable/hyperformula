# Integration with Angular

The HyperFormula API is identical in an Angular app and in plain JavaScript. What changes is where the engine lives (typically an injectable service), how it is cleaned up, and how you bridge its values into the change-detection cycle.

Install with `npm install hyperformula`. For other options, see the [client-side installation](client-side-installation.md) section.

## Basic usage

Wrap the engine in an `@Injectable` service. Use `DestroyRef` for cleanup and expose derived data as a `signal` so views using `ChangeDetectionStrategy.OnPush` update automatically.

```typescript
// spreadsheet.service.ts
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { CellValue, HyperFormula } from 'hyperformula';

@Injectable({ providedIn: 'root' })
export class SpreadsheetService {
  private readonly hf: HyperFormula;
  readonly values = signal<CellValue[][]>([]);

  constructor() {
    this.hf = HyperFormula.buildFromArray(
      [
        [1, 2, '=A1+B1'],
        // your data rows go here
      ],
      {
        licenseKey: 'gpl-v3',
        // more configuration options go here
      }
    );
    this.values.set(this.hf.getSheetValues(0));
    inject(DestroyRef).onDestroy(() => this.hf.destroy());
  }

  updateCell(row: number, col: number, value: unknown) {
    this.hf.setCellContents({ sheet: 0, row, col }, value);
    this.values.set(this.hf.getSheetValues(0));
  }
}
```

Use the service from a standalone component and bind `values()` in the template:

```typescript
// spreadsheet.component.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SpreadsheetService } from './spreadsheet.service';

@Component({
  standalone: true,
  selector: 'app-spreadsheet',
  templateUrl: './spreadsheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpreadsheetComponent {
  readonly spreadsheet = inject(SpreadsheetService);
}
```

## Notes

### Provider scope

`providedIn: 'root'` makes the service an application-wide singleton — suitable when a single HyperFormula instance is shared across the app. For per-feature or per-component instances (for example, several independent reports on one screen), provide the service at the component level via `providers: [SpreadsheetService]`; the service is then created and destroyed alongside the component, and `DestroyRef` fires at the expected moment.

### Why `DestroyRef` instead of `ngOnDestroy`

Services registered with `providedIn: 'root'` live for the lifetime of the application — Angular only invokes `ngOnDestroy` when the app itself is torn down. Using `DestroyRef.onDestroy` keeps cleanup behaviour consistent whether the service is root-scoped or component-scoped.

### RxJS variant

If your project uses RxJS and `async` pipes rather than signals, swap `signal` for `BehaviorSubject`:

```typescript
import { DestroyRef, Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CellValue, HyperFormula } from 'hyperformula';

@Injectable({ providedIn: 'root' })
export class SpreadsheetService {
  private readonly hf = HyperFormula.buildFromArray([/* data */], { licenseKey: 'gpl-v3' });
  readonly values$ = new BehaviorSubject<CellValue[][]>(this.hf.getSheetValues(0));

  constructor() {
    inject(DestroyRef).onDestroy(() => this.hf.destroy());
  }

  updateCell(row: number, col: number, value: unknown) {
    this.hf.setCellContents({ sheet: 0, row, col }, value);
    this.values$.next(this.hf.getSheetValues(0));
  }
}
```

Bind with `values$ | async` in the template. In standalone components, add `AsyncPipe` to the component's `imports` array:

```typescript
import { AsyncPipe } from '@angular/common';

@Component({
  standalone: true,
  imports: [AsyncPipe],
  // …
})
```

### Keeping recalculation outside the Angular zone

For large sheets or frequent edits, HyperFormula's synchronous recalculation can trigger unnecessary change-detection cycles. Wrap heavy calls with `NgZone.runOutsideAngular` and re-enter the zone only when publishing new values to signals or subjects:

```typescript
// inside SpreadsheetService
import { NgZone } from '@angular/core';

private readonly ngZone = inject(NgZone);

updateCell(row: number, col: number, value: unknown) {
  this.ngZone.runOutsideAngular(() => {
    this.hf.setCellContents({ sheet: 0, row, col }, value);
    const next = this.hf.getSheetValues(0);
    this.ngZone.run(() => this.values.set(next));
  });
}
```

## Next steps

- [Configuration options](configuration-options.md) — full list of `buildFromArray` / `buildEmpty` options
- [Basic operations](basic-operations.md) — CRUD on cells, rows, columns, sheets
- [Advanced usage](advanced-usage.md) — multi-sheet workbooks, named expressions
- [Custom functions](custom-functions.md) — register your own formulas

## Demo

For a more advanced example, check out the [Angular demo on Stackblitz](https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/angular-demo?v={{ $page.buildDateURIEncoded }}).
