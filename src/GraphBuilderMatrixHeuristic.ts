/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {simpleCellAddress, SimpleCellAddress} from './Cell'
import {CellContent, CellContentParser, RawCellContent} from './CellContentParser'
import {CellDependency} from './CellDependency'
import {ColumnSearchStrategy} from './ColumnSearch/ColumnSearchStrategy'
import {DependencyGraph, MatrixVertex, Vertex} from './DependencyGraph'
import {Matrix, MatrixSize} from './Matrix'
import {Sheets} from './Sheet'

export class Array2d<T> {
  public static fromArray<T>(input: T[][]): Array2d<T> {
    const size: MatrixSize = new MatrixSize(input[0].length, input.length)
    const array = new Array2d<T>(size)
    for (let i = 0; i < size.height; ++i) {
      for (let j = 0; j < size.width; ++j) {
        array.set(j, i, input[i][j])
      }
    }
    return array
  }

  private readonly _size: MatrixSize
  private readonly array: T[][]

  constructor(size: MatrixSize) {
    this._size = size
    this.array = new Array(size.height)
    for (let y = 0; y < size.height; ++y) {
      this.array[y] = new Array(size.width)
    }
  }

  public set(x: number, y: number, value: T) {
    this.array[y][x] = value
  }

  public get(x: number, y: number): T | null {
    const row = this.array[y]
    if (!row) {
      return null
    }
    return row[x] || null
  }

  public size() {
    return this._size
  }
}

export interface PossibleMatrix {
  isMatrix: boolean,
  range: AbsoluteCellRange,
  cells: SimpleCellAddress[],
}

export class GraphBuilderMatrixHeuristic {
  private mapping: Map<number, Array2d<boolean>> = new Map()

  constructor(
    private readonly dependencyGraph: DependencyGraph,
    private readonly columnSearch: ColumnSearchStrategy,
    private readonly dependencies: Map<Vertex, CellDependency[]>,
    private readonly threshold: number,
    private readonly cellContentParser: CellContentParser,
  ) {
  }

  public addSheet(id: number, size: MatrixSize) {
    this.mapping.set(id, new Array2d<boolean>(size))
  }

