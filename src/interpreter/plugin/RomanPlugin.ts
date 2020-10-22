/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

export class RomanPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'ROMAN': {
      method: 'roman',
      parameters: [
        { argumentType: ArgumentTypes.NUMBER, minValue: 1, lessThan: 4000 },
        { argumentType: ArgumentTypes.NOERROR, optionalArg: true, defaultValue: 0 }
      ],
    },
    'ARABIC': {
      method: 'arabic',
      parameters: [
        { argumentType: ArgumentTypes.STRING },
      ],
    },
  }

  public roman(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ROMAN'),
      (val: number, mode: InternalScalarValue) => {
        val = Math.trunc(val)
        if(mode === false) {
          mode = 4
        } else if(mode === true) {
          mode = 0
        }
        mode = this.coerceScalarToNumberOrError(mode)
        if(mode instanceof CellError) {
          return mode
        }
        mode = Math.trunc(mode)
        if(mode < 0) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ValueSmall)
        }
        if(mode > 4) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ValueLarge)
        }
        return romanMode(val, mode)
      }
    )
  }

  public arabic(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ARABIC'),
      (input: string) => {
        input = input.trim().toUpperCase()
        let minusSign = false
        if(input.startsWith('-')) {
          input = input.slice(1)
          minusSign = true
          if(input==='') {
            return new CellError(ErrorType.VALUE, ErrorMessage.InvalidRoman)
          }
        }
        let ans = 0;
        [input, ans] = eatToken(input, ans,
          {token: 'MMM', val: 3000},
          {token: 'MM', val: 2000},
          {token: 'M', val: 1000},
          );
        [input, ans] = eatToken(input, ans,
          {token: 'IM', val: 999},
          {token: 'VM', val: 995},
          {token: 'XM', val: 990},
          {token: 'LM', val: 950},
          {token: 'CM', val: 900},
          );
        [input, ans] = eatToken(input, ans,
          {token: 'D', val: 500},
          {token: 'ID', val: 499},
          {token: 'VD', val: 495},
          {token: 'XD', val: 490},
          {token: 'LD', val: 450},
          {token: 'CD', val: 400},
          );
        [input, ans] = eatToken(input, ans,
          {token: 'CCC', val: 300},
          {token: 'CC', val: 200},
          {token: 'C', val: 100},
          );
        [input, ans] = eatToken(input, ans,
          {token: 'IC', val: 99},
          {token: 'VC', val: 95},
          {token: 'XC', val: 90},
          );
        [input, ans] = eatToken(input, ans,
          {token: 'L', val: 50},
          {token: 'IL', val: 49},
          {token: 'VL', val: 45},
          {token: 'XL', val: 40},
        );
        [input, ans] = eatToken(input, ans,
          {token: 'XXX', val: 30},
          {token: 'XX', val: 20},
          {token: 'X', val: 10},
          );
        [input, ans] = eatToken(input, ans, {token: 'IX', val: 9});
        [input, ans] = eatToken(input, ans,
          {token: 'V', val: 5},
          {token: 'IV', val: 4},
          );
        [input, ans] = eatToken(input, ans,
          {token: 'III', val: 3},
          {token: 'II', val: 2},
          {token: 'I', val: 1},
          )
        if(input !== '') {
          return new CellError(ErrorType.VALUE, ErrorMessage.InvalidRoman)
        } else {
          return (minusSign?-1:1) * ans
        }
      }
    )
  }
}

function eatToken(input: string, acc: number, ...tokens: {token: string, val: number}[]): [string, number] {
  for(const token of tokens) {
    if(input.startsWith(token.token)) {
      return [input.slice(token.token.length), acc+token.val]
    }
  }
  return [input, acc]
}

function romanMode(val: number, mode: number): string {
  let ret = ''
  ret += 'M'.repeat(Math.floor(val/1000))
  val %= 1000
  if(mode===4) {
    [val, ret] = absorb(val, ret, 'IM', 999, 1000);
    [val, ret] = absorb(val, ret, 'ID', 499, 500)
  }
  if(mode>=3) {
    [val, ret] = absorb(val, ret, 'VM', 995, 1000);
    [val, ret] = absorb(val, ret, 'VD', 495, 500)
  }
  if(mode>=2) {
    [val, ret] = absorb(val, ret, 'XM', 990, 1000);
    [val, ret] = absorb(val, ret, 'XD', 490, 500)
  }
  if(mode>=1) {
    [val, ret] = absorb(val, ret, 'LM', 950, 1000);
    [val, ret] = absorb(val, ret, 'LD', 450, 500)
  }
  [val, ret] = absorb(val, ret, 'CM', 900, 1000);
  [val, ret] = absorb(val, ret, 'CD', 400, 500);
  [val, ret] = absorb(val, ret, 'D', 500, 900)
  ret += 'C'.repeat(Math.floor(val/100))
  val %= 100
  if(mode>=2) {
    [val, ret] = absorb(val, ret, 'IC', 99, 100);
    [val, ret] = absorb(val, ret, 'IL', 49, 50)
  }
  if(mode>=1) {
    [val, ret] = absorb(val, ret, 'VC', 95, 100);
    [val, ret] = absorb(val, ret, 'VL', 45, 50)
  }
  [val, ret] = absorb(val, ret, 'XC', 90, 100);
  [val, ret] = absorb(val, ret, 'XL', 40, 50);
  [val, ret] = absorb(val, ret, 'L', 50, 90)
  ret += 'X'.repeat(Math.floor(val/10))
  val %= 10;
  [val, ret] = absorb(val, ret, 'IX', 9, 10);
  [val, ret] = absorb(val, ret, 'IV', 4, 5);
  [val, ret] = absorb(val, ret, 'V', 5, 9)
  ret += 'I'.repeat(val)
  return ret
}

function absorb(val: number, acc: string, token: string, lower: number, upper: number): [number, string] {
  if(val>=lower && val<upper) {
    return [val-lower, acc+token]
  } else {
    return [val, acc]
  }
}
