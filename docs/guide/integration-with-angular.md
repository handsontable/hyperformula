# Integration with Angular

The HyperFormula API is identical in an Angular app and in plain JavaScript. What changes is where the engine lives (typically an injectable service), how it is cleaned up, and how you expose its derived values as signals so the template stays in sync.

The snippets below target Angular 20 and later, where standalone components, the `@if` / `@for` control flow, `inject()`, `DestroyRef`, and signals are the idiomatic defaults.

Install with `npm install hyperformula`. For other options, see the [client-side installation](client-side-installation.md) section.

## Basic usage

Wrap the engine in an `@Injectable` service and expose its derived values through a `signal`. Components read the signal directly in the template — no subscriptions to manage, no async pipe needed.

```typescript
// spreadsheet.service.ts
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { HyperFormula, type CellValue } from 'hyperformula';

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

  calculate() {
    this.values.set(this.hf.getSheetValues(0));
  }

  reset() {
    this.values.set([]);
  }
}
```

Consume the service from a standalone component. Modern Angular apps bootstrap with `bootstrapApplication(AppComponent)` in `main.ts` — there is no `AppModule` and no `declarations` array to update.

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

The template reads the signal by calling `values()`. `@if` and `@for` are compiler built-ins, so the component does not need to import `CommonModule`.

## Notes

### Provider scope

`providedIn: 'root'` makes the service an application-wide singleton — suitable when a single HyperFormula instance is shared across the app. For per-feature or per-component instances (for example, several independent reports on one screen), provide the service at the component level with `providers: [SpreadsheetService]`; the service is then created when the component is created and torn down when it is destroyed.

### Cleanup

`inject(DestroyRef).onDestroy(...)` in the service constructor releases the engine automatically:

- For a root-provided service, the callback runs when the application is destroyed (`appRef.destroy()` or page unload).
- For a component-provided service, it runs when the owning component is destroyed.

This replaces the older `implements OnDestroy` / `ngOnDestroy()` pattern. `DestroyRef` callbacks fire after the injector is torn down, which is fine for releasing a HyperFormula engine — there is no other Angular state that needs to observe the shutdown.

### Signals vs. RxJS

The service above exposes state through a `WritableSignal` because the value is a plain snapshot produced by a synchronous engine call. If you already model your domain as RxJS streams, you can still keep `Observable`s in the service and bridge them with `toSignal()` at the component boundary — that keeps the template code signal-based while leaving stream composition in RxJS.

## Next steps

- [Configuration options](configuration-options.md) — full list of `buildFromArray` / `buildEmpty` options
- [Basic operations](basic-operations.md) — CRUD on cells, rows, columns, sheets
- [Advanced usage](advanced-usage.md) — multi-sheet workbooks, named expressions
- [Custom functions](custom-functions.md) — register your own formulas

## Demo

For a more advanced example, check out the <a :href="'https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/angular-demo?v=' + $page.buildDateURIEncoded">Angular demo on Stackblitz</a>.

::: tip
The linked demo targets an older Angular version and uses the NgModule + RxJS pattern. The snippets above reflect the current Angular idiom (standalone components, signals, `@if` / `@for`, `inject()`, `DestroyRef`) and should be preferred for new projects.
:::
