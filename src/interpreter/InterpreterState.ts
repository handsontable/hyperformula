/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../Cell'
import {FormulaVertex} from '../DependencyGraph/FormulaVertex'

export class InterpreterState {
  public runtimeValueReads?: {count: number}

  constructor(
    public formulaAddress: SimpleCellAddress,
    public arraysFlag: boolean,
    public formulaVertex?: FormulaVertex,
    runtimeValueReads?: {count: number},
  ) {
    this.runtimeValueReads = runtimeValueReads ?? (formulaVertex === undefined ? {count: 0} : undefined)
  }
}
