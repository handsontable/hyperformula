/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {IToken} from 'chevrotain'
import {CellError} from '../Cell'
import {AddressWithSheet} from './Address'
import {CellAddress} from './CellAddress'
import {ColumnAddress} from './ColumnAddress'
import {IExtendedToken} from './FormulaParser'
import {RowAddress} from './RowAddress'

export type Ast =
  NumberAst
  | StringAst
  | CellReferenceAst
  | CellRangeAst
  | ColumnRangeAst
  | RowRangeAst
  | ConcatenateOpAst
  | MinusUnaryOpAst
  | PlusUnaryOpAst
  | PercentOpAst
  | EqualsOpAst
  | NotEqualOpAst
  | GreaterThanOpAst
  | LessThanOpAst
  | LessThanOrEqualOpAst
  | GreaterThanOrEqualOpAst
  | PlusOpAst
  | MinusOpAst
  | TimesOpAst
  | DivOpAst
  | PowerOpAst
  | ProcedureAst
  | NamedExpressionAst
  | ParenthesisAst
  | ErrorAst
  | ErrorWithRawInputAst
  | EmptyArgAst
  | ArrayAst

export interface ParsingError {
  type: ParsingErrorType,
  message: string,
}

export const parsingError = (type: ParsingErrorType, message: string) => ({
  type, message
})

export enum ParsingErrorType {
  LexingError = 'LexingError',
  ParserError = 'ParsingError',
  StaticOffsetError = 'StaticOffsetError',
  StaticOffsetOutOfRangeError = 'StaticOffsetOutOfRangeError',
  RangeOffsetNotAllowed = 'RangeOffsetNotAllowed',
}

export enum AstNodeType {
  EMPTY = 'EMPTY',

  NUMBER = 'NUMBER',
  STRING = 'STRING',

  MINUS_UNARY_OP = 'MINUS_UNARY_OP',
  PLUS_UNARY_OP = 'PLUS_UNARY_OP',

  PERCENT_OP = 'PERCENT_OP',

  CONCATENATE_OP = 'CONCATENATE_OP',

  EQUALS_OP = 'EQUALS_OP',
  NOT_EQUAL_OP = 'NOT_EQUAL_OP',
  GREATER_THAN_OP = 'GREATER_THAN_OP',
  LESS_THAN_OP = 'LESS_THAN_OP',
  GREATER_THAN_OR_EQUAL_OP = 'GREATER_THAN_OR_EQUAL_OP',
  LESS_THAN_OR_EQUAL_OP = 'LESS_THAN_OR_EQUAL_OP',

  PLUS_OP = 'PLUS_OP',
  MINUS_OP = 'MINUS_OP',
  TIMES_OP = 'TIMES_OP',
  DIV_OP = 'DIV_OP',
  POWER_OP = 'POWER_OP',

  FUNCTION_CALL = 'FUNCTION_CALL',
  NAMED_EXPRESSION = 'NAMED_EXPRESSION',

  PARENTHESIS = 'PARENTHESES',

  CELL_REFERENCE = 'CELL_REFERENCE',

  CELL_RANGE = 'CELL_RANGE',
  COLUMN_RANGE = 'COLUMN_RANGE',
  ROW_RANGE = 'ROW_RANGE',

  ERROR = 'ERROR',

  ERROR_WITH_RAW_INPUT = 'ERROR_WITH_RAW_INPUT',

  ARRAY = 'ARRAY',
}

export enum RangeSheetReferenceType {
  RELATIVE,
  START_ABSOLUTE,
  BOTH_ABSOLUTE
}

export interface AstWithWhitespace {
  startOffset?: number,
  endOffset?: number,
  leadingWhitespace?: string,
}

export interface AstWithInternalWhitespace extends AstWithWhitespace {
  internalWhitespace?: string,
}

export interface EmptyArgAst extends AstWithWhitespace {
  type: AstNodeType.EMPTY,
}

