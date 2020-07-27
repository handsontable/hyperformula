/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ProcedureAst} from '../../parser'
import {FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing text-specific functions
 */
export class TextPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'CONCATENATE': {
      method: 'concatenate',
      parameters: {
        list: [
          {argumentType: 'string'}
        ],
        repeatedArg: true,
        expandRanges: true,
      },
    },
    'SPLIT': {
      method: 'split',
      parameters: {
        list: [
          {argumentType: 'string'},
          {argumentType: 'number'},
        ]
      },
    },
    'LEN': {
      method: 'len',
      parameters: {
        list: [
          {argumentType: 'string'}
        ]
      },
    },
    'TRIM': {
      method: 'trim',
      parameters: {
        list: [
          {argumentType: 'string'}
        ]
      },
    },
    'PROPER': {
      method: 'proper',
      parameters: {
        list: [
          {argumentType: 'string'}
        ]
      },
    },
    'CLEAN': {
      method: 'clean',
      parameters: {
        list: [
          {argumentType: 'string'}
        ]
      },
    },
    'REPT': {
      method: 'rept',
      parameters: {
        list: [
          {argumentType: 'string'},
          {argumentType: 'number'},
        ]
      },
    },
    'RIGHT': {
      method: 'right',
      parameters: {
        list: [
          {argumentType: 'string'},
          {argumentType: 'number', defaultValue: 1},
        ]
      },
    },
    'LEFT': {
      method: 'left',
      parameters: {
        list: [
          {argumentType: 'string'},
          {argumentType: 'number', defaultValue: 1},
        ]
      },
    },
    'SEARCH': {
      method: 'search',
      parameters: {
        list: [
          {argumentType: 'string'},
          {argumentType: 'string'},
          {argumentType: 'number', defaultValue: 1},
        ]
      },
    },
    'FIND': {
      method: 'find',
      parameters: {
        list: [
          {argumentType: 'string'},
          {argumentType: 'string'},
          {argumentType: 'number', defaultValue: 1},
        ]
      },
    }
  }

  /**
   * Corresponds to CONCATENATE(value1, [value2, ...])
   *
   * Concatenates provided arguments to one string.
   *
   * @param args
   * @param formulaAddress
   */
  public concatenate(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('CONCATENATE'), (...args) => {
      return ''.concat(...args)
    })
  }

  /**
   * Corresponds to SPLIT(string, index)
   *
   * Splits provided string using space separator and returns chunk at zero-based position specified by second argument
   *
   * @param ast
   * @param formulaAddress
   */
  public split(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('SPLIT'), (stringToSplit: string, indexToUse: number) => {
      const splittedString = stringToSplit.split(' ')

      if (indexToUse >= splittedString.length || indexToUse < 0) {
        return new CellError(ErrorType.VALUE)
      }

      return splittedString[indexToUse]
    })
  }

  public len(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('LEN'), (arg: string) => {
      return arg.length
    })
  }

  public trim(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('TRIM'), (arg: string) => {
      return arg.replace(/^ +| +$/g, '').replace(/ +/g, ' ')
    })
  }

  public proper(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('PROPER'), (arg: string) => {
      return arg.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase())
    })
  }

  public clean(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('CLEAN'), (arg: string) => {
      // eslint-disable-next-line no-control-regex
      return arg.replace(/[\u0000-\u001F]/g, '')
    })
  }

  public rept(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('REPT'), (text: string, count: number) => {
      if (count < 0) {
        return new CellError(ErrorType.VALUE)
      }
      return text.repeat(count)
    })
  }

  public right(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('RIGHT'), (text: string, length: number) => {
      if (length < 0) {
        return new CellError(ErrorType.VALUE)
      } else if (length === 0) {
        return ''
      }
      return text.slice(-length)
    })
  }

  public left(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('LEFT'), (text: string, length: number) => {
      if (length < 0) {
        return new CellError(ErrorType.VALUE)
      }
      return text.slice(0, length)
    })
  }

  public search(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('SEARCH'), (pattern, text: string, startIndex: number) => {
      if (startIndex < 1 || startIndex > text.length) {
        return new CellError(ErrorType.VALUE)
      }

      const normalizedText = text.substr(startIndex - 1).toLowerCase()

      let index: number
      if (this.interpreter.arithmeticHelper.requiresRegex(pattern)) {
        index = this.interpreter.arithmeticHelper.searchString(pattern, normalizedText)
      } else {
        index = normalizedText.indexOf(pattern.toLowerCase())
      }

      index = index + startIndex
      return index > 0 ? index : new CellError(ErrorType.VALUE)
    })
  }

  public find(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.parameters('FIND'), (pattern, text: string, startIndex: number) => {
      if (startIndex < 1 || startIndex > text.length) {
        return new CellError(ErrorType.VALUE)
      }

      const shiftedText = text.substr(startIndex - 1)
      const index = shiftedText.indexOf(pattern) + startIndex

      return index > 0 ? index : new CellError(ErrorType.VALUE)
    })
  }
}
