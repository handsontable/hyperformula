import { ExpectedValue} from '../benchmark'
import {sheetCellAddressToString} from '../../src/Cell'
import {CsvSheets} from '../../src/GraphBuilder'
import { sheetConfiguration, sheetInput, sheetL0W, sheetL0B, sheetL0Result, sheetL1Result, sheetL2W, sheetL2B, sheetL2Result, sheetL3Result, sheetL4W, sheetL4B, sheetL4Result, sheetL5Result, sheetTesting2 } from './13-sheet-d-sheets'

export function sheets(): CsvSheets {
  return {
    Configuration: sheetConfiguration,
    Input: sheetInput,
    L0W: sheetL0W,
    L0B: sheetL0B,
    L0Result: sheetL0Result,
    L1Result: sheetL1Result,
    L2W: sheetL2W,
    L2B: sheetL2B,
    L2Result: sheetL2Result,
    L3Result: sheetL3Result,
    L4W: sheetL4W,
    L4B: sheetL4B,
    L4Result: sheetL4Result,
    L5Result: sheetL5Result,
    Testing2: sheetTesting2,
  }
}

export function expectedValues(sheets: CsvSheets): ExpectedValue[] {
  return [
    { address: '$Configuration.B6', value: 3 },
  ]
}
