/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {invalidSimpleCellAddress, simpleCellAddress, SimpleCellAddress} from './Cell'
import {Operations} from './Operations'
import {DependencyGraph, ParsingErrorVertex, EmptyCellVertex, FormulaCellVertex, MatrixVertex, ValueCellVertex} from './DependencyGraph'
import {ValueCellVertexValue} from './DependencyGraph/ValueCellVertex'
import {InvalidArgumentsError} from './errors'
import {LazilyTransformingAstService} from './LazilyTransformingAstService'
import {ParserWithCaching} from './parser'
import {ParsingError} from './parser/Ast'

export type ClipboardCell = ClipboardCellValue | ClipboardCellFormula | ClipboardCellEmpty | ClipboardCellParsingError

enum ClipboardOperationType {
  COPY,
  CUT,
}

export enum ClipboardCellType {
  VALUE,
  EMPTY,
  FORMULA,
  PARSING_ERROR,
}

export interface ClipboardCellValue {
  type: ClipboardCellType.VALUE,
  value: ValueCellVertexValue,
}

export interface ClipboardCellEmpty {
  type: ClipboardCellType.EMPTY,
}

export interface ClipboardCellFormula {
  type: ClipboardCellType.FORMULA,
  hash: string,
}

export interface ClipboardCellParsingError {
  type: ClipboardCellType.PARSING_ERROR,
  rawInput: string,
  errors: ParsingError[],
}

class Clipboard {
  constructor(
    public readonly sourceLeftCorner: SimpleCellAddress,
    public readonly width: number,
    public readonly height: number,
    public readonly type: ClipboardOperationType,
    public readonly content?: ClipboardCell[][],
  ) {
  }

  public* getContent(leftCorner: SimpleCellAddress): IterableIterator<[SimpleCellAddress, ClipboardCell]> {
    if (this.content === undefined) {
      return
    } else {
      for (let y = 0; y < this.height; ++y) {
        for (let x = 0; x < this.width; ++x) {
          yield [simpleCellAddress(leftCorner.sheet, leftCorner.col + x, leftCorner.row + y), this.content[y][x]]
        }
      }
    }
  }
}

export class ClipboardOperations {
  public clipboard?: Clipboard

  constructor(
    private readonly dependencyGraph: DependencyGraph,
    private readonly operations: Operations,
    private readonly parser: ParserWithCaching,
    private readonly lazilyTransformingAstService: LazilyTransformingAstService,
  ) {
  }

  public cut(leftCorner: SimpleCellAddress, width: number, height: number): void {
    this.clipboard = new Clipboard(leftCorner, width, height, ClipboardOperationType.CUT)
  }

  public copy(leftCorner: SimpleCellAddress, width: number, height: number): void {
    const content: ClipboardCell[][] = []

    for (let y = 0; y < height; ++y) {
      content[y] = []

      for (let x = 0; x < width; ++x) {
        const clipboardCell = this.operations.getClipboardCell(simpleCellAddress(leftCorner.sheet, leftCorner.col + x, leftCorner.row + y))
        content[y].push(clipboardCell)
      }
    }

    this.clipboard = new Clipboard(leftCorner, width, height, ClipboardOperationType.COPY, content)
  }

  public abortCut(): void {
    if (this.clipboard && this.clipboard.type === ClipboardOperationType.CUT) {
      this.clear()
    }
  }

  public clear(): void {
    this.clipboard = undefined
  }

  public ensureItIsPossibleToCopyPaste(destinationLeftCorner: SimpleCellAddress): void {
    if (this.clipboard === undefined) {
      return
    }

    if (invalidSimpleCellAddress(destinationLeftCorner) ||
      !this.dependencyGraph.sheetMapping.hasSheetWithId(destinationLeftCorner.sheet)) {
      throw new InvalidArgumentsError()
    }

    const targetRange = AbsoluteCellRange.spanFrom(destinationLeftCorner, this.clipboard.width, this.clipboard.height)

    if (this.dependencyGraph.matrixMapping.isFormulaMatrixInRange(targetRange)) {
      throw new Error('It is not possible to paste onto matrix')
    }
  }

  public isCutClipboard(): boolean {
    return this.clipboard !== undefined && this.clipboard.type === ClipboardOperationType.CUT
  }

  public isCopyClipboard(): boolean {
    return this.clipboard !== undefined && this.clipboard.type === ClipboardOperationType.COPY
  }
}
