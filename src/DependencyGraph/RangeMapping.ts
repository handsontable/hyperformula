/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {simpleCellAddress, SimpleCellAddress} from '../Cell'
import {Maybe} from '../Maybe'
import {Span} from '../Span'
import {RangeVertex} from './'

export interface AdjustRangesResult {
  verticesWithChangedSize: RangeVertex[],
}

export interface TruncateRangesResult extends AdjustRangesResult {
  verticesToRemove: RangeVertex[],
  verticesToMerge: [RangeVertex, RangeVertex][],
  verticesWithChangedSize: RangeVertex[],
}

type AdjustVerticesOperationResult = {
  changedSize: boolean,
  vertex: RangeVertex,
}

type AdjustVerticesOperation = (key: string, vertex: RangeVertex) => Maybe<AdjustVerticesOperationResult>

/**
 * Maintains a per-sheet map from serialized start/end coordinates to `RangeVertex`.
 * - Every range vertex in dependency graph should be stored in this mapping.
 * - Guarantees uniqueness: one vertex per distinct rectangle, enabling cache reuse.
 * - Implements "smaller prefix + tail row" optimization: if A1:A4 exists, A1:A5 depends on it + only A5.
 * - RangeVertex stores cached results for associative aggregates (SUM, COUNT) and criterion functions.
 */
export class RangeMapping {
    /**
     * Map sheetId -> address of start and end (as string) -> vertex
     */
    private rangeMapping: Map<number, Map<string, RangeVertex>> = new Map()

  /**
   * Returns number of ranges in the sheet or 0 if the sheet does not exist
   */
  public getNumberOfRangesInSheet(sheet: number): number {
    return this.rangeMapping.get(sheet)?.size ?? 0
  }

  /**
   * Adds or updates vertex in the mapping
   */
  public addOrUpdateVertex(vertex: RangeVertex): void {
    let sheetMap = this.rangeMapping.get(vertex.sheet)
    if (sheetMap === undefined) {
      sheetMap = new Map()
      this.rangeMapping.set(vertex.sheet, sheetMap)
    }
    const key = RangeMapping.calculateRangeKey(vertex.start, vertex.end)
    sheetMap.set(key, vertex)
  }

  /**
   * Removes vertex from the mapping if it exists
   */
  public removeVertexIfExists(vertex: RangeVertex): void {
    const sheet = vertex.sheet
    const sheetMap = this.rangeMapping.get(sheet)
    if (sheetMap === undefined) {
      return
    }
    const key = RangeMapping.calculateRangeKey(vertex.start, vertex.end)
    sheetMap.delete(key)
    if (sheetMap.size === 0) {
      this.rangeMapping.delete(sheet)
    }
  }

  /**
   * Returns associated vertex for given range
   */
  public getRangeVertex(start: SimpleCellAddress, end: SimpleCellAddress): Maybe<RangeVertex> {
    const sheetMap = this.rangeMapping.get(start.sheet)
    const key = RangeMapping.calculateRangeKey(start, end)
    return sheetMap?.get(key)
  }

