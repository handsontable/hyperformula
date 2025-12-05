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

/**
 * Mapping from address ranges to range vertices
 *
 * TODO
 */
export class RangeMapping {
  /**
   * Map sheetId -> address of start and end (as string) -> vertex
   */
  private rangeMapping: Map<number, Map<string, RangeVertex>> = new Map()

  public getNumberOfRangesInSheet(sheet: number): Maybe<number> {
    return this.rangeMapping.get(sheet)?.size ?? 0
  }

  /**
   * Adds or updates vertex in the mapping
   *
   * @param vertex - vertex to save
   */
  public addOrUpdateVertex(vertex: RangeVertex): void {
    let sheetMap = this.rangeMapping.get(vertex.getStart().sheet)
    if (sheetMap === undefined) {
      sheetMap = new Map()
      this.rangeMapping.set(vertex.getStart().sheet, sheetMap)
    }
    const key = calculateRangeKey(vertex.getStart(), vertex.getEnd())
    sheetMap.set(key, vertex)
  }

  /**
   * Removes vertex from the mapping if it exists
   *
   * @param vertex - vertex to remove
   */
  public removeVertexIfExists(vertex: RangeVertex): void {
    const sheet = vertex.getStart().sheet
    const sheetMap = this.rangeMapping.get(sheet)
    if (sheetMap === undefined) {
      return
    }
    const key = calculateRangeKey(vertex.getStart(), vertex.getEnd())
    sheetMap.delete(key)
    if (sheetMap.size === 0) {
      this.rangeMapping.delete(sheet)
    }
  }

  /**
   * Returns associated vertex for given range
   *
   * @param start - top-left corner of the range
   * @param end - bottom-right corner of the range
   */
  public getRangeVertex(start: SimpleCellAddress, end: SimpleCellAddress): Maybe<RangeVertex> {
    const sheetMap = this.rangeMapping.get(start.sheet)
    const key = calculateRangeKey(start, end)
    return sheetMap?.get(key)
  }

  /**
   * Returns associated vertex for given range or throws an error if not found
   *
   * @param start - top-left corner of the range
   * @param end - bottom-right corner of the range
   */
  public getVertexOrThrow(start: SimpleCellAddress, end: SimpleCellAddress): RangeVertex {
    const maybeRange = this.getRangeVertex(start, end)
    if (!maybeRange) {
      throw Error('Range does not exist')
    }
    return maybeRange
  }

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
    updated.sort((left, right) => compareBy(left[1], right[1], coordinate))
    for (const [oldKey, vertex] of updated) {
      const newKey = keyFromRange(vertex.range)
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

  public removeRangesInSheet(sheet: number): IterableIterator<RangeVertex> {
    if (this.rangeMapping.has(sheet)) {
      const ranges = this.rangeMapping.get(sheet)!.values()
      this.rangeMapping.delete(sheet)
      return ranges
    }
    return [][Symbol.iterator]()
  }

  public* rangesInSheet(sheet: number): IterableIterator<RangeVertex> {
    const sheetMap = this.rangeMapping.get(sheet)
    if (!sheetMap) {
      return
    }
    yield* sheetMap.values()
  }

  public moveRangesBetweenSheets(sourceSheet: number, targetSheet: number): void {
    if (sourceSheet === targetSheet) {
      return
    }
    const sheetMap = this.rangeMapping.get(sourceSheet)
    if (!sheetMap) {
      return
    }
    this.rangeMapping.delete(sourceSheet)
    for (const [, vertex] of sheetMap) {
      vertex.range.moveToSheet(targetSheet)
      this.addOrUpdateVertex(vertex)
    }
  }

  public* rangeVerticesContainedInRange(sourceRange: AbsoluteCellRange): IterableIterator<RangeVertex> {
    for (const rangeVertex of this.rangesInSheet(sourceRange.sheet)) {
      if (sourceRange.containsRange(rangeVertex.range)) {
        yield rangeVertex
      }
    }
  }

  /**
   * Finds smaller range does have own vertex.
   *
   * @param range
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

  private* entriesFromSheet(sheet: number): IterableIterator<[string, RangeVertex]> {
    const sheetMap = this.rangeMapping.get(sheet)
    if (!sheetMap) {
      return
    }
    yield* sheetMap.entries()
  }

  private removeByKey(sheet: number, key: string) {
    this.rangeMapping.get(sheet)!.delete(key)
  }

  private getByKey(sheet: number, key: string): RangeVertex | undefined {
    return this.rangeMapping.get(sheet)?.get(key)
  }

  private updateVerticesFromSheet(sheet: number, fn: AdjustVerticesOperation): AdjustRangesResult {
    const updated = Array<AdjustVeticesOperationResult>()

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

type AdjustVeticesOperationResult = {
  changedSize: boolean,
  vertex: RangeVertex,
}

type AdjustVerticesOperation = (key: string, vertex: RangeVertex) => Maybe<AdjustVeticesOperationResult>

function calculateRangeKey(start: SimpleCellAddress, end: SimpleCellAddress): string {
  return `${start.col},${start.row},${end.col},${end.row}`
}

function keyFromRange(range: AbsoluteCellRange): string {
  return calculateRangeKey(range.start, range.end)
}

const compareBy = (left: RangeVertex, right: RangeVertex, coordinate: (address: SimpleCellAddress) => number) => {
  const leftStart = coordinate(left.range.start)
  const rightStart = coordinate(left.range.start)
  if (leftStart === rightStart) {
    const leftEnd = coordinate(left.range.end)
    const rightEnd = coordinate(right.range.end)
    return leftEnd - rightEnd
  } else {
    return leftStart - rightStart
  }
}
