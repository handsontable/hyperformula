/**
 * @license
 * Copyright (c) 2023 Handsoncode. All rights reserved.
 */

import {AbsoluteCellRange} from './AbsoluteCellRange'
import {ArraySize} from './ArraySize'
import {CellError, ErrorType, simpleCellAddress, SimpleCellAddress} from './Cell'
import {DependencyGraph} from './DependencyGraph'
import {ErrorMessage} from './error-message'
import {InternalScalarValue, isExtendedNumber} from './interpreter/InterpreterValue'

/**
 * A class that represents a range of data.
 */
export class SimpleRangeValue {

  /**
   * A property that represents the size of the range.
   */
  public readonly size: ArraySize

  /**
   * In most cases, it's more convenient to create a `SimpleRangeValue` object
   * by calling one of the [static factory methods](#fromrange).
   */
  constructor(
    private _data?: InternalScalarValue[][],

    /**
     * A property that represents the address of the range.
     */
    public readonly range?: AbsoluteCellRange,
    private readonly dependencyGraph?: DependencyGraph,
    private _hasOnlyNumbers?: boolean,
  ) {
    this.size = _data === undefined
      ? new ArraySize(range!.effectiveWidth(dependencyGraph!), range!.effectiveHeight(dependencyGraph!))
      : new ArraySize(_data[0].length, _data.length)
  }

  /**
   * Returns the range data as a 2D array.
   */
  public get data(): InternalScalarValue[][] {
    this.ensureThatComputed()
    return this._data!
  }

  /**
   * A factory method. Returns a `SimpleRangeValue` object with the provided range address and the provided data.
   */
  public static fromRange(data: InternalScalarValue[][], range: AbsoluteCellRange, dependencyGraph: DependencyGraph): SimpleRangeValue {
    return new SimpleRangeValue(data, range, dependencyGraph, true)
  }

  /**
   * A factory method. Returns a `SimpleRangeValue` object with the provided numeric data.
   */
  public static onlyNumbers(data: number[][]): SimpleRangeValue {
    return new SimpleRangeValue(data, undefined, undefined, true)
  }

  /**
   * A factory method. Returns a `SimpleRangeValue` object with the provided data.
   */
  public static onlyValues(data: InternalScalarValue[][]): SimpleRangeValue {
    return new SimpleRangeValue(data, undefined, undefined, undefined)
  }

  /**
   * A factory method. Returns a `SimpleRangeValue` object with the provided range address.
   */
  public static onlyRange(range: AbsoluteCellRange, dependencyGraph: DependencyGraph): SimpleRangeValue {
    return new SimpleRangeValue(undefined, range, dependencyGraph, undefined)
  }

  /**
   * A factory method. Returns a `SimpleRangeValue` object that contains a single value.
   */
  public static fromScalar(scalar: InternalScalarValue): SimpleRangeValue {
    return new SimpleRangeValue([[scalar]], undefined, undefined, undefined)
  }

  /**
   * Returns `true` if and only if the `SimpleRangeValue` has no address set.
   */
  public isAdHoc(): boolean {
    return this.range === undefined
  }

  /**
   * Returns the number of columns contained in the range.
   */
  public width(): number {
    return this.size.width
  }

  /**
   * Returns the number of rows contained in the range.
   */
  public height(): number {
    return this.size.height
  }

  /**
   * Returns the range data as a 1D array.
   */
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

  /**
   * Generates the addresses of the cells contained in the range assuming the provided address is the left corner of the range.
   */
  public* effectiveAddressesFromData(leftCorner: SimpleCellAddress): IterableIterator<SimpleCellAddress> {
    for (let row = 0; row < this.data.length; ++row) {
      const rowData = this.data[row]
      for (let col = 0; col < rowData.length; ++col) {
        yield simpleCellAddress(leftCorner.sheet, leftCorner.col + col, leftCorner.row + row)
      }
    }
  }

  /**
   * Generates values and addresses of the cells contained in the range assuming the provided address is the left corner of the range.
   *
   * This method combines the functionalities of [`iterateValuesFromTopLeftCorner()`](#iteratevaluesfromtopleftcorner) and [`effectiveAddressesFromData()`](#effectiveaddressesfromdata).
   */
  public* entriesFromTopLeftCorner(leftCorner: SimpleCellAddress): IterableIterator<[InternalScalarValue, SimpleCellAddress]> {
    this.ensureThatComputed()
    for (let row = 0; row < this.size.height; ++row) {
      for (let col = 0; col < this.size.width; ++col) {
        yield [this._data![row][col], simpleCellAddress(leftCorner.sheet, leftCorner.col + col, leftCorner.row + row)]
      }
    }
  }

  /**
   * Generates the values of the cells contained in the range assuming the provided address is the left corner of the range.
   */
  public* iterateValuesFromTopLeftCorner(): IterableIterator<InternalScalarValue> {
    yield* this.valuesFromTopLeftCorner()
  }

  /**
   * Returns the number of cells contained in the range.
   */
  public numberOfElements(): number {
    return this.size.width * this.size.height
  }

  /**
   * Returns `true` if and only if the range contains only numeric values.
   */
  public hasOnlyNumbers(): boolean {
    if (this._hasOnlyNumbers === undefined) {
      this._hasOnlyNumbers = true
      for (const row of this.data) {
        for (const v of row) {
          if (typeof v !== 'number') {
            this._hasOnlyNumbers = false
            return false
          }
        }
      }
    }

    return this._hasOnlyNumbers
  }

  /**
   * Returns the range data as a 2D array of numbers.
   *
   * Internal use only.
   */
  public rawNumbers(): number[][] {
    return this._data as number[][]
  }


  /**
   * Returns the range data as a 2D array.
   *
   * Internal use only.
   */
  public rawData(): InternalScalarValue[][] {
    this.ensureThatComputed()
    return this._data ?? []
  }

  /**
   * Returns `true` if and only if the range has the same width and height as the `other` range object.
   */
  public sameDimensionsAs(other: SimpleRangeValue): boolean {
    return this.width() === other.width() && this.height() === other.height()
  }

  /**
   * Computes the range data if it is not computed yet.
   */
  private ensureThatComputed(): void {
    if (this._data !== undefined) {
      return
    }

    this._hasOnlyNumbers = true
    this._data = this.range!.addressesArrayMap(this.dependencyGraph!, cellFromRange => {
      const value = this.dependencyGraph!.getCellValue(cellFromRange)
      if (value instanceof SimpleRangeValue) {
        this._hasOnlyNumbers = false
        return new CellError(ErrorType.VALUE, ErrorMessage.ScalarExpected)
      } else if (isExtendedNumber(value)) {
        return value as InternalScalarValue
      } else {
        this._hasOnlyNumbers = false
        return value as InternalScalarValue
      }
    })
  }
}
