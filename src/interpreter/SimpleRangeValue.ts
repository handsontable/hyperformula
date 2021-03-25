/**
 * @license
 * Copyright (c) 2021 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from '../AbsoluteCellRange'
import {CellError, ErrorType} from '../Cell'
import {DependencyGraph} from '../DependencyGraph'
import {ErrorMessage} from '../error-message'
import {MatrixSize} from '../Matrix'
import {Maybe} from '../Maybe'
import {InternalScalarValue, isExtendedNumber} from './InterpreterValue'

export class ArrayData {
  constructor(
    public readonly size: MatrixSize,
    public readonly data: InternalScalarValue[][],
    public _hasOnlyNumbers: boolean,
  ) {
  }

  public range(): undefined {
    return undefined
  }

  public hasOnlyNumbers() {
    return this._hasOnlyNumbers
  }

  public topLeftCorner(): Maybe<InternalScalarValue> {
    if (this.size.height > 0 && this.size.width > 0) {
      return this.data[0][0]
    }
    return undefined
  }

  public map(op: (arg: InternalScalarValue) => InternalScalarValue) {
    for(let i=0; i<this.data.length; i++) {
      for(let j=0; j< this.data[0].length; j++) {
        this.data[i][j] = op(this.data[i][j])
      }
    }
  }

  public ensureThatComputed() {}

  public valuesFromTopLeftCorner(): InternalScalarValue[] {
    const ret = []
    for (let i = 0; i < this.size.height; i++) {
      for (let j = 0; j < this.size.width; j++) {
        ret.push(this.data[i][j])
      }
    }
    return ret
  }

  public* iterateValuesFromTopLeftCorner(): IterableIterator<InternalScalarValue> {
    for (let i = 0; i < this.size.height; i++) {
      for (let j = 0; j < this.size.width; j++) {
        yield this.data[i][j]
      }
    }
  }

  public raw(): InternalScalarValue[][] {
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
  public data?: InternalScalarValue[][]
  public _hasOnlyNumbers?: boolean

  constructor(
    public readonly size: MatrixSize,
    public readonly _range: AbsoluteCellRange,
    public readonly dependencyGraph: DependencyGraph,
  ) {
  }

  public raw(): InternalScalarValue[][] {
    this.ensureThatComputed()

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
      for (const v of this.iterateValuesFromTopLeftCorner()) {
        if (typeof v !== 'number') {
          this._hasOnlyNumbers = false
          break
        }
      }
      this._hasOnlyNumbers = true
    }

    return this._hasOnlyNumbers
  }

  public topLeftCorner(): Maybe<InternalScalarValue> {
    if (this.data !== undefined && this.size.height > 0 && this.size.width > 0) {
      return this.data[0][0]
    }
    return undefined
  }

  public range() {
    return this._range
  }

  public valuesFromTopLeftCorner(): InternalScalarValue[] {
    this.ensureThatComputed()

    const ret = []
    for (let i = 0; i < this.data!.length; i++) {
      for (let j = 0; j < this.data![0].length; j++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ret.push(this.data![i][j])
      }
    }
    return ret
  }

  public* iterateValuesFromTopLeftCorner(): IterableIterator<InternalScalarValue> {
    this.ensureThatComputed()

    for (let i = 0; i < this.data!.length; i++) {
      for (let j = 0; j < this.data![0].length; j++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        yield this.data![i][j]
      }
    }
  }

  public map(op: (arg: InternalScalarValue) => InternalScalarValue) {
    this.ensureThatComputed()
    for(let i=0; i<this.data!.length; i++) {
      for(let j=0; j< this.data![0].length; j++) {
        this.data![i][j] = op(this.data![i][j])
      }
    }
  }

  public ensureThatComputed() {
    if (this.data === undefined) {
      this.data = this.computeDataFromDependencyGraph()
    }
  }

  private computeDataFromDependencyGraph(): InternalScalarValue[][] {
    return this._range.addressesArrayMap(this.dependencyGraph, cellFromRange => {
      const value = this.dependencyGraph.getCellValue(cellFromRange)
      if (value instanceof SimpleRangeValue) {
        return new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
      } else if (isExtendedNumber(value)) {
        return value
      } else {
        this._hasOnlyNumbers = false
        return value
      }
    })
  }
}

export type RangeData = ArrayData | OnlyRangeData

export class SimpleRangeValue {
  public get size(): MatrixSize {
    return this.data.size
  }

  public static onlyNumbersDataWithRange(data: number[][], size: MatrixSize, range: AbsoluteCellRange): SimpleRangeValue {
    return new SimpleRangeValue(new ArrayData(size, data, true), range)
  }

  public static onlyNumbersDataWithoutRange(data: number[][], size: MatrixSize): SimpleRangeValue {
    return new SimpleRangeValue(new ArrayData(size, data, true))
  }

  public static onlyValues(data: InternalScalarValue[][]): SimpleRangeValue {
    return new SimpleRangeValue(new ArrayData(MatrixSize.fromMatrix(data), data, false), undefined, true) //FIXME test for _hasOnlyNumbers
    //FIXME check for matrix size consistency
  }

  public static onlyRange(range: AbsoluteCellRange, dependencyGraph: DependencyGraph): SimpleRangeValue {
    return new SimpleRangeValue(new OnlyRangeData({
      width: range.width(),
      height: range.height()
    }, range, dependencyGraph), undefined, true)
  }

  public static fromScalar(scalar: InternalScalarValue): SimpleRangeValue {
    const hasOnlyNumbers = isExtendedNumber(scalar)
    return new SimpleRangeValue(new ArrayData({width: 1, height: 1}, [[scalar]], hasOnlyNumbers))
  }

  constructor(
    public readonly data: RangeData,
    private readonly _range?: AbsoluteCellRange,
    public readonly adhoc?: boolean
  ) {
  }

  public width(): number {
    return this.data.size.width
  }

  public height(): number {
    return this.data.size.height
  }

  public raw(): InternalScalarValue[][] {
    return this.data.raw()
  }

  public topLeftCornerValue(): Maybe<InternalScalarValue> {
    return this.data.topLeftCorner()
  }

  public valuesFromTopLeftCorner(): InternalScalarValue[] {
    return this.data.valuesFromTopLeftCorner()
  }

  public* iterateValuesFromTopLeftCorner(): IterableIterator<InternalScalarValue> {
    yield* this.data.iterateValuesFromTopLeftCorner()
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

  public range(): Maybe<AbsoluteCellRange> {
    return this._range ?? this.data.range()
  }

  public sameDimensionsAs(other: SimpleRangeValue): boolean {
    return this.width() === other.width() && this.height() === other.height()
  }
}
