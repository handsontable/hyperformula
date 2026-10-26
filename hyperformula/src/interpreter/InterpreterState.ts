/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../Cell'
import {FormulaVertex} from '../DependencyGraph/FormulaVertex'

export class InterpreterState {
  constructor(
    public formulaAddress: SimpleCellAddress,
    public arraysFlag: boolean,
    public formulaVertex?: FormulaVertex,
    /**
     * True if the function being called is the argument of a function that uses only the position or the size of a
     * reference, not the values of its cells (ROW, COLUMN, ROWS, COLUMNS). INDIRECT then returns the reference without
     * reading it. Set only for that function, not for its own arguments; see `Interpreter.evaluateReference`.
     */
    public referenceExpected?: boolean,
  ) {
  }
}
