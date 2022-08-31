/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {ErrorType, SimpleCellAddress} from '../Cell'
import {CellAddress} from '../parser'
import {ColumnAddress} from '../parser/ColumnAddress'
import {RowAddress} from '../parser/RowAddress'
import {Transformer} from './Transformer'

export class CleanOutOfScopeDependenciesTransformer extends Transformer {
  constructor(
    public readonly sheet: number
  ) {
    super()
  }

  public isIrreversible() {
    return true
  }

  protected fixNodeAddress(address: SimpleCellAddress): SimpleCellAddress {
    return address
  }

  protected transformCellAddress<T extends CellAddress>(dependencyAddress: T, formulaAddress: SimpleCellAddress): ErrorType.REF | false | T {
    return dependencyAddress.isInvalid(formulaAddress) ? ErrorType.REF : false
  }

  protected transformCellRange(start: CellAddress, end: CellAddress, formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return start.isInvalid(formulaAddress) || end.isInvalid(formulaAddress) ? ErrorType.REF : false
  }

  protected transformColumnRange(start: ColumnAddress, end: ColumnAddress, formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return start.isInvalid(formulaAddress) || end.isInvalid(formulaAddress) ? ErrorType.REF : false
  }

  protected transformRowRange(start: RowAddress, end: RowAddress, formulaAddress: SimpleCellAddress): ErrorType.REF | false {
    return start.isInvalid(formulaAddress) || end.isInvalid(formulaAddress) ? ErrorType.REF : false
  }
}
