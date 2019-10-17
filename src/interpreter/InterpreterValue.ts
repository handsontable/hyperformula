import {CellValue, ErrorType, CellError} from '../Cell'
import {Size} from '../Matrix'
import {DependencyGraph} from '../DependencyGraph/DependencyGraph'
import {AbsoluteCellRange} from '../AbsoluteCellRange'

type ScalarValue = number

export class ArrayData {
  constructor(
    public readonly size: Size,
    public readonly data: ScalarValue[][] | CellError,
    public _hasOnlyNumbers: boolean
  ) {
  }

  public hasOnlyNumbers() {
    if (this.data instanceof CellError) {
      return false
    }
    return this._hasOnlyNumbers
  }

  public* valuesFromTopLeftCorner(): IterableIterator<ScalarValue> {
    if (this.data instanceof CellError) {
      throw "Cant return array when theres an error"
    } else {
      for (let i = 0; i < this.size.height; i++) {
        for (let j = 0; j < this.size.width; j++) {
          yield this.data[i][j]
        }
      }
    }
  }

  public raw(): ScalarValue[][] {
    if (this.data instanceof CellError) {
      throw "Cant return array when theres an error"
    } else {
      return this.data
    }
  }
}

export class OnlyRangeData {
  public data: ScalarValue[][] | CellError | undefined
  public _hasOnlyNumbers?: boolean;

  constructor(
    public readonly size: Size,
    public readonly range: AbsoluteCellRange,
    public readonly dependencyGraph: DependencyGraph,
  ) {
  }

  public raw(): ScalarValue[][] {
    this.ensureThatComputed()

    if (this.data instanceof CellError) {
      throw "Cant return array when theres an error"
    } else {
      return this.data!
    }
  }

  private ensureThatComputed() {
    if (this.data === undefined) {
      this.data = this.computeDataFromDependencyGraph()
    }
  }

  public hasOnlyNumbers() {
    this.ensureThatComputed()
    if (this.data instanceof CellError) {
      return false
    }
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

  public* valuesFromTopLeftCorner(): IterableIterator<ScalarValue> {
    this.ensureThatComputed()

    if (this.data instanceof CellError) {
      throw "Cant return array when theres an error"
    } else {
      for (let i = 0; i < this.size.height; i++) {
        for (let j = 0; j < this.size.width; j++) {
          yield this.data![i][j]
        }
      }
    }
  }

  private computeDataFromDependencyGraph(): ScalarValue[][] | CellError {
    const result = []

    let i = 0
    let row = []
    for (const cellFromRange of this.range.addresses()) {
      const value = this.dependencyGraph.getCellValue(cellFromRange)
      if (typeof value === 'number') {
        row.push(value)
        ++i
      } else {
        return new CellError(ErrorType.VALUE)
      }

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

  public static withData(data: number[][], size: Size, range: AbsoluteCellRange): SimpleRangeValue {
    return new SimpleRangeValue(new ArrayData(size, data, true))
  }

  public static onlyData(data: number[][], size: Size): SimpleRangeValue {
    return new SimpleRangeValue(new ArrayData(size, data, true))
  }

  public static onlyError(data: CellError): SimpleRangeValue {
    return new SimpleRangeValue(new ArrayData({ width: 1, height: 1 }, data, false))
  }

  public static fromRange(range: AbsoluteCellRange, dependencyGraph: DependencyGraph): SimpleRangeValue {
    return new SimpleRangeValue(new OnlyRangeData({ width: range.width(), height: range.height() }, range, dependencyGraph))
  }

  public static fromScalar(scalar: ScalarValue): SimpleRangeValue {
    return new SimpleRangeValue(new ArrayData({ width: 1, height: 1 }, [[scalar]], true))
  }

  public width(): number {
    return this.data.size.width;
  }

  public height(): number {
    return this.data.size.height;
  }

  public raw(): ScalarValue[][] {
    return this.data.raw()
  }

  public* valuesFromTopLeftCorner(): IterableIterator<ScalarValue> {
    yield *this.data.valuesFromTopLeftCorner()
  }

  public numberOfElements(): number {
    return this.data.size.width * this.data.size.height
  }

  public hasOnlyNumbers(): boolean {
    return this.data.hasOnlyNumbers()
  }
}

export type InterpreterValue = CellValue | SimpleRangeValue
