import {CellValue, ErrorType, CellError} from '../Cell'
import {Size} from '../Matrix'
import {DependencyGraph} from '../DependencyGraph/DependencyGraph'
import {AbsoluteCellRange} from '../AbsoluteCellRange'

type ScalarValue = number

export class SimpleRangeValue {
  constructor(
    public readonly size: Size,
    public readonly dependencyGraph: DependencyGraph,
    public data?: ScalarValue[][] | CellError,
    public readonly range?: AbsoluteCellRange,
  ) {
  }

  public static withData(data: number[][], size: Size, range: AbsoluteCellRange, dependencyGraph: DependencyGraph): SimpleRangeValue {
    return new SimpleRangeValue(size, dependencyGraph, data, range)
  }

  public static onlyData(data: number[][], size: Size, dependencyGraph: DependencyGraph): SimpleRangeValue {
    return new SimpleRangeValue(size, dependencyGraph, data, undefined)
  }

  public static onlyError(data: CellError, dependencyGraph: DependencyGraph): SimpleRangeValue {
    return new SimpleRangeValue({ width: 0, height: 0}, dependencyGraph, data, undefined)
  }

  public static fromRange(range: AbsoluteCellRange, dependencyGraph: DependencyGraph): SimpleRangeValue {
    return new SimpleRangeValue({ width: range.width(), height: range.height() }, dependencyGraph, undefined, range)
  }

  public static fromScalar(scalar: ScalarValue, dependencyGraph: DependencyGraph): SimpleRangeValue {
    return new SimpleRangeValue({ width: 1, height: 1 }, dependencyGraph, [[scalar]], undefined)
  }

  public width(): number {
    return this.size.width;
  }

  public height(): number {
    return this.size.height;
  }

  public isErrorMatrix(): boolean {
    this.ensureThatComputed()
    return (this.data instanceof CellError)
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

  private computeDataFromDependencyGraph(): ScalarValue[][] | CellError {
    const result = []

    let i = 0
    let row = []
    for (const cellFromRange of this.range!.addresses()) {
      const value = this.dependencyGraph.getCellValue(cellFromRange)
      if (typeof value === 'number') {
        row.push(value)
        ++i
      } else {
        return new CellError(ErrorType.VALUE)
      }

      if (i % this.range!.width() === 0) {
        i = 0
        result.push([...row])
        row = []
      }
    }

    return result
  }
}

export type InterpreterValue = CellValue | SimpleRangeValue
