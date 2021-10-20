/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {InterpreterState} from '../InterpreterState'
import {getRawValue, InterpreterValue, RawScalarValue} from '../InterpreterValue'
import {ArgumentTypes, FunctionPlugin, FunctionPluginTypecheck} from './FunctionPlugin'

export class RomanPlugin extends FunctionPlugin implements FunctionPluginTypecheck<RomanPlugin> {
  public static implementedFunctions = {
    'ROMAN': {
      method: 'roman',
      parameters: [
        {argumentType: ArgumentTypes.NUMBER, minValue: 1, lessThan: 4000},
        {argumentType: ArgumentTypes.NOERROR, optionalArg: true, defaultValue: 0}
      ],
    },
    'ARABIC': {
      method: 'arabic',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
      ],
    },
  }

  public roman(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ROMAN'),
      (val: number, mode: RawScalarValue) => {
        val = Math.trunc(val)
        if (mode === false) {
          mode = 4
        } else if (mode === true) {
          mode = 0
        }
        mode = getRawValue(this.coerceScalarToNumberOrError(mode))
        if (mode instanceof CellError) {
          return mode
        }
        mode = Math.trunc(mode)
        if (mode < 0) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ValueSmall)
        }
        if (mode > 4) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ValueLarge)
        }
        return romanMode(val, mode)
      }
    )
  }

  public arabic(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('ARABIC'),
      (inputString: string) => {
        inputString = inputString.trim().toUpperCase()
        let minusSign = false
        if (inputString.startsWith('-')) {
          inputString = inputString.slice(1)
          minusSign = true
          if (inputString === '') {
            return new CellError(ErrorType.VALUE, ErrorMessage.InvalidRoman)
          }
        }
        const work = {input: inputString, acc: 0}
        eatToken(work,
          {token: 'MMM', val: 3000},
          {token: 'MM', val: 2000},
          {token: 'M', val: 1000},
        )
        eatToken(work,
          {token: 'IM', val: 999},
          {token: 'VM', val: 995},
          {token: 'XM', val: 990},
          {token: 'LM', val: 950},
          {token: 'CM', val: 900},
        )
        eatToken(work,
          {token: 'D', val: 500},
          {token: 'ID', val: 499},
          {token: 'VD', val: 495},
          {token: 'XD', val: 490},
          {token: 'LD', val: 450},
          {token: 'CD', val: 400},
        )
        eatToken(work,
          {token: 'CCC', val: 300},
          {token: 'CC', val: 200},
          {token: 'C', val: 100},
        )
        eatToken(work,
          {token: 'IC', val: 99},
          {token: 'VC', val: 95},
          {token: 'XC', val: 90},
        )
        eatToken(work,
          {token: 'L', val: 50},
          {token: 'IL', val: 49},
          {token: 'VL', val: 45},
          {token: 'XL', val: 40},
        )
        eatToken(work,
          {token: 'XXX', val: 30},
          {token: 'XX', val: 20},
          {token: 'X', val: 10},
        )
        eatToken(work, {token: 'IX', val: 9})
        eatToken(work,
          {token: 'V', val: 5},
          {token: 'IV', val: 4},
        )
        eatToken(work,
          {token: 'III', val: 3},
          {token: 'II', val: 2},
          {token: 'I', val: 1},
        )
        if (work.input !== '') {
          return new CellError(ErrorType.VALUE, ErrorMessage.InvalidRoman)
        } else {
          return minusSign ? -work.acc : work.acc
        }
      }
    )
  }
}

function eatToken(inputAcc: { input: string, acc: number }, ...tokens: { token: string, val: number }[]) {
  for (const token of tokens) {
    if (inputAcc.input.startsWith(token.token)) {
      inputAcc.input = inputAcc.input.slice(token.token.length)
      inputAcc.acc += token.val
      break
    }
  }
}

function romanMode(input: number, mode: number): string {
  const work = {val: input % 1000, acc: 'M'.repeat(Math.floor(input / 1000))}
  if (mode === 4) {
    absorb(work, 'IM', 999, 1000)
    absorb(work, 'ID', 499, 500)
  }
  if (mode >= 3) {
    absorb(work, 'VM', 995, 1000)
    absorb(work, 'VD', 495, 500)
  }
  if (mode >= 2) {
    absorb(work, 'XM', 990, 1000)
    absorb(work, 'XD', 490, 500)
  }
  if (mode >= 1) {
    absorb(work, 'LM', 950, 1000)
    absorb(work, 'LD', 450, 500)
  }
  absorb(work, 'CM', 900, 1000)
  absorb(work, 'CD', 400, 500)
  absorb(work, 'D', 500, 900)
  work.acc += 'C'.repeat(Math.floor(work.val / 100))
  work.val %= 100
  if (mode >= 2) {
    absorb(work, 'IC', 99, 100)
    absorb(work, 'IL', 49, 50)
  }
  if (mode >= 1) {
    absorb(work, 'VC', 95, 100)
    absorb(work, 'VL', 45, 50)
  }
  absorb(work, 'XC', 90, 100)
  absorb(work, 'XL', 40, 50)
  absorb(work, 'L', 50, 90)
  work.acc += 'X'.repeat(Math.floor(work.val / 10))
  work.val %= 10
  absorb(work, 'IX', 9, 10)
  absorb(work, 'IV', 4, 5)
  absorb(work, 'V', 5, 9)
  work.acc += 'I'.repeat(work.val)
  return work.acc
}

function absorb(valAcc: { val: number, acc: string }, token: string, lower: number, upper: number) {
  if (valAcc.val >= lower && valAcc.val < upper) {
    valAcc.val -= lower
    valAcc.acc += token
  }
}