  public add(cellAddress: SimpleCellAddress) {
    if (!this.mapping.has(cellAddress.sheet)) {
      throw Error(`Sheet with id: ${cellAddress.sheet} does not exists`)
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.mapping.get(cellAddress.sheet)!.set(cellAddress.col, cellAddress.row, true)
  }

  public run(sheets: Sheets): PossibleMatrix[] {
    const notMatrices: PossibleMatrix[] = []
    const scanResult = this.findMatrices()

    scanResult.forEach((elem: PossibleMatrix) => {
      if (!elem.isMatrix || elem.range.size() < this.threshold) {
        notMatrices.push(elem)
        return
      }
      const possibleMatrix = elem.range
      const matrixVertex = MatrixVertex.fromRange(possibleMatrix)
      const sheet = sheets[this.dependencyGraph.getSheetName(possibleMatrix.start.sheet)]
      const matrix = this.matrixFromPlainValues(possibleMatrix, sheet)
      matrixVertex.setCellValue(matrix)
      this.dependencyGraph.addMatrixVertex(matrixVertex.getAddress(), matrixVertex)
      this.columnSearch.add(matrix, matrixVertex.getAddress())
    })

    this.mapping.clear()
    return notMatrices
  }

  public matrixFromPlainValues(range: AbsoluteCellRange, sheet: RawCellContent[][]): Matrix {
    const values = new Array(range.height())

    for (let i = 0; i < range.height(); ++i) {
      values[i] = new Array(range.width())
    }

    for (const address of range.addresses(this.dependencyGraph)) {
      const cellContent = sheet[address.row][address.col]
      const parsedCellContent = this.cellContentParser.parse(cellContent)
      if (parsedCellContent instanceof CellContent.Number) {
        values[address.row - range.start.row][address.col - range.start.col] = parsedCellContent.value
      } else {
        throw new Error('Range contains not numeric values')
      }
    }

    return new Matrix(values)
  }

  private findMatrices(): PossibleMatrix[] {
    const result: PossibleMatrix[] = []
    this.mapping.forEach((m, sheet) => {
      for (const possibleMatrix of findMatrices(sheet, m)) {
        result.push(possibleMatrix)
      }
    })
    return result
  }
}

export function findMatrices(sheet: number, input: Array2d<boolean>): IterableIterator<PossibleMatrix> {
  const size = input.size()
  const result = new Map<number, PossibleMatrix>()
  const colours = new Array2d<number>(size)
  let colour = 0

  for (let y = size.height - 1; y >= 0; --y) {
    for (let x = size.width - 1; x >= 0; --x) {
      const value = input.get(x, y)

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [right, rightColour] = [input.get(x + 1, y)!, colours.get(x + 1, y)!]
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [bottom, bottomColour] = [input.get(x, y + 1)!, colours.get(x, y + 1)!]
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [diag, diagColour] = [input.get(x + 1, y + 1)!, colours.get(x + 1, y + 1)!]

      if (!value) {
        colours.set(x, y, 0)
        if (rightColour === bottomColour) {
          // 0 1
          // 1 *
          if (result.has(rightColour)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            result.get(rightColour)!.isMatrix = false
          }
        }
      } else if (value !== right && rightColour === bottomColour) {
        // 1 2
        // 2 *
        colours.set(x, y, ++colour)
        result.set(colour, possibleMatrix(AbsoluteCellRange.fromCoordinates(sheet, x, y, x, y), true, [simpleCellAddress(sheet, x, y)]))
        if (result.has(rightColour)) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          result.get(rightColour)!.isMatrix = false
        }
      } else if (value !== diag) {
        if (right === value && right === bottom) {
          // 1 1
          // 1 0
          if (result.has(rightColour)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            result.get(rightColour)!.isMatrix = false
          }
          if (result.has(bottomColour)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            result.get(bottomColour)!.isMatrix = false
          }
          colours.set(x, y, ++colour)
          result.set(colour, possibleMatrix(AbsoluteCellRange.fromCoordinates(sheet, x, y, x, y), true, [simpleCellAddress(sheet, x, y)]))
        } else if (right !== value && bottom === value) {
          // 1 0
          // 1 0
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          if (result.has(bottomColour) && result.get(bottomColour)!.isMatrix) {
            colours.set(x, y, bottomColour)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const old = result.get(bottomColour)!
            old.cells.push(simpleCellAddress(sheet, x, y))
            result.set(bottomColour, possibleMatrix(old.range.withStart(simpleCellAddress(sheet, x, y)), true, old.cells))
          } else {
            colours.set(x, y, ++colour)
            result.set(colour, possibleMatrix(AbsoluteCellRange.fromCoordinates(sheet, x, y, x, y), true, [simpleCellAddress(sheet, x, y)]))
          }
        } else if (right === value && bottom !== value) {
          // 1 1
          // 0 0
          colours.set(x, y, rightColour)
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const old = result.get(rightColour)!
          old.cells.push(simpleCellAddress(sheet, x, y))
          result.set(rightColour, possibleMatrix(old.range.withStart(simpleCellAddress(sheet, x, y)), true, old.cells))
        } else {
          colours.set(x, y, ++colour)
          result.set(colour, possibleMatrix(AbsoluteCellRange.fromCoordinates(sheet, x, y, x, y), true, [simpleCellAddress(sheet, x, y)]))
        }
      } else if (value === diag && diagColour === rightColour && diagColour === bottomColour) {
        // 1 1
        // 1 1
        colours.set(x, y, rightColour)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const old = result.get(rightColour)!
        old.cells.push(simpleCellAddress(sheet, x, y))
        result.set(rightColour, possibleMatrix(old.range.withStart(simpleCellAddress(sheet, x, y)), true, old.cells))
      } else if (value === diag) {
        colours.set(x, y, ++colour)
        result.set(colour, possibleMatrix(AbsoluteCellRange.fromCoordinates(sheet, x, y, x, y), true, [simpleCellAddress(sheet, x, y)]))
      }
    }
  }

  return result.values()
}

function possibleMatrix(range: AbsoluteCellRange, isMatrix: boolean, cells: SimpleCellAddress[]): PossibleMatrix {
  return {
    isMatrix,
    range,
    cells,
  }
}
