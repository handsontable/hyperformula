import {simpleCellAddress} from '../src/Cell'
import {simpleCellAddressFromString, simpleCellAddressToString} from "../src/parser";


describe('simpleCellAddressFromString', () => {
  const sheetMappingFunction = (name: string): number | undefined => {
    const index = ['Sheet1', 'Sheet2', 'Sheet3'].indexOf(name)
    return index > 0 ? index : undefined
  }

  it('should return simple cell address', () => {
    expect(simpleCellAddressFromString(sheetMappingFunction, 'A1', 0)).toEqual(simpleCellAddress(0, 0, 0))
    expect(simpleCellAddressFromString(sheetMappingFunction, 'AY7', 0)).toEqual(simpleCellAddress(0, 50, 6))
  })

  it('should return undefined', () => {
    expect(simpleCellAddressFromString(sheetMappingFunction, '$Sheet4.A1', 0)).toBeUndefined()
  })

  it('should return address with overridden sheet', () => {
    expect(simpleCellAddressFromString(sheetMappingFunction, 'A1', 1)).toEqual(simpleCellAddress(1, 0, 0))
  })

  it('should return address with sheet number from sheet mapping', () => {
    expect(simpleCellAddressFromString(sheetMappingFunction, '$Sheet2.A1', 1)).toEqual(simpleCellAddress(1, 0, 0))
  })

  it('should return address with sheet number from sheet mapping regardless of override parameter', () => {
    expect(simpleCellAddressFromString(sheetMappingFunction, '$Sheet3.A1', 1)).toEqual(simpleCellAddress(2, 0, 0))
  })
})

describe('simpleCellAddressToString', () => {
  const sheetIndexMappingFunction = (index: number): string | undefined => {
    const name = ['Sheet1', 'Sheet2', 'Sheet3'][index]
    return name
  }

  it('should return string representation', () => {
    expect(simpleCellAddressToString(sheetIndexMappingFunction, simpleCellAddress(0, 0, 0), 0)).toEqual('A1')
    expect(simpleCellAddressToString(sheetIndexMappingFunction, simpleCellAddress(0, 50, 6), 0)).toEqual('AY7')
  })

  it('should return string representation with sheet name', () => {
    expect(simpleCellAddressToString(sheetIndexMappingFunction, simpleCellAddress(0, 0, 0), 1)).toEqual('$Sheet1.A1')
  })

  it('should return undefined', () => {
    expect(simpleCellAddressToString(sheetIndexMappingFunction, simpleCellAddress(42, 0, 0), 42)).toBeUndefined()
    expect(simpleCellAddressToString(sheetIndexMappingFunction, simpleCellAddress(42, 0, 0), 1)).toBeUndefined()
  })
})
