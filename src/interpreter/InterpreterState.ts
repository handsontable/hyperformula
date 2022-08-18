/**
 * @license
 * Copyright (c) 2022 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../Cell'
import {FormulaVertex} from '../DependencyGraph/FormulaCellVertex'

export class InterpreterState {
  constructor(
    public formulaAddress: SimpleCellAddress,
    public arraysFlag: boolean,
    public formulaVertex?: FormulaVertex,
  ) {
  }
}

