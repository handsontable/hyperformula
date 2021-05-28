/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {SimpleCellAddress} from '../Cell'

export class InterpreterState {
  constructor(public formulaAddress: SimpleCellAddress, public arraysFlag: boolean) {
  }
}

