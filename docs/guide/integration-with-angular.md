# Integration with Angular

The HyperFormula API is identical in an Angular app and in plain JavaScript. This guide demonstrates how HyperFormula is integrated with an Angular app (typically as an injectable service), how it is cleaned up, and how you bridge its values into the change-detection cycle.

Install with `npm install hyperformula`. For other options, see the [client-side installation](client-side-installation.md) section.

## Basic usage (modern Angular)

For modern Angular (v20+) we recommend a service that exposes a **signal**, **standalone** components, the new control flow (`@if` / `@for`) and **zoneless** change detection. Wrap the engine in an `@Injectable` service and expose its values as a read-only signal; the template reads the signal directly and Angular refreshes the view whenever it changes.

```typescript
// spreadsheet.service.ts
import { Injectable, signal } from '@angular/core';
import { HyperFormula, type CellValue } from 'hyperformula';

@Injectable({ providedIn: 'root' })
export class SpreadsheetService {
  private readonly hf: HyperFormula;

  private readonly _values = signal<CellValue[][]>([]);
  readonly values = this._values.asReadonly();

  constructor() {
    this.hf = HyperFormula.buildFromArray(
      [
        [1, 4, '=A1+B1'],
        // your data rows go here
      ],
      {
        licenseKey: 'gpl-v3',
        // more configuration options go here
      }
    );
    this._values.set(this.hf.getSheetValues(0));
  }

  calculate() {
    this._values.set(this.hf.getSheetValues(0));
  }

  reset() {
    this._values.set([]);
  }
}
```

Inject the service with `inject()`, expose its signal, and use `OnPush` change detection:

```typescript
// spreadsheet.component.ts
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SpreadsheetService } from './spreadsheet.service';

@Component({
  selector: 'app-spreadsheet',
  templateUrl: './spreadsheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpreadsheetComponent {
  private readonly spreadsheetService = inject(SpreadsheetService);

  readonly values = this.spreadsheetService.values;

  runCalculations() {
    this.spreadsheetService.calculate();
  }

  reset() {
    this.spreadsheetService.reset();
  }
}
```

Read the signal in the template with the new control flow:

```html
<!-- spreadsheet.component.html -->
<button (click)="runCalculations()">Run calculations</button>
<button (click)="reset()">Reset</button>
@if (values().length) {
  <table>
    @for (row of values(); track $index) {
      <tr>
        @for (cell of row; track $index) {
          <td>{{ cell }}</td>
        }
      </tr>
    }
  </table>
}
```

Bootstrap the app with zoneless change detection:

```typescript
// main.ts
import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
}).catch((err) => console.error(err));
```

> Signals require Angular 16+, the new control flow Angular 17+, and `provideZonelessChangeDetection` Angular 20+. For earlier versions, use the `BehaviorSubject` approach below.


## Basic usage (older Angular versions)

For broader compatibility — including Angular versions without signals or zoneless change detection — wrap the engine in an `@Injectable` service backed by a `BehaviorSubject`. Components subscribe to the observable with the `async` pipe, which handles subscription cleanup automatically.

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
        [1, 4, '=A1+B1'],
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

Consume the service from a component and bind `values$ | async` in the template. The component below is **standalone** (the default since Angular 17) and imports `CommonModule` directly, so it works without an `NgModule`. The structural directives `*ngIf` / `*ngFor` and the `async` pipe all come from `CommonModule`:

```typescript
// spreadsheet.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { SpreadsheetService } from './spreadsheet.service';
import { type CellValue } from 'hyperformula';

@Component({
  selector: 'app-spreadsheet',
  standalone: true,
  imports: [CommonModule],
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

### `NgModule`-based apps (Angular 13 and older)

Standalone components require Angular 14 or newer. If your project still uses `NgModule`s (or targets Angular 13 or older), drop the `standalone: true` and `imports` fields from the component above, then declare it in your module and import `CommonModule` there instead:

```typescript
// app.module.ts
@NgModule({
  declarations: [SpreadsheetComponent],
  imports: [BrowserModule, CommonModule],
})
export class AppModule {}
```

The service and template above are unchanged — only the way the component is wired up differs.

## Notes

### Provider scope

The notes below apply to both the modern and older approaches — provider scope and cleanup depend on how the service is registered, not on whether it exposes a signal or a `BehaviorSubject`.

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

## Server-side rendering (Angular Universal)

The service above is already SSR-safe — HyperFormula has no browser-only API dependency. To skip the (otherwise wasted) server-side instantiation in Angular Universal, gate the engine init with [`isPlatformBrowser`](https://angular.dev/api/common/isPlatformBrowser) from `@angular/common`.

## Next steps

- [Configuration options](configuration-options.md) — full list of `buildFromArray` / `buildEmpty` options
- [Basic operations](basic-operations.md) — CRUD on cells, rows, columns, sheets
- [Advanced usage](advanced-usage.md) — multi-sheet workbooks, named expressions
- [Custom functions](custom-functions.md) — register your own formulas

## Demo

For a more advanced example, check out the <a :href="'https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.3.x/angular-demo?v=' + $page.buildDateURIEncoded">Angular demo on Stackblitz</a>.