  /**
   * Returns associated vertex for given range or throws an error if not found
   */
  public getVertexOrThrow(start: SimpleCellAddress, end: SimpleCellAddress): RangeVertex {
    const maybeRange = this.getRangeVertex(start, end)
    if (!maybeRange) {
      throw Error('Range does not exist')
    }
    return maybeRange
  }

  
  /**
   *
   */
  public truncateRanges(span: Span, coordinate: (address: SimpleCellAddress) => number): TruncateRangesResult {
    const verticesToRemove = Array<RangeVertex>()
    const updated = Array<[string, RangeVertex]>()
    const verticesWithChangedSize = Array<RangeVertex>()

    const sheet = span.sheet
    for (const [key, vertex] of this.entriesFromSheet(span.sheet)) {
      const range = vertex.range
      if (span.start <= coordinate(vertex.range.end)) {
        range.removeSpan(span)
        if (range.shouldBeRemoved()) {
          this.removeByKey(sheet, key)
          verticesToRemove.push(vertex)
        } else {
          updated.push([key, vertex])
        }
        verticesWithChangedSize.push(vertex)
      }
    }

    const verticesToMerge: [RangeVertex, RangeVertex][] = []
    updated.sort((left, right) => RangeMapping.compareBy(left[1], right[1], coordinate))
    for (const [oldKey, vertex] of updated) {
      const newKey = RangeMapping.calculateRangeKey(vertex.range.start, vertex.range.end)
      if (newKey === oldKey) {
        continue
      }

      const existingVertex = this.getByKey(sheet, newKey)
      this.removeByKey(sheet, oldKey)
      if (existingVertex !== undefined && vertex != existingVertex) {
        verticesToMerge.push([existingVertex, vertex])
      } else {
        this.addOrUpdateVertex(vertex)
      }
    }

    return {
      verticesToRemove,
      verticesToMerge,
      verticesWithChangedSize
    }
  }

  
  /**
   *
   */
  public moveAllRangesInSheetAfterAddingRows(sheet: number, row: number, numberOfRows: number): AdjustRangesResult {
    return this.updateVerticesFromSheet(sheet, (key: string, vertex: RangeVertex) => {
      if (row <= vertex.start.row) {
        vertex.range.shiftByRows(numberOfRows)
        return {
          changedSize: false,
          vertex: vertex
        }
      } else if (row > vertex.start.row && row <= vertex.end.row) {
        vertex.range.expandByRows(numberOfRows)
        return {
          changedSize: true,
          vertex: vertex
        }
      } else {
        return undefined
      }
    })
  }

  
  /**
   *
   */
  public moveAllRangesInSheetAfterAddingColumns(sheet: number, column: number, numberOfColumns: number): AdjustRangesResult {
    return this.updateVerticesFromSheet(sheet, (key: string, vertex: RangeVertex) => {
      if (column <= vertex.start.col) {
        vertex.range.shiftByColumns(numberOfColumns)
        return {
          changedSize: false,
          vertex: vertex
        }
      } else if (column > vertex.start.col && column <= vertex.end.col) {
        vertex.range.expandByColumns(numberOfColumns)
        return {
          changedSize: true,
          vertex: vertex
        }
      } else {
        return undefined
      }
    })
  }

  
  /**
   *
   */
  public moveRangesInsideSourceRange(sourceRange: AbsoluteCellRange, toRight: number, toBottom: number, toSheet: number) {
    this.updateVerticesFromSheet(sourceRange.sheet, (key: string, vertex: RangeVertex) => {
      if (sourceRange.containsRange(vertex.range)) {
        vertex.range.shiftByColumns(toRight)
        vertex.range.shiftByRows(toBottom)
        vertex.range.moveToSheet(toSheet)
        return {
          changedSize: false,
          vertex: vertex
        }
      } else {
        return undefined
      }
    })
  }

  
  /**
   *
   */
  public* rangesInSheet(sheet: number): IterableIterator<RangeVertex> {
    const sheetMap = this.rangeMapping.get(sheet)
    if (!sheetMap) {
      return
    }
    yield* sheetMap.values()
  }

  
  /**
   *
   */
  public* rangeVerticesContainedInRange(sourceRange: AbsoluteCellRange): IterableIterator<RangeVertex> {
    for (const rangeVertex of this.rangesInSheet(sourceRange.sheet)) {
      if (sourceRange.containsRange(rangeVertex.range)) {
        yield rangeVertex
      }
    }
  }

  /**
   * Finds smaller range if exists.
   */
  public findSmallerRange(range: AbsoluteCellRange): { smallerRangeVertex?: RangeVertex, restRange: AbsoluteCellRange } {
    if (range.height() > 1 && Number.isFinite(range.height())) {
      const valuesRangeEndRowLess = simpleCellAddress(range.end.sheet, range.end.col, range.end.row - 1)
      const rowLessVertex = this.getRangeVertex(range.start, valuesRangeEndRowLess)
      if (rowLessVertex !== undefined) {
        const restRange = AbsoluteCellRange.fromSimpleCellAddresses(simpleCellAddress(range.start.sheet, range.start.col, range.end.row), range.end)
        return {
          smallerRangeVertex: rowLessVertex,
          restRange,
        }
      }
    }
    return {
      restRange: range,
    }
  }

  /**
   * Calculates a string key from start and end addresses
   */
  private static calculateRangeKey(start: SimpleCellAddress, end: SimpleCellAddress): string {
    return `${start.col},${start.row},${end.col},${end.row}`
  }

  /**
   * Compares two range vertices by their start and end addresses using the provided coordinate function
   */
  private static compareBy(left: RangeVertex, right: RangeVertex, coordinate: (address: SimpleCellAddress) => number): number {
    const leftStart = coordinate(left.range.start)
    const rightStart = coordinate(right.range.start)
    if (leftStart === rightStart) {
      const leftEnd = coordinate(left.range.end)
      const rightEnd = coordinate(right.range.end)
      return leftEnd - rightEnd
    } else {
      return leftStart - rightStart
    }
  }

  
  /**
   *
   */
  private* entriesFromSheet(sheet: number): IterableIterator<[string, RangeVertex]> {
    const sheetMap = this.rangeMapping.get(sheet)
    if (!sheetMap) {
      return
    }
    yield* sheetMap.entries()
  }

  
  /**
   *
   */
  private removeByKey(sheet: number, key: string): void {
    const sheetMap = this.rangeMapping.get(sheet)

    if (!sheetMap) {
      throw new Error(`Sheet ${sheet} not found`)
    }
    sheetMap.delete(key)
  }

  
  /**
   *
   */
  private getByKey(sheet: number, key: string): RangeVertex | undefined {
    return this.rangeMapping.get(sheet)?.get(key)
  }

  
  /**
   *
   */
  private updateVerticesFromSheet(sheet: number, fn: AdjustVerticesOperation): AdjustRangesResult {
    const updated = Array<AdjustVerticesOperationResult>()

    for (const [key, vertex] of this.entriesFromSheet(sheet)) {
      const result = fn(key, vertex)
      if (result !== undefined) {
        this.removeByKey(sheet, key)
        updated.push(result)
      }
    }

    updated.forEach(entry => {
      this.addOrUpdateVertex(entry.vertex)
    })

    return {
      verticesWithChangedSize: updated
        .filter(entry => entry.changedSize)
        .map(entry => entry.vertex)
    }
  }
}
