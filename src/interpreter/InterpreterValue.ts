import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellValue} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {MatrixSize} from '../Matrix'

export class ArrayData {
  constructor(
    public readonly size: MatrixSize,
    public readonly data: CellValue[][],
    public _hasOnlyNumbers: boolean,
  ) {
  }

  public range(): undefined {
    return undefined
  }

  public hasOnlyNumbers() {
    return this._hasOnlyNumbers
  }

  public* valuesFromTopLeftCorner(): IterableIterator<CellValue> {
    for (let i = 0; i < this.size.height; i++) {
      for (let j = 0; j < this.size.width; j++) {
        yield this.data[i][j]
      }
    }
  }

  public raw(): CellValue[][] {
    return this.data
  }

  public rawNumbers(): number[][] {
    if (this.hasOnlyNumbers()) {
      return this.data as number[][]
    } else {
      throw new Error('Data is not only numbers')
    }
  }
}

export class OnlyRangeData {
  public data: CellValue[][] | undefined
  public _hasOnlyNumbers?: boolean

  constructor(
    public readonly size: MatrixSize,
    public readonly _range: AbsoluteCellRange,
    public readonly dependencyGraph: DependencyGraph,
  ) {
  }

  public range(): AbsoluteCellRange {
    return this._range
  }

  public raw(): CellValue[][] {
    this.ensureThatComputed()

    return this.data!
  }

  public rawNumbers(): number[][] {
    if (this.hasOnlyNumbers()) {
      return this.data as number[][]
    } else {
      throw new Error('Data is not only numbers')
    }
  }

  public hasOnlyNumbers() {
    this.ensureThatComputed()

    if (this._hasOnlyNumbers === undefined) {
      for (const v of this.valuesFromTopLeftCorner()) {
        if (typeof v !== 'number') {
          this._hasOnlyNumbers = false
          break
        }
      }
      this._hasOnlyNumbers = true
    }

    return this._hasOnlyNumbers
  }

  public* valuesFromTopLeftCorner(): IterableIterator<CellValue> {
    this.ensureThatComputed()

    for (let i = 0; i < this.size.height; i++) {
      for (let j = 0; j < this.size.width; j++) {
        yield this.data![i][j]
      }
    }
  }

  private ensureThatComputed() {
    if (this.data === undefined) {
      this.data = this.computeDataFromDependencyGraph()
    }
  }

  private computeDataFromDependencyGraph(): CellValue[][] {
    const result: CellValue[][] = []

    let i = 0
    let row = []
    for (const cellFromRange of this._range.addresses()) {
      const value = this.dependencyGraph.getCellValue(cellFromRange)
      if (typeof value === 'number') {
        row.push(value)
      } else {
        row.push(value)
        this._hasOnlyNumbers = false
      }
      ++i

      if (i % this._range.width() === 0) {
        i = 0
        result.push([...row])
        row = []
      }
    }

    return result
  }
}

export type RangeData = ArrayData | OnlyRangeData

export class SimpleRangeValue {

  public get size(): MatrixSize {
    return this.data.size
  }

  public static onlyNumbersDataWithRange(data: number[][], size: MatrixSize, range: AbsoluteCellRange): SimpleRangeValue {
    return new SimpleRangeValue(new ArrayData(size, data, true))
  }

  public static onlyNumbersDataWithoutRange(data: number[][], size: MatrixSize): SimpleRangeValue {
    return new SimpleRangeValue(new ArrayData(size, data, true))
  }

  public static onlyRange(range: AbsoluteCellRange, dependencyGraph: DependencyGraph): SimpleRangeValue {
    return new SimpleRangeValue(new OnlyRangeData({ width: range.width(), height: range.height() }, range, dependencyGraph))
  }

  public static fromScalar(scalar: CellValue): SimpleRangeValue {
    const hasOnlyNumbers = (typeof scalar === 'number')
    return new SimpleRangeValue(new ArrayData({ width: 1, height: 1 }, [[scalar]], hasOnlyNumbers))
  }
  constructor(
    public readonly data: RangeData,
  ) {
  }

  public width(): number {
    return this.data.size.width
  }

  public height(): number {
    return this.data.size.height
  }

  public raw(): CellValue[][] {
    return this.data.raw()
  }

  public* valuesFromTopLeftCorner(): IterableIterator<CellValue> {
    yield *this.data.valuesFromTopLeftCorner()
  }

  public numberOfElements(): number {
    return this.data.size.width * this.data.size.height
  }

  public hasOnlyNumbers(): boolean {
    return this.data.hasOnlyNumbers()
  }

  public rawNumbers(): number[][] {
    return this.data.rawNumbers()
  }

  public range(): AbsoluteCellRange | undefined {
    return this.data.range()
  }

  public sameDimensionsAs(other: SimpleRangeValue): boolean {
    return this.width() === other.width() && this.height() === other.height()
  }
}

export type InterpreterValue = CellValue | SimpleRangeValue
