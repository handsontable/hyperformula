/**
 * @license
 * Copyright (c) Handsoncode sp. z o.o. All rights reserved.
 */

import {SimpleCellAddress} from '../Cell'
import {FormulaVertex} from '../DependencyGraph/FormulaVertex'

export class InterpreterState {
  constructor(
    public formulaAddress: SimpleCellAddress,
    public arraysFlag: boolean,
    public formulaVertex?: FormulaVertex,
  ) {
  }
}
