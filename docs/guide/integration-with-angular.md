# Integration with Angular

The HyperFormula API is identical in an Angular app and in plain JavaScript. This guide demonstrates how HyperFormula is integrated with an Angular app (typically as an injectable service), how it is cleaned up, and how you bridge its values into the change-detection cycle.

Install with `npm install hyperformula`. For other options, see the [client-side installation](client-side-installation.md) section.

## Basic usage

Wrap the engine in an `@Injectable` service backed by a `BehaviorSubject`. Components subscribe to the observable with the `async` pipe, which handles subscription cleanup automatically.

```typescript
// spreadsheet.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HyperFormula, type CellValue } from 'hyperformula';

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

  calculate() {
    this._values.next(this.hf.getSheetValues(0));
  }

  reset() {
    this._values.next([]);
  }
}
```

Consume the service from a component and bind `values$ | async` in the template. Declare the component in your `AppModule` alongside `CommonModule`:

```typescript
// spreadsheet.component.ts
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { SpreadsheetService } from './spreadsheet.service';
import { type CellValue } from 'hyperformula';

@Component({
  selector: 'app-spreadsheet',
  templateUrl: './spreadsheet.component.html',
})
export class SpreadsheetComponent {
  values$: Observable<CellValue[][]>;

  constructor(private spreadsheetService: SpreadsheetService) {
    this.values$ = this.spreadsheetService.values$;
  }

  runCalculations() {
    this.spreadsheetService.calculate();
  }

  reset() {
    this.spreadsheetService.reset();
  }
}
```

```html
<!-- spreadsheet.component.html -->
<button (click)="runCalculations()">Run calculations</button>
<button (click)="reset()">Reset</button>
<ng-container *ngIf="(values$ | async) as values">
  <table *ngIf="values.length">
    <tr *ngFor="let row of values">
      <td *ngFor="let cell of row">{{ cell }}</td>
    </tr>
  </table>
</ng-container>
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
