/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType, InternalScalarValue, SimpleCellAddress} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {ProcedureAst} from '../../parser'
import {ArgumentTypes, FunctionPlugin} from './FunctionPlugin'

/**
 * Interpreter plugin containing text-specific functions
 */
export class TextPlugin extends FunctionPlugin {
  public static implementedFunctions = {
    'CONCATENATE': {
      method: 'concatenate',
      parameters: [
        {argumentType: ArgumentTypes.STRING}
      ],
      repeatLastArgs: 1,
      expandRanges: true,
    },
    'EXACT': {
      method: 'exact',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.STRING}
      ]
    },
    'SPLIT': {
      method: 'split',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.NUMBER},
      ]
    },
    'LEN': {
      method: 'len',
      parameters: [
        {argumentType: ArgumentTypes.STRING}
      ]
    },
    'LOWER': {
      method: 'lower',
      parameters: [
        {argumentType: ArgumentTypes.STRING}
      ]
    },
    'MID': {
      method: 'mid',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
      ]
    },
    'TRIM': {
      method: 'trim',
      parameters: [
        {argumentType: ArgumentTypes.STRING}
      ]
    },
    'T': {
      method: 't',
      parameters: [
        {argumentType: ArgumentTypes.SCALAR}
      ]
    },
    'PROPER': {
      method: 'proper',
      parameters: [
        {argumentType: ArgumentTypes.STRING}
      ]
    },
    'CLEAN': {
      method: 'clean',
      parameters: [
        {argumentType: ArgumentTypes.STRING}
      ]
    },
    'REPT': {
      method: 'rept',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.NUMBER},
      ]
    },
    'RIGHT': {
      method: 'right',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 1},
      ]
    },
    'LEFT': {
      method: 'left',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 1},
      ]
    },
    'REPLACE': {
      method: 'replace',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.NUMBER},
        {argumentType: ArgumentTypes.STRING}
      ]
    },
    'SEARCH': {
      method: 'search',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 1},
      ]
    },
    'SUBSTITUTE': {
      method: 'substitute',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.NUMBER, optionalArg: true}
      ]
    },
    'FIND': {
      method: 'find',
      parameters: [
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.STRING},
        {argumentType: ArgumentTypes.NUMBER, defaultValue: 1},
      ]
    },
    'UPPER': {
      method: 'upper',
      parameters: [
        {argumentType: ArgumentTypes.STRING}
      ]
    },
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
    return this.runFunction(ast.args, formulaAddress, this.metadata('CONCATENATE'), (...args) => {
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
    return this.runFunction(ast.args, formulaAddress, this.metadata('SPLIT'), (stringToSplit: string, indexToUse: number) => {
      const splittedString = stringToSplit.split(' ')

      if (indexToUse >= splittedString.length || indexToUse < 0) {
        return new CellError(ErrorType.VALUE, ErrorMessage.IndexBounds)
      }

      return splittedString[indexToUse]
    })
  }

  public len(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('LEN'), (arg: string) => {
      return arg.length
    })
  }

  public lower(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('LOWER'), (arg: string) => {
      return arg.toLowerCase()
    })
  }

  public trim(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('TRIM'), (arg: string) => {
      return arg.replace(/^ +| +$/g, '').replace(/ +/g, ' ')
    })
  }

  public proper(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('PROPER'), (arg: string) => {
      return arg.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase())
    })
  }

  public clean(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('CLEAN'), (arg: string) => {
      // eslint-disable-next-line no-control-regex
      return arg.replace(/[\u0000-\u001F]/g, '')
    })
  }

  public exact(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('EXACT'), (left: string, right: string) => {
      return left === right
    })
  }

  public rept(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('REPT'), (text: string, count: number) => {
      if (count < 0) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NegativeCount)
      }
      return text.repeat(count)
    })
  }

  public right(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('RIGHT'), (text: string, length: number) => {
      if (length < 0) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NegativeLength)
      } else if (length === 0) {
        return ''
      }
      return text.slice(-length)
    })
  }

  public left(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('LEFT'), (text: string, length: number) => {
      if (length < 0) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NegativeLength)
      }
      return text.slice(0, length)
    })
  }

  public mid(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('MID'), (text: string, startPosition: number, numberOfChars: number) => {
      if (startPosition < 1) {
        return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
      }
      if (numberOfChars < 0) {
        return new CellError(ErrorType.VALUE, ErrorMessage.Negative)
      }
      return text.substring(startPosition - 1, startPosition + numberOfChars - 1)
    })
  }

  public replace(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('REPLACE'), (text: string, startPosition: number, numberOfChars: number, newText: string) => {
      if (startPosition < 1) {
        return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
      }
      if (numberOfChars < 0) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NegativeLength)
      }
      return text.substring(0, startPosition - 1) + newText + text.substring(startPosition + numberOfChars - 1)
    })
  }

  public search(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('SEARCH'), (pattern, text: string, startIndex: number) => {
      if (startIndex < 1 || startIndex > text.length) {
        return new CellError(ErrorType.VALUE, ErrorMessage.LengthBounds)
      }

      const normalizedText = text.substring(startIndex - 1).toLowerCase()

      let index: number
      if (this.interpreter.arithmeticHelper.requiresRegex(pattern)) {
        index = this.interpreter.arithmeticHelper.searchString(pattern, normalizedText)
      } else {
        index = normalizedText.indexOf(pattern.toLowerCase())
      }

      index = index + startIndex
      return index > 0 ? index : new CellError(ErrorType.VALUE, ErrorMessage.PatternNotFound)
    })
  }

  public substitute(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('SUBSTITUTE'), (text: string, oldText: string, newText: string, occurrence: number | undefined) => {
      const oldTextRegexp = new RegExp(oldText, 'g')

      if (occurrence === undefined) {
        return text.replace(oldTextRegexp, newText)
      }

      if (occurrence < 1) {
        return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
      }

      let match: RegExpExecArray | null
      let i = 0
      while ((match = oldTextRegexp.exec(text)) !== null) {
        if (occurrence === ++i) {
          return text.substring(0, match.index) + newText + text.substring(oldTextRegexp.lastIndex)
        }
      }

      return text
    })
  }

  public find(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('FIND'), (pattern, text: string, startIndex: number) => {
      if (startIndex < 1 || startIndex > text.length) {
        return new CellError(ErrorType.VALUE, ErrorMessage.IndexBounds)
      }

      const shiftedText = text.substring(startIndex - 1)
      const index = shiftedText.indexOf(pattern) + startIndex

      return index > 0 ? index : new CellError(ErrorType.VALUE, ErrorMessage.PatternNotFound)
    })
  }

  public t(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('T'), (arg: InternalScalarValue) => {
      if (arg instanceof CellError) {
        return arg
      }
      return typeof arg === 'string' ? arg : ''
    })
  }

  public upper(ast: ProcedureAst, formulaAddress: SimpleCellAddress): InternalScalarValue {
    return this.runFunction(ast.args, formulaAddress, this.metadata('UPPER'), (arg: string) => {
      return arg.toUpperCase()
    })
  }
}
