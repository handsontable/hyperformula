/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {
  absoluteSheetReference,
  invalidSimpleRowAddress,
  SimpleCellAddress,
  simpleRowAddress,
  SimpleRowAddress
} from '../Cell'
import {Maybe} from '../Maybe'
import {AddressWithRow} from './Address'
import {ReferenceType} from './ColumnAddress'

export class RowAddress implements AddressWithRow {
  constructor(
    public readonly type: ReferenceType,
    public readonly row: number,
    public readonly sheet?: number,
  ) {
  }

  public static absolute(row: number, sheet?: number) {
    return new RowAddress(ReferenceType.ABSOLUTE, row, sheet)
  }

  public static relative(row: number, sheet?: number) {
    return new RowAddress(ReferenceType.RELATIVE, row, sheet)
  }

  public isRowAbsolute(): boolean {
    return (this.type === ReferenceType.ABSOLUTE)
  }

  public isRowRelative(): boolean {
    return (this.type === ReferenceType.RELATIVE)
  }

  public isAbsolute(): boolean {
    return (this.type === ReferenceType.ABSOLUTE && this.sheet !== undefined)
  }

  public moved(toSheet: number, toRight: number, toBottom: number): RowAddress {
    const newSheet = this.sheet === undefined ? undefined : toSheet
    return new RowAddress(this.type, this.row + toBottom, newSheet)
  }

  public shiftedByRows(numberOfColumns: number): RowAddress {
    return new RowAddress(this.type, this.row + numberOfColumns, this.sheet)
  }

  public toSimpleRowAddress(baseAddress: SimpleCellAddress): SimpleRowAddress {
    const sheet = absoluteSheetReference(this, baseAddress)
    let row = this.row
    if (this.isRowRelative()) {
      row = baseAddress.row + this.row
    }
    return simpleRowAddress(sheet, row)
  }

  public shiftRelativeDimensions(toRight: number, toBottom: number): RowAddress {
    const row = this.isRowRelative() ? this.row + toBottom : this.row
    return new RowAddress(this.type, row, this.sheet)
  }

  public shiftAbsoluteDimensions(toRight: number, toBottom: number): RowAddress {
    const row = this.isRowAbsolute() ? this.row + toBottom : this.row
    return new RowAddress(this.type, row, this.sheet)
  }

  public withAbsoluteSheet(sheet: number): RowAddress {
    return new RowAddress(this.type, this.row, sheet)
  }

  public isInvalid(baseAddress: SimpleCellAddress): boolean {
    return this.toSimpleRowAddress(baseAddress).row < 0
  }

  public hash(withSheet: boolean): string {
    const sheetPart = withSheet && this.sheet !== undefined ? `#${this.sheet}` : ''
    switch (this.type) {
      case ReferenceType.RELATIVE: {
        return `${sheetPart}#ROWR${this.row}`
      }
      case ReferenceType.ABSOLUTE: {
        return `${sheetPart}#ROWA${this.row}`
      }
    }
  }

  public unparse(baseAddress: SimpleCellAddress): Maybe<string> {
    const simpleAddress = this.toSimpleRowAddress(baseAddress)
    if (invalidSimpleRowAddress(simpleAddress)) {
      return undefined
    }
    const dollar = this.type === ReferenceType.ABSOLUTE ? '$' : ''
    return `${dollar}${simpleAddress.row + 1}`
  }

  public exceedsSheetSizeLimits(maxRows: number): boolean {
    return this.row >= maxRows
  }
}
