import {simpleCellRange} from '../src/AbsoluteCellRange'
import {simpleCellAddress} from '../src/Cell'
import {Maybe} from '../src/Maybe'
import {
  simpleCellAddressFromString,
  simpleCellAddressToString,
  simpleCellRangeFromString,
  simpleCellRangeToString
} from '../src/parser'
import {adr} from './testUtils'

describe('simpleCellAddressFromString', () => {
  const sheetMappingFunction = (name: string): Maybe<number> => {
    const index = ['Sheet1', 'Sheet2', 'Sheet3'].indexOf(name)
    return index > 0 ? index : undefined
  }

  it('should return simple cell address', () => {
    expect(simpleCellAddressFromString(sheetMappingFunction, 'A1', 0)).toEqual(adr('A1'))
    expect(simpleCellAddressFromString(sheetMappingFunction, 'AY7', 0)).toEqual(simpleCellAddress(0, 50, 6))
  })

  it('should return undefined', () => {
    expect(simpleCellAddressFromString(sheetMappingFunction, 'Sheet4!A1', 0)).toBeUndefined()
  })

  it('should return address with overridden sheet', () => {
    expect(simpleCellAddressFromString(sheetMappingFunction, 'A1', 1)).toEqual(adr('A1', 1))
  })

  it('should return address with sheet number from sheet mapping', () => {
    expect(simpleCellAddressFromString(sheetMappingFunction, 'Sheet2!A1', 1)).toEqual(adr('A1', 1))
  })

  it('should return address with sheet number from sheet mapping regardless of override parameter', () => {
    expect(simpleCellAddressFromString(sheetMappingFunction, 'Sheet3!A1', 1)).toEqual(adr('A1', 2))
  })
})

describe('simpleCellRangeFromString', () => {
  const sheetMappingFunction = (name: string): Maybe<number> => {
    const index = ['Sheet1', 'Sheet2', 'Sheet3'].indexOf(name)
    return index > 0 ? index : undefined
  }

  it('should not accept invalid ranges', () => {
    expect(simpleCellRangeFromString(sheetMappingFunction, 'A1', 0)).toEqual(undefined)
    expect(simpleCellRangeFromString(sheetMappingFunction, 'A1:B1:C1', 0)).toEqual(undefined)
  })

  it('should return undefined when the Sheet4 does not exist', () => {
    expect(simpleCellRangeFromString(sheetMappingFunction, 'Sheet4!A1:A2', 0)).toEqual(undefined)
  })

  it('should return address with overridden sheet', () => {
    expect(simpleCellRangeFromString(sheetMappingFunction, 'A1:A2', 1)).toEqual(simpleCellRange(adr('A1', 1), adr('A2', 1)))
  })

  it('should return address with sheet number from sheet mapping', () => {
    expect(simpleCellRangeFromString(sheetMappingFunction, 'Sheet2!A1:A2', 1)).toEqual(simpleCellRange(adr('A1', 1), adr('A2', 1)))
  })

  it('should return address with sheet number from sheet mapping for both start and end', () => {
    expect(simpleCellRangeFromString(sheetMappingFunction, 'Sheet2!A1:Sheet2!A2', 1)).toEqual(simpleCellRange(adr('A1', 1), adr('A2', 1)))
  })

  it('should return address with sheet number from sheet mapping regardless of override parameter', () => {
    expect(simpleCellRangeFromString(sheetMappingFunction, 'Sheet3!A1:Sheet3!A2', 1)).toEqual(simpleCellRange(adr('A1', 2), adr('A2', 2)))
  })

  it('should not accept distinct sheets', () => {
    expect(simpleCellRangeFromString(sheetMappingFunction, 'A1:Sheet3!A2', 1)).toEqual(undefined)
    expect(simpleCellRangeFromString(sheetMappingFunction, 'Sheet2!A1:Sheet3!A2', 1)).toEqual(undefined)
  })
})

describe('simpleCellAddressToString', () => {
  const sheetIndexMappingFunction = (index: number): Maybe<string> => {
    return ['Sheet1', 'Sheet2', 'Sheet3', '~`!@#$%^&*()_-+_=/|?{}[]"', "Sheet'With'Quotes"][index]
  }

  it('should return string representation', () => {
    expect(simpleCellAddressToString(sheetIndexMappingFunction, adr('A1'), 0)).toEqual('A1')
    expect(simpleCellAddressToString(sheetIndexMappingFunction, simpleCellAddress(0, 50, 6), 0)).toEqual('AY7')
  })

  it('should return string representation with sheet name', () => {
    expect(simpleCellAddressToString(sheetIndexMappingFunction, adr('A1'), 1)).toEqual('Sheet1!A1')
  })

  it('should quote sheet names with special characters', () => {
    expect(simpleCellAddressToString(sheetIndexMappingFunction, adr('A1', 3), 1)).toEqual("'~`!@#$%^&*()_-+_=/|?{}[]\"'!A1")
  })

  it('should escape quote in quotes', () => {
    expect(simpleCellAddressToString(sheetIndexMappingFunction, adr('A1', 4), 1)).toEqual("'Sheet''With''Quotes'!A1")
  })

  it('should return undefined', () => {
    expect(simpleCellAddressToString(sheetIndexMappingFunction, adr('A1', 42), 42)).toBeUndefined()
    expect(simpleCellAddressToString(sheetIndexMappingFunction, adr('A1', 42), 1)).toBeUndefined()
  })
})

describe('simpleCellRangeToString', () => {
  const sheetIndexMappingFunction = (index: number): Maybe<string> => {
    return ['Sheet1', 'Sheet2', 'Sheet3'][index]
  }

  it('should return string representation', () => {
    expect(simpleCellRangeToString(sheetIndexMappingFunction, simpleCellRange(adr('A1'), adr('A2')), 0)).toEqual('A1:A2')
  })

  it('should return string representation with sheet name', () => {
    expect(simpleCellRangeToString(sheetIndexMappingFunction, simpleCellRange(adr('A1'), adr('A2')), 1)).toEqual('Sheet1!A1:A2')
  })

  it('should return undefined when refering nonexistent sheet', () => {
    expect(simpleCellRangeToString(sheetIndexMappingFunction, simpleCellRange(adr('A1', 42), adr('A2', 42)), 42)).toBeUndefined()
    expect(simpleCellRangeToString(sheetIndexMappingFunction, simpleCellRange(adr('A1', 42), adr('A2', 42)), 1)).toBeUndefined()
  })
})
