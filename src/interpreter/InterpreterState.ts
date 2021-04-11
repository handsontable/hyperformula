import {SimpleCellAddress} from '../Cell'

/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

export class InterpreterState {
  constructor(public formulaAddress: SimpleCellAddress, public arraysFlag: boolean) {
  }
}

