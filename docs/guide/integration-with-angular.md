# Integration with Angular

Installing HyperFormula in an Angular application works the same as with vanilla JavaScript.

For more details, see the [client-side installation](client-side-installation.md) section.

## Basic usage

Wrap the HyperFormula instance in an injectable service. Create it in the constructor, expose methods for reading and updating data, and destroy it in `ngOnDestroy`.

```typescript
import { Injectable, OnDestroy } from '@angular/core';
import { HyperFormula } from 'hyperformula';

@Injectable({ providedIn: 'root' })
export class SpreadsheetService implements OnDestroy {
  private hf: HyperFormula;

  constructor() {
    this.hf = HyperFormula.buildFromArray(
      [
        // your data goes here
      ],
      {
        // your configuration goes here
      }
    );
  }

  getSheetValues() {
    return this.hf.getSheetValues(0);
  }

  updateCell(row: number, col: number, value: unknown) {
    this.hf.setCellContents({ sheet: 0, row, col }, value);
  }

  ngOnDestroy() {
    this.hf.destroy();
  }
}
```

Inject the service into a component and use it to read values or react to user input:

```typescript
constructor(private readonly spreadsheet: SpreadsheetService) {}

values = this.spreadsheet.getSheetValues();
```

## Demo

For a more advanced example, check out the [Angular demo on Stackblitz](https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/angular-demo?v=${$page.buildDateURIEncoded}).
