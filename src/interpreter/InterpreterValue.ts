import {CellValue, ErrorType, CellError} from '../Cell'
import {Size} from '../Matrix'
import {DependencyGraph} from '../DependencyGraph/DependencyGraph'
import {AbsoluteCellRange} from '../AbsoluteCellRange'

export class ArrayData {
  constructor(
    public readonly size: Size,
    public readonly data: CellValue[][],
    public _hasOnlyNumbers: boolean
  ) {
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
      throw "Data is not only numbers"
    }
  }
}

export class OnlyRangeData {
  public data: CellValue[][] | undefined
  public _hasOnlyNumbers?: boolean;

  constructor(
    public readonly size: Size,
    public readonly range: AbsoluteCellRange,
    public readonly dependencyGraph: DependencyGraph,
  ) {
  }

  public raw(): CellValue[][] {
    this.ensureThatComputed()

    return this.data!
  }

  public rawNumbers(): number[][] {
    if (this.hasOnlyNumbers()) {
      return this.data as number[][]
    } else {
      throw "Data is not only numbers"
    }
  }

  private ensureThatComputed() {
    if (this.data === undefined) {
      this.data = this.computeDataFromDependencyGraph()
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

    return this._hasOnlyNumbers;
  }

  public* valuesFromTopLeftCorner(): IterableIterator<CellValue> {
    this.ensureThatComputed()

    for (let i = 0; i < this.size.height; i++) {
      for (let j = 0; j < this.size.width; j++) {
        yield this.data![i][j]
      }
    }
  }

  private computeDataFromDependencyGraph(): CellValue[][] {
    const result: CellValue[][] = []

    let i = 0
    let row = []
    for (const cellFromRange of this.range.addresses()) {
      const value = this.dependencyGraph.getCellValue(cellFromRange)
      if (typeof value === 'number') {
        row.push(value)
      } else {
        row.push(value)
        this._hasOnlyNumbers = false
      }
      ++i

      if (i % this.range.width() === 0) {
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
  constructor(
    public readonly data: RangeData
  ) {
  }

  public static onlyNumbersDataWithRange(data: number[][], size: Size, range: AbsoluteCellRange): SimpleRangeValue {
    return new SimpleRangeValue(new ArrayData(size, data, true))
  }

  public static onlyNumbersDataWithoutRange(data: number[][], size: Size): SimpleRangeValue {
    return new SimpleRangeValue(new ArrayData(size, data, true))
  }

  public static onlyRange(range: AbsoluteCellRange, dependencyGraph: DependencyGraph): SimpleRangeValue {
    return new SimpleRangeValue(new OnlyRangeData({ width: range.width(), height: range.height() }, range, dependencyGraph))
  }

  public static fromScalar(scalar: CellValue): SimpleRangeValue {
    let hasOnlyNumbers = (typeof scalar === 'number')
    return new SimpleRangeValue(new ArrayData({ width: 1, height: 1 }, [[scalar]], hasOnlyNumbers))
  }

  public width(): number {
    return this.data.size.width;
  }

  public height(): number {
    return this.data.size.height;
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
}

export type InterpreterValue = CellValue | SimpleRangeValue
