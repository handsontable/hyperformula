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
  }

  public roman(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('ROMAN'),
      (val: number, mode: InternalScalarValue) => {
        val = Math.trunc(val)
        if(mode === false) {
          mode = 0
        } else if(mode === true) {
          mode = 4
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
}

function romanMode(val: number, mode: number): string {
  let ret = ''
  ret += ({0: '', 1000: 'M', 2000: 'MM', 3000: 'MMM'} as Record<number, string>)[val - val%1000]
  val %= 1000
  if(mode===4) {
    if(val===999) {
      ret += 'IM'
      return ret
    } else if(val===499) {
      ret += 'ID'
      return ret
    }
  }
  if(mode>=3) {
    if(val>=995) {
      ret += 'VM'
      val -= 995
    } else if(val>=495 && val < 500) {
      ret += 'VD'
      val -= 495
    }
  }
  if(mode>=2) {
    if(val>=990) {
      ret += 'XM'
      val -= 990
    } else if(val>=490 && val < 500) {
      ret += 'XD'
      val -= 490
    }
  }
  if(mode>=1) {
    if (val >= 950) {
      ret += 'LM'
      val -= 950
    } else if (val >= 450 && val < 500) {
      ret += 'LD'
      val -= 450
    }
  }
  ret += (({0: '', 100: 'C', 200: 'CC', 300: 'CCC', 400: 'CD', 500: 'D', 600: 'DC', 700: 'DCC', 800: 'DCCC', 900: 'CM'}) as Record<number, string>)[val - val%100]
  val %= 100
  if(mode>=2) {
    if(val===99) {
      ret += 'IC'
      return ret
    } else if(val===49) {
      ret += 'IL'
      return ret
    }
  }
  if(mode>0) {
    if (val >= 95) {
      ret += 'VC'
      val -= 95
    } else if (val >= 45 && val < 50) {
      ret += 'VL'
      val -= 45
    }
  }
  ret += (({0: '', 10: 'X', 20: 'XX', 30: 'XXX', 40: 'XL', 50: 'L', 60: 'LX', 70: 'LXX', 80: 'LXXX', 90: 'XC'}) as Record<number, string>)[val - val%10]
  val %= 10
  ret += (({0: '', 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX'}) as Record<number, string>)[val]
  return ret
}

