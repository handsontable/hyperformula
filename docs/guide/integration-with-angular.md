# Integration with Angular

Installing HyperFormula in an Angular application works the same as with vanilla JavaScript.

For more details, see the [client-side installation](client-side-installation.md) section.

## Basic usage

### Step 1. Create a service

Wrap HyperFormula in an Angular service. Create the instance in the constructor and expose methods for reading data.

```typescript
import { Injectable, OnDestroy } from '@angular/core';
import { HyperFormula } from 'hyperformula';

@Injectable({ providedIn: 'root' })
export class SpreadsheetService implements OnDestroy {
  private hf: HyperFormula;
  private sheetId = 0;

  constructor() {
    // Create a HyperFormula instance with initial data.
    this.hf = HyperFormula.buildFromArray(
      [
        [10, 20, '=SUM(A1:B1)'],
        [30, 40, '=SUM(A2:B2)'],
      ],
      { licenseKey: 'gpl-v3' }
    );
  }

  /** Return calculated values for the entire sheet. */
  getSheetValues(): (number | string | null)[][] {
    return this.hf.getSheetValues(this.sheetId);
  }

  ngOnDestroy(): void {
    this.hf.destroy();
  }
}
```

### Step 2. Use the service in a component

Inject the service and display the calculated values.

```typescript
import { Component } from '@angular/core';
import { SpreadsheetService } from './spreadsheet.service';

@Component({
  selector: 'app-spreadsheet',
  template: `
    <table>
      <tr *ngFor="let row of data">
        <td *ngFor="let cell of row">{{ cell }}</td>
      </tr>
    </table>
  `,
})
export class SpreadsheetComponent {
  data: (number | string | null)[][];

  constructor(private spreadsheet: SpreadsheetService) {
    this.data = this.spreadsheet.getSheetValues();
  }
}
```

## Demo

Explore the full working example on [Stackblitz](https://stackblitz.com/github/handsontable/hyperformula-demos/tree/3.2.x/angular-demo?v=${$page.buildDateURIEncoded}).
