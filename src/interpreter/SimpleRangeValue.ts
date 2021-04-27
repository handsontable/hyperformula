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

export class SimpleRangeValue {
  private readonly size: MatrixSize

  public static numbersRange(data: InternalScalarValue[][], range: AbsoluteCellRange, dependencyGraph: DependencyGraph): SimpleRangeValue {
    return new SimpleRangeValue(data, range, dependencyGraph, true)
  }

  public static onlyNumbers(data: number[][]): SimpleRangeValue {
    return new SimpleRangeValue(data, undefined, undefined, true)
  }

  public static onlyValues(data: InternalScalarValue[][]): SimpleRangeValue {
    return new SimpleRangeValue(data, undefined, undefined, undefined)
  }

  public static onlyRange(range: AbsoluteCellRange, dependencyGraph: DependencyGraph): SimpleRangeValue {
    return new SimpleRangeValue(undefined, range, dependencyGraph, undefined)
  }

  public static fromScalar(scalar: InternalScalarValue): SimpleRangeValue {
    return new SimpleRangeValue([[scalar]], undefined, undefined, undefined)
  }

  constructor(
    private _data?: InternalScalarValue[][],
    public readonly range?: AbsoluteCellRange,
    private readonly dependencyGraph?: DependencyGraph,
    private _hasOnlyNumbers?: boolean,
  ) {
    if(_data===undefined) {
      this.size = new MatrixSize(range!.width(), range!.height())
    } else {
      this.size = new MatrixSize(_data![0].length, _data!.length)
    }
  }

  public isAdHoc(): boolean {
    return this.range === undefined
  }

  public width(): number {
    return this.size.width
  }

  public height(): number {
    return this.size.height
  }

  public get data(): InternalScalarValue[][] {
    this.ensureThatComputed()
    return this._data!
  }

  private ensureThatComputed() {
    if(this._data !== undefined) {
      return
    }
    this._hasOnlyNumbers = true
    this._data = this.range!.addressesArrayMap(this.dependencyGraph!, cellFromRange => {
      const value = this.dependencyGraph!.getCellValue(cellFromRange)
      if (value instanceof SimpleRangeValue) {
        this._hasOnlyNumbers = false
        return new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
      } else if (isExtendedNumber(value)) {
        return value
      } else {
        this._hasOnlyNumbers = false
        return value
      }
    })

  }

  public valuesFromTopLeftCorner(): InternalScalarValue[] {
    this.ensureThatComputed()

    const ret = []
    for (let i = 0; i < this._data!.length; i++) {
      for (let j = 0; j < this._data![0].length; j++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ret.push(this._data![i][j])
      }
    }
    return ret
  }

  public* iterateValuesFromTopLeftCorner(): IterableIterator<InternalScalarValue> {
    yield* this.valuesFromTopLeftCorner()
  }

  public numberOfElements(): number {
    return this.size.width * this.size.height
  }

  public hasOnlyNumbers() {
    if (this._hasOnlyNumbers === undefined) {
      this._hasOnlyNumbers = true
      for(const row of this.data) {
        for(const v of row) {
          if (typeof v !== 'number') {
            this._hasOnlyNumbers = false
            return false
          }
        }
      }
    }

    return this._hasOnlyNumbers
  }

  public rawNumbers(): number[][] {
    return this._data as number[][]
  }

  public sameDimensionsAs(other: SimpleRangeValue): boolean {
    return this.width() === other.width() && this.height() === other.height()
  }

  public onlyRangeData(): boolean {
    return this.range !== undefined
  }
}
