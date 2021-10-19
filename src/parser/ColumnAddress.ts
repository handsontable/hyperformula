/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {
  absoluteSheetReference,
  invalidSimpleColumnAddress,
  SimpleCellAddress,
  simpleColumnAddress,
  SimpleColumnAddress
} from '../Cell'
import {Maybe} from '../Maybe'
import {AddressWithColumn} from './Address'
import {columnIndexToLabel} from './addressRepresentationConverters'

export enum ReferenceType {
  RELATIVE = 'RELATIVE',
  ABSOLUTE = 'ABSOLUTE',
}

export class ColumnAddress implements AddressWithColumn {
  public constructor(
    public readonly type: ReferenceType,
    public readonly col: number,
    public readonly sheet?: number
  ) {
  }

  public static absolute(column: number, sheet?: number) {
    return new ColumnAddress(ReferenceType.ABSOLUTE, column, sheet)
  }

  public static relative(column: number, sheet?: number) {
    return new ColumnAddress(ReferenceType.RELATIVE, column, sheet)
  }

  public isColumnAbsolute(): boolean {
    return (this.type === ReferenceType.ABSOLUTE)
  }

  public isColumnRelative(): boolean {
    return (this.type === ReferenceType.RELATIVE)
  }

  public isAbsolute(): boolean {
    return (this.type === ReferenceType.ABSOLUTE && this.sheet !== undefined)
  }

  public moved(toSheet: number, toRight: number, _toBottom: number): ColumnAddress {
    const newSheet = this.sheet === undefined ? undefined : toSheet
    return new ColumnAddress(this.type, this.col + toRight, newSheet)
  }

  public shiftedByColumns(numberOfColumns: number): ColumnAddress {
    return new ColumnAddress(this.type, this.col + numberOfColumns, this.sheet)
  }

  public toSimpleColumnAddress(baseAddress: SimpleCellAddress): SimpleColumnAddress {
    const sheet = absoluteSheetReference(this, baseAddress)
    let column = this.col
    if (this.isColumnRelative()) {
      column = baseAddress.col + this.col
    }
    return simpleColumnAddress(sheet, column)
  }

  public shiftRelativeDimensions(toRight: number, _toBottom: number): ColumnAddress {
    const col = this.isColumnRelative() ? this.col + toRight : this.col
    return new ColumnAddress(this.type, col, this.sheet)
  }

  public shiftAbsoluteDimensions(toRight: number, _toBottom: number): ColumnAddress {
    const col = this.isColumnAbsolute() ? this.col + toRight : this.col
    return new ColumnAddress(this.type, col, this.sheet)
  }

  public withAbsoluteSheet(sheet: number): ColumnAddress {
    return new ColumnAddress(this.type, this.col, sheet)
  }

  public isInvalid(baseAddress: SimpleCellAddress): boolean {
    return this.toSimpleColumnAddress(baseAddress).col < 0
  }

  public hash(withSheet: boolean): string {
    const sheetPart = withSheet && this.sheet !== undefined ? `#${this.sheet}` : ''
    switch (this.type) {
      case ReferenceType.RELATIVE: {
        return `${sheetPart}#COLR${this.col}`
      }
      case ReferenceType.ABSOLUTE: {
        return `${sheetPart}#COLA${this.col}`
      }
    }
  }

  public unparse(baseAddress: SimpleCellAddress): Maybe<string> {
    const simpleAddress = this.toSimpleColumnAddress(baseAddress)
    if (invalidSimpleColumnAddress(simpleAddress)) {
      return undefined
    }
    const column = columnIndexToLabel(simpleAddress.col)
    const dollar = this.type === ReferenceType.ABSOLUTE ? '$' : ''
    return `${dollar}${column}`
  }

  public exceedsSheetSizeLimits(maxColumns: number): boolean {
    return this.col >= maxColumns
  }
}
