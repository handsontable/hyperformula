/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {ArraySize} from '../../ArraySize'
import {CellError, ErrorType} from '../../Cell'
import {ErrorMessage} from '../../error-message'
import {Maybe} from '../../Maybe'
import {Ast, AstNodeType, ProcedureAst} from '../../parser'
import {coerceScalarToString} from '../ArithmeticHelper'
import {InterpreterState} from '../InterpreterState'
import {SimpleRangeValue} from '../../SimpleRangeValue'
import {EmptyValue, ExtendedNumber, InterpreterValue, isExtendedNumber, RawScalarValue, InternalScalarValue} from '../InterpreterValue'
import {FunctionArgumentType, FunctionPlugin, FunctionPluginTypecheck, ImplementedFunctions} from './FunctionPlugin'

/**
 * A single occurrence of a delimiter in a text: the delimiter occupies the characters from `start` (inclusive) to `end` (exclusive).
 */
interface DelimiterMatch {
  start: number,
  end: number,
}

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
    'TEXTJOIN': {
      method: 'textjoin',
      repeatLastArgs: 1,
      parameters: [
        {argumentType: FunctionArgumentType.ANY},
        {argumentType: FunctionArgumentType.BOOLEAN},
        {argumentType: FunctionArgumentType.ANY},
      ],
    },
    'TEXTBEFORE': {
      method: 'textbefore',
      parameters: [
        {argumentType: FunctionArgumentType.STRING},
        {argumentType: FunctionArgumentType.ANY},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 1, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.SCALAR, optionalArg: true},
      ],
    },
    'TEXTAFTER': {
      method: 'textafter',
      parameters: [
        {argumentType: FunctionArgumentType.STRING},
        {argumentType: FunctionArgumentType.ANY},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 1, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.SCALAR, optionalArg: true},
      ],
    },
    'TEXTSPLIT': {
      method: 'textsplit',
      sizeOfResultArrayMethod: 'textsplitArraySize',
      parameters: [
        {argumentType: FunctionArgumentType.STRING},
        {argumentType: FunctionArgumentType.ANY},
        {argumentType: FunctionArgumentType.ANY, optionalArg: true},
        {argumentType: FunctionArgumentType.BOOLEAN, defaultValue: false, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.NUMBER, defaultValue: 0, emptyAsDefault: true},
        {argumentType: FunctionArgumentType.SCALAR, optionalArg: true},
      ],
      vectorizationForbidden: true,
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
   * Corresponds to TEXTBEFORE(text, delimiter, [instance_num], [match_mode], [match_end], [if_not_found])
   *
   * Returns the text that occurs before the instance_num-th occurrence of delimiter.
   * See {@link textAroundDelimiter} for the meaning of the optional arguments.
   *
   * @param {ProcedureAst} ast - The procedure AST node
   * @param {InterpreterState} state - The interpreter state
   */
  public textbefore(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TEXTBEFORE'),
      (text: string, delimiterArg: InternalScalarValue | SimpleRangeValue, instanceNum: number, matchMode: number, matchEnd: number, ifNotFound: Maybe<InternalScalarValue>) =>
        this.textAroundDelimiter(text, delimiterArg, instanceNum, matchMode, matchEnd, ifNotFound, (match) => text.substring(0, match.start))
    )
  }

  /**
   * Corresponds to TEXTAFTER(text, delimiter, [instance_num], [match_mode], [match_end], [if_not_found])
   *
   * Returns the text that occurs after the instance_num-th occurrence of delimiter.
   * See {@link textAroundDelimiter} for the meaning of the optional arguments.
   *
   * @param {ProcedureAst} ast - The procedure AST node
   * @param {InterpreterState} state - The interpreter state
   */
  public textafter(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TEXTAFTER'),
      (text: string, delimiterArg: InternalScalarValue | SimpleRangeValue, instanceNum: number, matchMode: number, matchEnd: number, ifNotFound: Maybe<InternalScalarValue>) =>
        this.textAroundDelimiter(text, delimiterArg, instanceNum, matchMode, matchEnd, ifNotFound, (match) => text.substring(match.end))
    )
  }

  /**
   * Corresponds to TEXTSPLIT(text, col_delimiter, [row_delimiter], [ignore_empty], [match_mode], [pad_with])
   *
   * Splits text into rows on row_delimiter, then splits each row into columns on col_delimiter.
   * Both delimiters may be arrays of delimiters; an empty col_delimiter or row_delimiter argument
   * means that the text is not split along that axis. When ignore_empty is TRUE, empty pieces
   * (and rows left with no pieces) are skipped. match_mode 1 makes the matching case-insensitive.
   * Rows shorter than the widest one are padded with pad_with (#N/A by default).
   *
   * @param {ProcedureAst} ast - The procedure AST node
   * @param {InterpreterState} state - The interpreter state
   */
  public textsplit(ast: ProcedureAst, state: InterpreterState): InterpreterValue {
    return this.runFunction(ast.args, state, this.metadata('TEXTSPLIT'),
      (text: string,
        colDelimiterArg: InternalScalarValue | SimpleRangeValue,
        rowDelimiterArg: Maybe<InternalScalarValue | SimpleRangeValue>,
        ignoreEmpty: boolean,
        matchMode: number,
        padWith: Maybe<InternalScalarValue>) => {

        const colDelimiters = this.delimitersFromArg(colDelimiterArg)
        if (colDelimiters instanceof CellError) {
          return colDelimiters
        }

        const rowDelimiters = this.delimitersFromArg(rowDelimiterArg)
        if (rowDelimiters instanceof CellError) {
          return rowDelimiters
        }

        if (!TextPlugin.isZeroOrOne(matchMode)) {
          return new CellError(ErrorType.VALUE, ErrorMessage.BadMode)
        }

        const rows = TextPlugin.splitText(text, colDelimiters, rowDelimiters, ignoreEmpty, matchMode === 1)
        if (rows instanceof CellError) {
          return rows
        }

        const padValue = (padWith === undefined || padWith === EmptyValue)
          ? new CellError(ErrorType.NA, ErrorMessage.ValueNotFound)
          : padWith
        const width = Math.max(...rows.map(row => row.length))

        return SimpleRangeValue.onlyValues(rows.map(row => [...row, ...Array<InternalScalarValue>(width - row.length).fill(padValue)]))
      }
    )
  }

  /**
   * Predicts the size of the TEXTSPLIT result at parse time.
   *
   * The size depends on the text and the delimiters, so it can be predicted only when the text,
   * the delimiters, ignore_empty and match_mode are literals. Otherwise, the function is treated
   * as returning a scalar, and a result larger than one cell is reported as #VALUE!
   * (the same limitation as SEQUENCE with non-literal dimensions).
   *
   * @param {ProcedureAst} ast - The procedure AST node
   * @param {InterpreterState} _state - The interpreter state (unused)
   */
  public textsplitArraySize(ast: ProcedureAst, _state: InterpreterState): ArraySize {
    if (ast.args.length < 2 || ast.args.length > 6) {
      return ArraySize.error()
    }

    const [textArg, colDelimiterArg, rowDelimiterArg, ignoreEmptyArg, matchModeArg] = ast.args
    const text = TextPlugin.literalText(textArg)
    const colDelimiters = TextPlugin.literalDelimiters(colDelimiterArg)
    const rowDelimiters = TextPlugin.literalDelimiters(rowDelimiterArg)
    const ignoreEmpty = TextPlugin.literalNumber(ignoreEmptyArg, 0)
    const matchMode = TextPlugin.literalNumber(matchModeArg, 0)

    if (text === undefined || colDelimiters === undefined || rowDelimiters === undefined || ignoreEmpty === undefined || matchMode === undefined) {
      return ArraySize.error()
    }

    if (!TextPlugin.isZeroOrOne(matchMode)) {
      return ArraySize.scalar()
    }

    const rows = TextPlugin.splitText(text, colDelimiters, rowDelimiters, ignoreEmpty !== 0, matchMode === 1)
    if (rows instanceof CellError) {
      return ArraySize.scalar()
    }

    return new ArraySize(Math.max(...rows.map(row => row.length)), rows.length)
  }

  /**
   * Shared logic of TEXTBEFORE and TEXTAFTER.
   *
   * - delimiter may be an array of delimiters; occurrences of any of them are counted in text order.
   * - instance_num is truncated to an integer; a negative instance_num counts occurrences from the end of text.
   *   0, or an absolute value larger than the length of a non-empty text, is #VALUE!.
   * - match_mode 1 makes the matching case-insensitive.
   * - match_end 1 treats the end of text (or its start, for a negative instance_num) as one more delimiter.
   * - When the delimiter is not found, if_not_found is returned, or #N/A when it is omitted.
   *
   * @param {string} text - The text to search
   * @param {InternalScalarValue | SimpleRangeValue} delimiterArg - The delimiter or array of delimiters
   * @param {number} instanceNum - Which occurrence of the delimiter to use
   * @param {number} matchMode - 0 for case-sensitive, 1 for case-insensitive matching
   * @param {number} matchEnd - 1 to treat the end of text as a delimiter
   * @param {Maybe<InternalScalarValue>} ifNotFound - The value returned when the delimiter is not found
   * @param {(match: DelimiterMatch) => string} extractText - Picks the result from the found occurrence
   */
  private textAroundDelimiter(
    text: string,
    delimiterArg: InternalScalarValue | SimpleRangeValue,
    instanceNum: number,
    matchMode: number,
    matchEnd: number,
    ifNotFound: Maybe<InternalScalarValue>,
    extractText: (match: DelimiterMatch) => string,
  ): InternalScalarValue {
    const delimiters = this.flattenArgToStrings(delimiterArg)
    if (delimiters instanceof CellError) {
      return delimiters
    }

    if (!TextPlugin.isZeroOrOne(matchMode) || !TextPlugin.isZeroOrOne(matchEnd)) {
      return new CellError(ErrorType.VALUE, ErrorMessage.BadMode)
    }

    const instance = Math.trunc(instanceNum)
    if (instance === 0 || (text.length > 0 && Math.abs(instance) > text.length)) {
      return new CellError(ErrorType.VALUE, ErrorMessage.IndexBounds)
    }

    const match = TextPlugin.findDelimiterOccurrence(text, delimiters, instance, matchMode === 1, matchEnd === 1)
    if (match !== undefined) {
      return extractText(match)
    }

    return (ifNotFound === undefined || ifNotFound === EmptyValue)
      ? new CellError(ErrorType.NA, ErrorMessage.PatternNotFound)
      : ifNotFound
  }

  /**
   * Converts a TEXTSPLIT delimiter argument into a list of delimiters.
   * An omitted or empty argument yields no delimiters, so the text is not split along that axis.
   *
   * @param {Maybe<InternalScalarValue | SimpleRangeValue>} arg - The delimiter argument
   * @returns {string[] | CellError} - The delimiters, or the first error encountered
   */
  private delimitersFromArg(arg: Maybe<InternalScalarValue | SimpleRangeValue>): string[] | CellError {
    if (arg === undefined || arg === EmptyValue) {
      return []
    }
    return this.flattenArgToStrings(arg)
  }

  /**
   * Finds the instance-th occurrence of any of the delimiters in text.
   * A positive instance scans from the start of text, a negative one scans backwards from the end;
   * in both directions, occurrences do not overlap.
   * When matchEnd is set and text holds exactly one occurrence too few, the end of text
   * (or its start, for a negative instance) is returned as a zero-length occurrence.
   *
   * @param {string} text - The text to search
   * @param {string[]} delimiters - The delimiters to look for
   * @param {number} instance - Non-zero integer: which occurrence to return
   * @param {boolean} ignoreCase - Whether the matching is case-insensitive
   * @param {boolean} matchEnd - Whether the end of text counts as a delimiter
   * @returns {Maybe<DelimiterMatch>} - The occurrence, or undefined when there is none
   */
  private static findDelimiterOccurrence(text: string, delimiters: string[], instance: number, ignoreCase: boolean, matchEnd: boolean): Maybe<DelimiterMatch> {
    const count = Math.abs(instance)
    const matches = instance > 0
      ? TextPlugin.findForwardMatches(text, delimiters, ignoreCase, count)
      : TextPlugin.findBackwardMatches(text, delimiters, ignoreCase, count)

    if (matches.length === count) {
      return matches[count - 1]
    }

    if (matchEnd && matches.length === count - 1) {
      const boundary = instance > 0 ? text.length : 0
      return {start: boundary, end: boundary}
    }

    return undefined
  }

  /**
   * Finds up to maxCount non-overlapping occurrences of the delimiters, scanning text from the start.
   * When several delimiters match at the same position, the longest one wins.
   *
   * @param {string} text - The text to search
   * @param {string[]} delimiters - The delimiters to look for
   * @param {boolean} ignoreCase - Whether the matching is case-insensitive
   * @param {number} maxCount - The maximum number of occurrences to find
   * @returns {DelimiterMatch[]} - The occurrences, in text order
   */
  private static findForwardMatches(text: string, delimiters: string[], ignoreCase: boolean, maxCount: number = Infinity): DelimiterMatch[] {
    const matches: DelimiterMatch[] = []
    let position = 0

    while (position <= text.length && matches.length < maxCount) {
      const length = TextPlugin.longestDelimiterLength(delimiters, delimiter => TextPlugin.matchesAt(text, position, delimiter, ignoreCase))
      if (length === undefined) {
        position++
        continue
      }
      matches.push({start: position, end: position + length})
      position += Math.max(length, 1)
    }

    return matches
  }

  /**
   * Finds up to maxCount non-overlapping occurrences of the delimiters, scanning text backwards from the end.
   * When several delimiters end at the same position, the longest one wins.
   *
   * @param {string} text - The text to search
   * @param {string[]} delimiters - The delimiters to look for
   * @param {boolean} ignoreCase - Whether the matching is case-insensitive
   * @param {number} maxCount - The maximum number of occurrences to find
   * @returns {DelimiterMatch[]} - The occurrences, from the last one in text to the first
   */
  private static findBackwardMatches(text: string, delimiters: string[], ignoreCase: boolean, maxCount: number): DelimiterMatch[] {
    const matches: DelimiterMatch[] = []
    let end = text.length

    while (end >= 0 && matches.length < maxCount) {
      const length = TextPlugin.longestDelimiterLength(delimiters, delimiter =>
        delimiter.length <= end && TextPlugin.matchesAt(text, end - delimiter.length, delimiter, ignoreCase))
      if (length === undefined) {
        end--
        continue
      }
      matches.push({start: end - length, end})
      end -= Math.max(length, 1)
    }

    return matches
  }

  /**
   * Returns the length of the longest delimiter that satisfies the predicate, or undefined if none does.
   *
   * @param {string[]} delimiters - The delimiters to check
   * @param {(delimiter: string) => boolean} isMatching - Tells whether a delimiter matches
   * @returns {Maybe<number>} - The length of the longest matching delimiter
   */
  private static longestDelimiterLength(delimiters: string[], isMatching: (delimiter: string) => boolean): Maybe<number> {
    return delimiters
      .filter(isMatching)
      .reduce((longest: Maybe<number>, delimiter) => (longest === undefined || delimiter.length > longest) ? delimiter.length : longest, undefined)
  }

  /**
   * Tells whether delimiter occurs in text at the given position.
   * The comparison is done on the original text, so positions always refer to it.
   *
   * @param {string} text - The text to search
   * @param {number} position - The position in text
   * @param {string} delimiter - The delimiter to compare
   * @param {boolean} ignoreCase - Whether the comparison is case-insensitive
   */
  private static matchesAt(text: string, position: number, delimiter: string, ignoreCase: boolean): boolean {
    if (ignoreCase) {
      return text.slice(position, position + delimiter.length).toLowerCase() === delimiter.toLowerCase()
    }
    return text.startsWith(delimiter, position)
  }

  /**
   * Splits text at every occurrence of any of the delimiters. With no delimiters, text is not split.
   *
   * @param {string} text - The text to split
   * @param {string[]} delimiters - The non-empty delimiters to split on
   * @param {boolean} ignoreCase - Whether the matching is case-insensitive
   * @returns {string[]} - The pieces between the delimiters
   */
  private static splitByDelimiters(text: string, delimiters: string[], ignoreCase: boolean): string[] {
    if (delimiters.length === 0) {
      return [text]
    }

    const pieces: string[] = []
    let pieceStart = 0
    for (const match of TextPlugin.findForwardMatches(text, delimiters, ignoreCase)) {
      pieces.push(text.substring(pieceStart, match.start))
      pieceStart = match.end
    }
    pieces.push(text.substring(pieceStart))

    return pieces
  }

  /**
   * Splits text into rows and columns, as TEXTSPLIT does (without padding).
   * Used both at evaluation time and to predict the result size at parse time, so that the two always agree.
   *
   * @param {string} text - The text to split
   * @param {string[]} colDelimiters - The delimiters separating columns
   * @param {string[]} rowDelimiters - The delimiters separating rows
   * @param {boolean} ignoreEmpty - Whether to skip empty pieces and rows left with no pieces
   * @param {boolean} ignoreCase - Whether the matching is case-insensitive
   * @returns {string[][] | CellError} - The rows of pieces, or an error for empty text, an empty delimiter, or an empty result
   */
  private static splitText(text: string, colDelimiters: string[], rowDelimiters: string[], ignoreEmpty: boolean, ignoreCase: boolean): string[][] | CellError {
    if (text === '' || colDelimiters.includes('') || rowDelimiters.includes('')) {
      return new CellError(ErrorType.VALUE, ErrorMessage.EmptyString)
    }

    const rows = TextPlugin.splitByDelimiters(text, rowDelimiters, ignoreCase)
      .map(row => TextPlugin.splitByDelimiters(row, colDelimiters, ignoreCase))
      .map(pieces => ignoreEmpty ? pieces.filter(piece => piece !== '') : pieces)
      .filter(pieces => pieces.length > 0)

    if (rows.length === 0) {
      return new CellError(ErrorType.NA, ErrorMessage.EmptyRange)
    }

    return rows
  }

  /**
   * Reads a literal text from an AST node at parse time: a string, or a number converted to text.
   *
   * @param {Ast} node - The AST node
   * @returns {Maybe<string>} - The text, or undefined if the node is not such a literal
   */
  private static literalText(node: Ast): Maybe<string> {
    if (node.type === AstNodeType.STRING) {
      return node.value
    }
    if (node.type === AstNodeType.NUMBER) {
      return node.value.toString()
    }
    return undefined
  }

  /**
   * Reads literal TEXTSPLIT delimiters from an AST node at parse time.
   * An omitted or empty argument yields no delimiters; an array literal yields all its elements.
   *
   * @param {Maybe<Ast>} node - The AST node, or undefined if the argument is omitted
   * @returns {Maybe<string[]>} - The delimiters, or undefined if the node is not a literal
   */
  private static literalDelimiters(node: Maybe<Ast>): Maybe<string[]> {
    if (node === undefined || node.type === AstNodeType.EMPTY) {
      return []
    }

    const elements = node.type === AstNodeType.ARRAY
      ? node.args.reduce((all: Ast[], row) => all.concat(row), [])
      : [node]
    const delimiters = elements.map(element => TextPlugin.literalText(element))

    return delimiters.every(delimiter => delimiter !== undefined) ? delimiters as string[] : undefined
  }

  /**
   * Reads a literal number from an AST node at parse time: a number, or TRUE()/FALSE() as 1/0.
   *
   * @param {Maybe<Ast>} node - The AST node, or undefined if the argument is omitted
   * @param {number} defaultValue - The value of an omitted or empty argument
   * @returns {Maybe<number>} - The number, or undefined if the node is not such a literal
   */
  private static literalNumber(node: Maybe<Ast>, defaultValue: number): Maybe<number> {
    if (node === undefined || node.type === AstNodeType.EMPTY) {
      return defaultValue
    }
    if (node.type === AstNodeType.NUMBER) {
      return node.value
    }
    if (node.type === AstNodeType.FUNCTION_CALL && node.args.length === 0) {
      if (node.procedureName === 'TRUE') {
        return 1
      }
      if (node.procedureName === 'FALSE') {
        return 0
      }
    }
    return undefined
  }

  /**
   * Tells whether a mode argument (match_mode, match_end) has one of its two valid values.
   *
   * @param {number} value - The argument value
   */
  private static isZeroOrOne(value: number): boolean {
    return value === 0 || value === 1
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
