# Integration with Angular

The HyperFormula API is identical in an Angular app and in plain JavaScript. What changes is where the engine lives (typically an injectable service), how it is cleaned up, and how you bridge its values into the change-detection cycle.

Install with `npm install hyperformula`. For other options, see the [client-side installation](client-side-installation.md) section.

## Basic usage

Wrap the engine in an `@Injectable` service backed by a `BehaviorSubject`. Components subscribe to the observable with the `async` pipe, which handles subscription cleanup automatically.

```typescript
// spreadsheet.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HyperFormula, type CellValue, type RawCellContent } from 'hyperformula';

@Injectable({ providedIn: 'root' })
export class SpreadsheetService {
  private readonly hf: HyperFormula;

  private readonly _values = new BehaviorSubject<CellValue[][]>([]);
  readonly values$ = this._values.asObservable();

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
    this._values.next(this.hf.getSheetValues(0));
  }

  updateCell(row: number, col: number, value: RawCellContent) {
    this.hf.setCellContents({ sheet: 0, row, col }, value);
    this._values.next(this.hf.getSheetValues(0));
  }
}
```

Consume the service from a component and bind `values$ | async` in the template:

```typescript
// spreadsheet.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { SpreadsheetService } from './spreadsheet.service';
import { type CellValue } from 'hyperformula';

@Component({
  selector: 'app-spreadsheet',
  templateUrl: './spreadsheet.component.html',
  // For NgModule-based apps, declare this component in AppModule and import
  // CommonModule there instead of in the component itself.
  imports: [CommonModule],
  standalone: true,
})
export class SpreadsheetComponent {
  values$: Observable<CellValue[][]>;

  constructor(private spreadsheetService: SpreadsheetService) {
    this.values$ = this.spreadsheetService.values$;
  }

  updateCell(row: number, col: number, value: string) {
    this.spreadsheetService.updateCell(row, col, value);
  }
}
```

```html
<!-- spreadsheet.component.html -->
<table>
  <tr *ngFor="let row of values$ | async; let r = index">
    <td *ngFor="let cell of row; let c = index">{{ cell }}</td>
  </tr>
</table>
```

## Notes

### Provider scope

`providedIn: 'root'` makes the service an application-wide singleton — suitable when a single HyperFormula instance is shared across the app. For per-feature or per-component instances (for example, several independent reports on one screen), provide the service at the component level via `providers: [SpreadsheetService]`; the service is then created and destroyed alongside the component.

### Cleanup

Root-scoped services live for the application's full lifetime — `ngOnDestroy` fires only at app shutdown. If you scope the service to a component (`providers: [SpreadsheetService]`), implement `OnDestroy` to release the engine:

```typescript
import { Injectable, OnDestroy } from '@angular/core';

@Injectable()
export class SpreadsheetService implements OnDestroy {
  // ...

  ngOnDestroy() {
    this.hf.destroy();
  }
}
```


## Next steps

- [Configuration options](configuration-options.md) — full list of `buildFromArray` / `buildEmpty` options
- [Basic operations](basic-operations.md) — CRUD on cells, rows, columns, sheets
- [Advanced usage](advanced-usage.md) — multi-sheet workbooks, named expressions
- [Custom functions](custom-functions.md) — register your own formulas

## Demo

For a more advanced example, check out the <a :href="'https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/angular-demo?v=' + $page.buildDateURIEncoded">Angular demo on Stackblitz</a>.