export const buildEmptyArgAst = (leadingWhitespace?: IToken): EmptyArgAst => ({
  type: AstNodeType.EMPTY,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface NumberAst extends AstWithWhitespace {
  type: AstNodeType.NUMBER,
  value: number,
}

export const buildNumberAst = (
  value: number,
  startOffset?: number,
  endOffset?: number,
  leadingWhitespace?: IToken
): NumberAst => ({
  type: AstNodeType.NUMBER,
  value: value,
  startOffset: leadingWhitespace?.startOffset ?? startOffset,
  endOffset,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface StringAst extends AstWithWhitespace {
  type: AstNodeType.STRING,
  value: string,
}

export const buildStringAst = (token: IExtendedToken): StringAst => ({
  type: AstNodeType.STRING,
  value: token.image.slice(1, -1),
  leadingWhitespace: token.leadingWhitespace?.image,
  startOffset: token.leadingWhitespace?.startOffset ?? token.startOffset,
  endOffset: token.endOffset,
})


export interface CellReferenceAst extends AstWithWhitespace {
  type: AstNodeType.CELL_REFERENCE,
  reference: CellAddress,
}

export const buildCellReferenceAst = (reference: CellAddress, leadingWhitespace?: IToken): CellReferenceAst => ({
  type: AstNodeType.CELL_REFERENCE,
  reference,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface CellRangeAst extends AstWithWhitespace {
  type: AstNodeType.CELL_RANGE,
  start: CellAddress,
  end: CellAddress,
  sheetReferenceType: RangeSheetReferenceType,
}

export const buildCellRangeAst = (
  start: CellAddress,
  end: CellAddress,
  sheetReferenceType: RangeSheetReferenceType,
  startOffset?: number,
  endOffset?: number,
  leadingWhitespace?: string,
): CellRangeAst => {
  assertRangeConsistency(start, end, sheetReferenceType)
  return {
    type: AstNodeType.CELL_RANGE,
    start,
    end,
    sheetReferenceType,
    leadingWhitespace: leadingWhitespace,
    startOffset: leadingWhitespace && startOffset ? startOffset - leadingWhitespace.length : startOffset,
    endOffset: endOffset,
  }
}

export interface ColumnRangeAst extends AstWithWhitespace {
  type: AstNodeType.COLUMN_RANGE,
  start: ColumnAddress,
  end: ColumnAddress,
  sheetReferenceType: RangeSheetReferenceType,
}

export const buildColumnRangeAst = (
  start: ColumnAddress,
  end: ColumnAddress,
  sheetReferenceType: RangeSheetReferenceType,
  startOffset?: number,
  endOffset?: number,
  leadingWhitespace?: IToken
): ColumnRangeAst => {
  assertRangeConsistency(start, end, sheetReferenceType)
  return {
    type: AstNodeType.COLUMN_RANGE,
    start,
    end,
    sheetReferenceType,
    startOffset: leadingWhitespace?.startOffset ?? startOffset,
    endOffset,
    leadingWhitespace: leadingWhitespace?.image,
  }
}

export interface RowRangeAst extends AstWithWhitespace {
  type: AstNodeType.ROW_RANGE,
  start: RowAddress,
  end: RowAddress,
  sheetReferenceType: RangeSheetReferenceType,
}

export const buildRowRangeAst = (
  start: RowAddress,
  end: RowAddress,
  sheetReferenceType: RangeSheetReferenceType,
  startOffset?: number,
  endOffset?: number,
  leadingWhitespace?: IToken
): RowRangeAst => {
  assertRangeConsistency(start, end, sheetReferenceType)
  return {
    type: AstNodeType.ROW_RANGE,
    start,
    end,
    startOffset: leadingWhitespace?.startOffset ?? startOffset,
    endOffset,
    sheetReferenceType,
    leadingWhitespace: leadingWhitespace?.image,
  }
}

export interface BinaryOpAst extends AstWithWhitespace {
  left: Ast,
  right: Ast,
}

export interface ConcatenateOpAst extends BinaryOpAst {
  type: AstNodeType.CONCATENATE_OP,
}

export const buildConcatenateOpAst = (
  left: Ast,
  right: Ast,
  leadingWhitespace?: IToken
): ConcatenateOpAst => ({
  type: AstNodeType.CONCATENATE_OP,
  left,
  right,
  startOffset: leadingWhitespace?.startOffset ?? left.startOffset,
  endOffset: right.endOffset,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface EqualsOpAst extends BinaryOpAst {
  type: AstNodeType.EQUALS_OP,
}

export const buildEqualsOpAst = (
  left: Ast,
  right: Ast,
  leadingWhitespace?: IToken
): EqualsOpAst => ({
  type: AstNodeType.EQUALS_OP,
  left,
  right,
  startOffset: leadingWhitespace?.startOffset ?? left.startOffset,
  endOffset: right.endOffset,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface NotEqualOpAst extends BinaryOpAst {
  type: AstNodeType.NOT_EQUAL_OP,
}

export const buildNotEqualOpAst = (
  left: Ast,
  right: Ast,
  leadingWhitespace?: IToken
): NotEqualOpAst => ({
  type: AstNodeType.NOT_EQUAL_OP,
  left,
  right,
  startOffset: leadingWhitespace?.startOffset ?? left.startOffset,
  endOffset: right.endOffset,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface GreaterThanOpAst extends BinaryOpAst {
  type: AstNodeType.GREATER_THAN_OP,
}

export const buildGreaterThanOpAst = (
  left: Ast,
  right: Ast,
  leadingWhitespace?: IToken
): GreaterThanOpAst => ({
  type: AstNodeType.GREATER_THAN_OP,
  left,
  right,
  startOffset: leadingWhitespace?.startOffset ?? left.startOffset,
  endOffset: right.endOffset,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface LessThanOpAst extends BinaryOpAst {
  type: AstNodeType.LESS_THAN_OP,
}

export const buildLessThanOpAst = (
  left: Ast,
  right: Ast,
  leadingWhitespace?: IToken
): LessThanOpAst => ({
  type: AstNodeType.LESS_THAN_OP,
  left,
  right,
  startOffset: leadingWhitespace?.startOffset ?? left.startOffset,
  endOffset: right.endOffset,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface GreaterThanOrEqualOpAst extends BinaryOpAst {
  type: AstNodeType.GREATER_THAN_OR_EQUAL_OP,
}

export const buildGreaterThanOrEqualOpAst = (
  left: Ast,
  right: Ast,
  leadingWhitespace?: IToken
): GreaterThanOrEqualOpAst => ({
  type: AstNodeType.GREATER_THAN_OR_EQUAL_OP,
  left,
  right,
  startOffset: leadingWhitespace?.startOffset ?? left.startOffset,
  endOffset: right.endOffset,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface LessThanOrEqualOpAst extends BinaryOpAst {
  type: AstNodeType.LESS_THAN_OR_EQUAL_OP,
}

export const buildLessThanOrEqualOpAst = (
  left: Ast,
  right: Ast,
  leadingWhitespace?: IToken
): LessThanOrEqualOpAst => ({
  type: AstNodeType.LESS_THAN_OR_EQUAL_OP,
  left,
  right,
  startOffset: leadingWhitespace?.startOffset ?? left.startOffset,
  endOffset: right.endOffset,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface PlusOpAst extends BinaryOpAst {
  type: AstNodeType.PLUS_OP,
}

export const buildPlusOpAst = (
  left: Ast,
  right: Ast,
  leadingWhitespace?: IToken
): PlusOpAst => ({
  type: AstNodeType.PLUS_OP,
  left,
  right,
  startOffset: leadingWhitespace?.startOffset ?? left.startOffset,
  endOffset: right.endOffset,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface MinusOpAst extends BinaryOpAst {
  type: AstNodeType.MINUS_OP,
}

export const buildMinusOpAst = (
  left: Ast,
  right: Ast,
  leadingWhitespace?: IToken
): MinusOpAst => ({
  type: AstNodeType.MINUS_OP,
  left,
  right,
  startOffset: leadingWhitespace?.startOffset ?? left.startOffset,
  endOffset: right.endOffset,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface TimesOpAst extends BinaryOpAst {
  type: AstNodeType.TIMES_OP,
}

export const buildTimesOpAst = (
  left: Ast,
  right: Ast,
  leadingWhitespace?: IToken
): TimesOpAst => ({
  type: AstNodeType.TIMES_OP,
  left,
  right,
  startOffset: leadingWhitespace?.startOffset ?? left.startOffset,
  endOffset: right.endOffset,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface DivOpAst extends BinaryOpAst {
  type: AstNodeType.DIV_OP,
}

export const buildDivOpAst = (
  left: Ast,
  right: Ast,
  leadingWhitespace?: IToken
): DivOpAst => ({
  type: AstNodeType.DIV_OP,
  left,
  right,
  startOffset: leadingWhitespace?.startOffset ?? left.startOffset,
  endOffset: right.endOffset,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface PowerOpAst extends BinaryOpAst {
  type: AstNodeType.POWER_OP,
}

export const buildPowerOpAst = (
  left: Ast,
  right: Ast,
  leadingWhitespace?: IToken
): PowerOpAst => ({
  type: AstNodeType.POWER_OP,
  left,
  right,
  startOffset: leadingWhitespace?.startOffset ?? left.startOffset,
  endOffset: right.endOffset,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface MinusUnaryOpAst extends AstWithWhitespace {
  type: AstNodeType.MINUS_UNARY_OP,
  value: Ast,
}

export const buildMinusUnaryOpAst = (
  value: Ast,
  startOffset?: number,
  endOffset?: number,
  leadingWhitespace?: IToken
): MinusUnaryOpAst => ({
  type: AstNodeType.MINUS_UNARY_OP,
  value,
  startOffset: leadingWhitespace?.startOffset ?? startOffset,
  endOffset,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface PlusUnaryOpAst extends AstWithWhitespace {
  type: AstNodeType.PLUS_UNARY_OP,
  value: Ast,
}

export const buildPlusUnaryOpAst = (
  value: Ast,
  startOffset?: number,
  endOffset?: number,
  leadingWhitespace?: IToken
): PlusUnaryOpAst => ({
  type: AstNodeType.PLUS_UNARY_OP,
  value,
  startOffset: leadingWhitespace?.startOffset ?? startOffset,
  endOffset,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface PercentOpAst extends AstWithWhitespace {
  type: AstNodeType.PERCENT_OP,
  value: Ast,
}

export const buildPercentOpAst = (
  value: Ast,
  startOffset: number,
  endOffset?: number,
  leadingWhitespace?: IToken
): PercentOpAst => ({
  type: AstNodeType.PERCENT_OP,
  value,
  startOffset: leadingWhitespace?.startOffset ?? startOffset,
  endOffset,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface ProcedureAst extends AstWithInternalWhitespace {
  type: AstNodeType.FUNCTION_CALL,
  procedureName: string,
  args: Ast[],
}

export const buildProcedureAst = (
  procedureName: string,
  args: Ast[],
  startOffset: number,
  endOffset?: number,
  leadingWhitespace?: IToken,
  internalWhitespace?: IToken
): ProcedureAst => ({
  type: AstNodeType.FUNCTION_CALL,
  procedureName,
  args,
  startOffset: leadingWhitespace?.startOffset ?? startOffset,
  endOffset,
  leadingWhitespace: leadingWhitespace?.image,
  internalWhitespace: internalWhitespace?.image,
})

export interface ArrayAst extends AstWithInternalWhitespace {
  type: AstNodeType.ARRAY,
  args: Ast[][],
}

export const buildArrayAst = (
  args: Ast[][],
  leadingWhitespace?: IToken,
  internalWhitespace?: IToken
): ArrayAst => ({
  type: AstNodeType.ARRAY,
  args,
  leadingWhitespace: leadingWhitespace?.image,
  internalWhitespace: internalWhitespace?.image,
})

export interface NamedExpressionAst extends AstWithInternalWhitespace {
  type: AstNodeType.NAMED_EXPRESSION,
  expressionName: string,
}

export const buildNamedExpressionAst = (
  expressionName: string,
  startOffset: number,
  endOffset?: number,
  leadingWhitespace?: IToken
): NamedExpressionAst => ({
  type: AstNodeType.NAMED_EXPRESSION,
  expressionName,
  startOffset: leadingWhitespace?.startOffset ?? startOffset,
  endOffset,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface ParenthesisAst extends AstWithInternalWhitespace {
  type: AstNodeType.PARENTHESIS,
  expression: Ast,
}

export const buildParenthesisAst = (
  expression: Ast,
  startOffset: number,
  endOffset?: number,
  leadingWhitespace?: IToken,
  internalWhitespace?: IToken
): ParenthesisAst => ({
  type: AstNodeType.PARENTHESIS,
  expression,
  startOffset: leadingWhitespace?.startOffset ?? startOffset,
  endOffset,
  leadingWhitespace: leadingWhitespace?.image,
  internalWhitespace: internalWhitespace?.image,
})

export interface ErrorAst extends AstWithWhitespace {
  type: AstNodeType.ERROR,
  error: CellError,
}

export const buildCellErrorAst = (error: CellError, leadingWhitespace?: IToken): ErrorAst => ({
  type: AstNodeType.ERROR,
  error,
  leadingWhitespace: leadingWhitespace?.image,
})

export interface ErrorWithRawInputAst extends AstWithWhitespace {
  type: AstNodeType.ERROR_WITH_RAW_INPUT,
  rawInput: string,
  error: CellError,
}

export const buildErrorWithRawInputAst = (rawInput: string, error: CellError, leadingWhitespace?: IToken): ErrorWithRawInputAst => ({
  type: AstNodeType.ERROR_WITH_RAW_INPUT,
  error,
  rawInput,
  leadingWhitespace: leadingWhitespace?.image,
})

export const buildParsingErrorAst = (): ErrorAst => ({
  type: AstNodeType.ERROR,
  error: CellError.parsingError()
})

function assertRangeConsistency(start: AddressWithSheet, end: AddressWithSheet, sheetReferenceType: RangeSheetReferenceType) {
  if ((start.sheet !== undefined && end.sheet === undefined) || (start.sheet === undefined && end.sheet !== undefined)) {
    throw new Error('Start address inconsistent with end address')
  }
  if ((start.sheet === undefined && sheetReferenceType !== RangeSheetReferenceType.RELATIVE)
    || (start.sheet !== undefined && sheetReferenceType === RangeSheetReferenceType.RELATIVE)) {
    throw new Error('Sheet address inconsistent with sheet reference type')
  }
}

export function imageWithWhitespace(image: string, leadingWhitespace?: string) {
  return (leadingWhitespace ?? '') + image
}