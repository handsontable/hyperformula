/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {Maybe} from '../../Maybe'
import {ProcedureAst} from '../../parser'
import {coerceScalarToString} from '../ArithmeticHelper'
import {InterpreterState} from '../InterpreterState'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {ExtendedNumber, getRawValue, InterpreterValue, isExtendedNumber, RawScalarValue, InternalScalarValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/**
 * Interpreter plugin containing text-specific functions
 */
export class TextPlugin extends FunctionPlugin implements FunctionPluginTypecheck<TextPlugin> {
  public static implementedFunctions: ImplementedFunctions = {
    'CONCATENATE': {
      method: 'concatenate',
      parameters: [
        { argumentType: FunctionArgumentType.STRING }
      ],
      repeatLastArgs: 1,
      expandRanges: true,
    },
    'CONCAT': {
      method: 'concat',
      parameters: [
        { argumentType: FunctionArgumentType.ANY }
      ],
      repeatLastArgs: 1,
    },
    'EXACT': {
      method: 'exact',
      parameters: [
        { argumentType: FunctionArgumentType.STRING },
        { argumentType: FunctionArgumentType.STRING }
      ]
    },
    'SPLIT': {
      method: 'split',
      parameters: [
        { argumentType: FunctionArgumentType.STRING },
        { argumentType: FunctionArgumentType.NUMBER },
      ]
    },
    'LEN': {
      method: 'len',
      parameters: [
        { argumentType: FunctionArgumentType.STRING }
      ]
    },
    'LOWER': {
      method: 'lower',
      parameters: [
        { argumentType: FunctionArgumentType.STRING }
      ]
    },
    'MID': {
      method: 'mid',
      parameters: [
        { argumentType: FunctionArgumentType.STRING },
        { argumentType: FunctionArgumentType.NUMBER },
        { argumentType: FunctionArgumentType.NUMBER },
      ]
    },
    'TRIM': {
      method: 'trim',
      parameters: [
        { argumentType: FunctionArgumentType.STRING }
      ]
    },
    'T': {
      method: 't',
      parameters: [
        { argumentType: FunctionArgumentType.SCALAR }
      ]
    },
    'N': {
      method: 'n',
      parameters: [
        { argumentType: FunctionArgumentType.ANY }
      ]
    },
    'PROPER': {
      method: 'proper',
      parameters: [
        { argumentType: FunctionArgumentType.STRING }
      ]
    },
    'CLEAN': {
      method: 'clean',
      parameters: [
        { argumentType: FunctionArgumentType.STRING }
      ]
    },
    'REPT': {
      method: 'rept',
      parameters: [
        { argumentType: FunctionArgumentType.STRING },
        { argumentType: FunctionArgumentType.NUMBER },
      ]
    },
    'RIGHT': {
      method: 'right',
      parameters: [
        { argumentType: FunctionArgumentType.STRING },
        { argumentType: FunctionArgumentType.NUMBER, defaultValue: 1 },
      ]
    },
    'LEFT': {
      method: 'left',
      parameters: [
        { argumentType: FunctionArgumentType.STRING },
        { argumentType: FunctionArgumentType.NUMBER, defaultValue: 1 },
      ]
    },
    'REPLACE': {
      method: 'replace',
      parameters: [
        { argumentType: FunctionArgumentType.STRING },
        { argumentType: FunctionArgumentType.NUMBER },
        { argumentType: FunctionArgumentType.NUMBER },
        { argumentType: FunctionArgumentType.STRING }
      ]
    },
    'SEARCH': {
      method: 'search',
      parameters: [
        { argumentType: FunctionArgumentType.STRING },
        { argumentType: FunctionArgumentType.STRING },
        { argumentType: FunctionArgumentType.NUMBER, defaultValue: 1 },
      ]
    },
    'SUBSTITUTE': {
      method: 'substitute',
      parameters: [
        { argumentType: FunctionArgumentType.STRING },
        { argumentType: FunctionArgumentType.STRING },
        { argumentType: FunctionArgumentType.STRING },
        { argumentType: FunctionArgumentType.NUMBER, optionalArg: true }
      ]
    },
    'FIND': {
      method: 'find',
      parameters: [
        { argumentType: FunctionArgumentType.STRING },
        { argumentType: FunctionArgumentType.STRING },
        { argumentType: FunctionArgumentType.NUMBER, defaultValue: 1 },
      ]
    },
    'UPPER': {
      method: 'upper',
      parameters: [
        { argumentType: FunctionArgumentType.STRING }
      ]
    },
    'VALUE': {
      method: 'value',
      parameters: [
        { argumentType: FunctionArgumentType.SCALAR }
      ]
    },
    'VALUETOTEXT': {
      method: 'valuetotext',
      parameters: [
        { argumentType: FunctionArgumentType.SCALAR },
        { argumentType: FunctionArgumentType.SCALAR, defaultValue: 0 },
      ]
    },
    'TEXTJOIN': {
      method: 'textjoin',
      repeatLastArgs: 1,
      parameters: [
        {argumentType: FunctionArgumentType.ANY},
        {argumentType: FunctionArgumentType.BOOLEAN},
        {argumentType: FunctionArgumentType.ANY},
      ],
    },
  }

  /**
   * Corresponds to CONCATENATE(value1, [value2, ...])
   *
   * Concatenates provided arguments to one string.
   *
   * @param {ProcedureAst} ast - The procedure AST node
   * @param {InterpreterState} state - The interpreter state
   */
  public concatenate(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('CONCATENATE'), (...args) => {
      return ''.concat(...args)
    })
  }

  /**
   * Corresponds to CONCAT(text1, [text2, ...])
   *
   * Joins the text of all arguments, reading every range or array row by row.
   * Numbers are written to 15 significant digits, booleans as TRUE or FALSE, empty cells as nothing.
   * Returns the first error found in the arguments, or #VALUE! if the result exceeds 32,767 characters (Excel cell content limit).
   *
   * @param {ProcedureAst} ast - The procedure AST node
   * @param {InterpreterState} state - The interpreter state
   */
  public concat(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('CONCAT'), (...args: (InternalScalarValue | SimpleRangeValue)[]) => {
      const texts: string[] = []
      for (const arg of args) {
        const values: InternalScalarValue[] = arg instanceof SimpleRangeValue ? arg.valuesFromTopLeftCorner() : [arg]
        for (const value of values) {
          const text = this.coerceScalarToText(value)
          if (text instanceof CellError) {
            return text
          }
          texts.push(text)
        }
      }

      const result = texts.join('')

      if (result.length > 32767) {
        return new CellError(ErrorType.VALUE, ErrorMessage.ResultTooLong)
      }
      return result
    })
  }

  /**
   * Corresponds to VALUETOTEXT(value, [format])
   *
   * Returns the text representation of a value. An error value is returned as text rather than propagated.
   * Format 0 (default) is concise; format 1 is strict: text is wrapped in double quotes with embedded quotes doubled.
   * The format is truncated to an integer and must end up as 0 or 1, otherwise the result is #VALUE!.
   *
   * @param {ProcedureAst} ast - The procedure AST node
   * @param {InterpreterState} state - The interpreter state
   */
  public valuetotext(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('VALUETOTEXT'), (value: InternalScalarValue, formatArg: InternalScalarValue) => {
      if (formatArg instanceof CellError) {
        return formatArg
      }

      const format = formatArg === '' ? undefined : this.coerceScalarToNumberOrError(formatArg)
      if (format === undefined || !isExtendedNumber(format)) {
        return new CellError(ErrorType.VALUE)
      }

      const formatCode = Math.trunc(getRawValue(format))
      if (formatCode !== 0 && formatCode !== 1) {
        return new CellError(ErrorType.VALUE)
      }

      if (value instanceof CellError) {
        return this.config.translationPackage.getErrorTranslation(value.type)
      }
      if (formatCode === 1 && typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`
      }
      return this.coerceScalarToText(value)
    })
  }

  /**
   * Corresponds to SPLIT(string, index)
   *
   * Splits provided string using space separator and returns chunk at zero-based position specified by second argument
   *
   * @param {ProcedureAst} ast - The procedure AST node
   * @param {InterpreterState} state - The interpreter state
   */
  public split(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SPLIT'), (stringToSplit: string, indexToUse: number) => {
      const splittedString = stringToSplit.split(' ')

      if (indexToUse >= splittedString.length || indexToUse < 0) {
        return new CellError(ErrorType.VALUE, ErrorMessage.IndexBounds)
      }

      return splittedString[indexToUse]
    })
  }

  public len(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('LEN'), (arg: string) => {
      return arg.length
    })
  }

  public lower(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('LOWER'), (arg: string) => {
      return arg.toLowerCase()
    })
  }

  public trim(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TRIM'), (arg: string) => {
      return arg
        .replace(/^ +/g, '')
        .replace(/ +$/g, '')
        .replace(/ +/g, ' ')
    })
  }

  public proper(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('PROPER'), (arg: string) => {
      return arg.replace(/\p{L}+/gu, word => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase())
    })
  }

  public clean(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('CLEAN'), (arg: string) => {
      // eslint-disable-next-line no-control-regex
      return arg.replace(/[\u0000-\u001F]/g, '')
    })
  }

  public exact(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('EXACT'), (left: string, right: string) => {
      return left === right
    })
  }

  public rept(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('REPT'), (text: string, count: number) => {
      if (count < 0) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NegativeCount)
      }
      return text.repeat(count)
    })
  }

  public right(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('RIGHT'), (text: string, length: number) => {
      if (length < 0) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NegativeLength)
      } else if (length === 0) {
        return ''
      }
      return text.slice(-length)
    })
  }

  public left(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('LEFT'), (text: string, length: number) => {
      if (length < 0) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NegativeLength)
      }
      return text.slice(0, length)
    })
  }

  public mid(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('MID'), (text: string, startPosition: number, numberOfChars: number) => {
      if (startPosition < 1) {
        return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
      }
      if (numberOfChars < 0) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NegativeLength)
      }
      return text.substring(startPosition - 1, startPosition + numberOfChars - 1)
    })
  }

  public replace(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('REPLACE'), (text: string, startPosition: number, numberOfChars: number, newText: string) => {
      if (startPosition < 1) {
        return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
      }
      if (numberOfChars < 0) {
        return new CellError(ErrorType.VALUE, ErrorMessage.NegativeLength)
      }
      return text.substring(0, startPosition - 1) + newText + text.substring(startPosition + numberOfChars - 1)
    })
  }

  public search(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SEARCH'), (pattern: string, text: string, startIndex: number) => {
      if (startIndex < 1 || startIndex > text.length) {
        return new CellError(ErrorType.VALUE, ErrorMessage.LengthBounds)
      }

      const normalizedPattern = pattern.toLowerCase()
      const normalizedText = text.substring(startIndex - 1).toLowerCase()

      const index = this.arithmeticHelper.requiresRegex(normalizedPattern)
        ? this.arithmeticHelper.searchString(normalizedPattern, normalizedText)
        : normalizedText.indexOf(normalizedPattern)

      return index > -1 ? index + startIndex : new CellError(ErrorType.VALUE, ErrorMessage.PatternNotFound)
    })
  }

  public substitute(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('SUBSTITUTE'), (text: string, searchString: string, replacementString: string, occurrenceNum: number | undefined) => {
      const escapedSearchString = this.escapeRegExpSpecialCharacters(searchString)
      const searchRegExp = new RegExp(escapedSearchString, 'g')

      if (occurrenceNum === undefined) {
        return text.replace(searchRegExp, replacementString)
      }

      if (occurrenceNum < 1) {
        return new CellError(ErrorType.VALUE, ErrorMessage.LessThanOne)
      }

      let match: RegExpExecArray | null
      let i = 0
      while ((match = searchRegExp.exec(text)) !== null) {
        if (occurrenceNum === ++i) {
          return text.substring(0, match.index) + replacementString + text.substring(searchRegExp.lastIndex)
        }
      }

      return text
    })
  }

  public find(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('FIND'), (pattern, text: string, startIndex: number) => {
      if (startIndex < 1 || startIndex > text.length) {
        return new CellError(ErrorType.VALUE, ErrorMessage.IndexBounds)
      }

      const shiftedText = text.substring(startIndex - 1)
      const index = shiftedText.indexOf(pattern) + startIndex

      return index > 0 ? index : new CellError(ErrorType.VALUE, ErrorMessage.PatternNotFound)
    })
  }

  public t(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('T'), (arg: RawScalarValue) => {
      if (arg instanceof CellError) {
        return arg
      }
      return typeof arg === 'string' ? arg : ''
    })
  }

  /**
   * Corresponds to N(value)
   *
   * Converts a value to a number according to Excel specification:
   * - Numbers return themselves
   * - Dates return their serial number (stored as numbers internally)
   * - TRUE returns 1, FALSE returns 0
   * - Error values propagate
   * - Anything else (text, empty) returns 0
   * - For ranges, uses the first cell value
   */
  public n(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('N'), (arg: InternalScalarValue | SimpleRangeValue) => {
      const value = arg instanceof SimpleRangeValue ? arg.data[0]?.[0] : arg

      if (value instanceof CellError) {
        return value
      }
      if (typeof value === 'number') {
        return value
      }
      if (typeof value === 'boolean') {
        return value ? 1 : 0
      }
      return 0
    })
  }

  public upper(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('UPPER'), (arg: string) => {
      return arg.toUpperCase()
    })
  }

  /**
   * Corresponds to VALUE(text)
   *
   * Converts a text string that represents a number to a number.
   *
   * @param {ProcedureAst} ast - The procedure AST node
   * @param {InterpreterState} state - The interpreter state
   */
  public value(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('VALUE'), (arg: RawScalarValue): ExtendedNumber | CellError => {
      if (arg instanceof CellError) {
        return arg
      }

      if (isExtendedNumber(arg)) {
        return arg
      }

      if (typeof arg !== 'string') {
        return new CellError(ErrorType.VALUE, ErrorMessage.NumberCoercion)
      }

      const trimmedArg = arg.trim()

      const parenthesesMatch = /^\(([^()]+)\)$/.exec(trimmedArg)
      if (parenthesesMatch) {
        const innerValue = this.parseStringToNumber(parenthesesMatch[1])
        if (innerValue !== undefined) {
          return -innerValue
        }
      }

      const parsedValue = this.parseStringToNumber(trimmedArg)
      if (parsedValue !== undefined) {
        return parsedValue
      }

      return new CellError(ErrorType.VALUE, ErrorMessage.NumberCoercion)
    })
  }

  /**
   * Corresponds to TEXTJOIN(delimiter, ignore_empty, text1, [text2], …)
   *
   * Joins text from multiple strings/ranges with a configurable delimiter.
   * Supports array/range delimiters that cycle through gaps between text values.
   * When ignore_empty is TRUE, empty strings are skipped.
   * Returns #VALUE! if the result exceeds 32,767 characters (Excel cell content limit).
   *
   * @param {ProcedureAst} ast - The procedure AST node
   * @param {InterpreterState} state - The interpreter state
   */
  public textjoin(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TEXTJOIN'),
      (delimiterArg: InternalScalarValue | SimpleRangeValue,
        ignoreEmpty: boolean,
        ...textArgs: (InternalScalarValue | SimpleRangeValue)[]) => {

        const delimiters = this.flattenArgToStrings(delimiterArg)
        if (delimiters instanceof CellError) {
          return delimiters
        }

        const texts: string[] = []
        for (const arg of textArgs) {
          const coerced = this.flattenArgToStrings(arg)
          if (coerced instanceof CellError) {
            return coerced
          }
          texts.push(...coerced)
        }

        const parts = ignoreEmpty ? texts.filter((t) => t !== '') : texts

        if (parts.length === 0) {
          return ''
        }

        const result = parts.reduce((acc, part, i) =>
          i === 0 ? part : acc + delimiters[(i - 1) % delimiters.length] + part
        , '')

        if (result.length > 32767) {
          return new CellError(ErrorType.VALUE, ErrorMessage.ResultTooLong)
        }
        return result
      }
    )
  }

  /**
   * Flattens a scalar or range argument into an array of coerced strings.
   * Returns a CellError immediately if any value in the argument is an error or cannot be coerced.
   *
   * @param {InternalScalarValue | SimpleRangeValue} arg - Scalar or range to flatten
   * @returns {string[] | CellError} - Array of string values, or the first error encountered
   */
  private flattenArgToStrings(arg: InternalScalarValue | SimpleRangeValue): string[] | CellError {
    const values = arg instanceof SimpleRangeValue ? arg.valuesFromTopLeftCorner() : [arg]
    const result: string[] = []
    for (const val of values) {
      if (val instanceof CellError) {
        return val
      }
      const coerced = coerceScalarToString(val as InternalScalarValue)
      if (coerced instanceof CellError) {
        return coerced
      }
      result.push(coerced)
    }
    return result
  }

  /**
   * Converts a scalar to its text. A number is written to 15 significant digits, in plain decimal notation as long as
   * that takes at most 20 digits, and in scientific notation with a two-digit exponent otherwise (`1E+20`, `1.5E-20`).
   * Other values are converted like in `coerceScalarToString`.
   *
   * @param {InternalScalarValue} value - The scalar to convert
   * @returns {string | CellError} - The text, or the value itself if it is an error
   */
  private coerceScalarToText(value: InternalScalarValue): string | CellError {
    if (!isExtendedNumber(value)) {
      return coerceScalarToString(value)
    }

    const number = getRawValue(value)
    if (number === 0) {
      return '0'
    }

    const [mantissa, exponentText] = Math.abs(number).toExponential(14).split('e')
    const digits = mantissa.replace('.', '').replace(/0+$/, '')
    const exponent = Number(exponentText)
    const sign = number < 0 ? '-' : ''
    const decimalDigitCount = exponent >= 0 ? Math.max(exponent + 1, digits.length) : -exponent + digits.length

    if (decimalDigitCount > 20) {
      const fraction = digits.length > 1 ? `.${digits.slice(1)}` : ''
      return `${sign}${digits[0]}${fraction}E${exponent < 0 ? '-' : '+'}${String(Math.abs(exponent)).padStart(2, '0')}`
    }
    if (exponent < 0) {
      return `${sign}0.${'0'.repeat(-exponent - 1)}${digits}`
    }
    if (exponent + 1 >= digits.length) {
      return `${sign}${digits}${'0'.repeat(exponent + 1 - digits.length)}`
    }
    return `${sign}${digits.slice(0, exponent + 1)}.${digits.slice(exponent + 1)}`
  }

  /**
   * Parses a string to a numeric value, handling whitespace trimming and empty string validation.
   *
   * @param {string} input - The string to parse
   * @returns {Maybe<ExtendedNumber>} The parsed number or undefined if parsing fails or input is empty
   */
  private parseStringToNumber(input: string): Maybe<ExtendedNumber> {
    const trimmedInput = input.trim()

    if (trimmedInput === '') {
      return undefined
    }

    return this.arithmeticHelper.coerceToMaybeNumber(trimmedInput)
  }

  private escapeRegExpSpecialCharacters(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

}
