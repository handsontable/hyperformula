import {HyperFormula, SimpleCellAddress} from '../src'
import {simpleCellRange} from '../src/AbsoluteCellRange'
import {adr} from './testUtils'
import {ExpectedValueOfTypeError} from '../src/errors'

describe('address queries', () => {
  describe('getCellDependents', () => {
    it('should return reversed dependencies', () => {
      const engine = HyperFormula.buildFromArray([
        [1, 2, 3],
        ['=SUM(A1:B1)', '=SUMSQ(A1:B1)'],
        ['=A2+B2'],
      ])
      expect(engine.getCellDependents(adr('A1'))).toEqual([simpleCellRange(adr('A1'), adr('B1'))])
      expect(engine.getCellDependents(adr('D1'))).toEqual([])
      expect(engine.getCellDependents(adr('A2'))).toEqual([adr('A3')])
      expect(engine.getCellDependents(adr('B2'))).toEqual([adr('A3')])
      expect(engine.getCellDependents(adr('A3'))).toEqual([])

      expect(engine.getCellDependents(simpleCellRange(adr('A1'), adr('B1')))).toEqual([adr('A2'), adr('B2')])
      expect(engine.getCellDependents(simpleCellRange(adr('A3'), adr('B3')))).toEqual([])
    })

    it('should return reversed dependencies across sheets', () => {
      const engine = HyperFormula.buildFromSheets(
        {
          'DataSheet': [[1, 2, 3, '=A1']],
          'DependentSheet': [['=DataSheet!A1', '=DataSheet!A1', '=DataSheet!A1+DataSheet!B1', '=A1']],
        }
      )

      const dataSheetId = engine.getSheetId('DataSheet')
      const dependentSheetId = engine.getSheetId('DependentSheet')

      expect(engine.getCellDependents(adr('A1', dataSheetId))).toEqual([
        adr('D1', dataSheetId),
        adr('A1', dependentSheetId),
        adr('B1', dependentSheetId),
        adr('C1', dependentSheetId)
      ])
      expect(engine.getCellDependents(adr('B1', dataSheetId))).toEqual([adr('C1', dependentSheetId)])
      expect(engine.getCellDependents(adr('C1', dataSheetId))).toEqual([])
      expect(engine.getCellDependents(adr('D1', dataSheetId))).toEqual([])
    })

    it('should throw error if address is a malformed SimpleCellAddress', () => {
      const engine = HyperFormula.buildFromArray([
        [1, 2, 3],
        ['=SUM(A1:B1)', '=SUMSQ(A1:B1)'],
        ['=A2+B2'],
      ])
      
      const malformedAddress = {col: 0} as SimpleCellAddress
      
      expect(() => {
        engine.getCellDependents(malformedAddress)
      }).toThrow(new ExpectedValueOfTypeError('SimpleCellAddress | SimpleCellRange', malformedAddress.toString()))
    })    

  })

  describe('getCellPrecedents', () => {
    it('should return dependencies', () => {
      const engine = HyperFormula.buildFromArray([
        [1, 2, 3],
        ['=SUM(A1:B1)', '=SUMSQ(A1:B1)'],
        ['=A2+B2'],
      ])
      expect(engine.getCellPrecedents(adr('A1'))).toEqual([])
      expect(engine.getCellPrecedents(adr('D1'))).toEqual([])
      expect(engine.getCellPrecedents(adr('A2'))).toEqual([simpleCellRange(adr('A1'), adr('B1'))])
      expect(engine.getCellPrecedents(adr('B2'))).toEqual([simpleCellRange(adr('A1'), adr('B1'))])
      expect(engine.getCellPrecedents(adr('A3'))).toEqual([adr('A2'), adr('B2')])

      expect(engine.getCellPrecedents(simpleCellRange(adr('A1'), adr('B1')))).toEqual([adr('A1'), adr('B1')])
      expect(engine.getCellPrecedents(simpleCellRange(adr('A3'), adr('B3')))).toEqual([])
    })

    it('should throw error if address is a malformed SimpleCellAddress', () => {
      const engine = HyperFormula.buildFromArray([
        [1, 2, 3],
        ['=SUM(A1:B1)', '=SUMSQ(A1:B1)'],
        ['=A2+B2'],
      ])
      const malformedAddress = {col: 0} as SimpleCellAddress
      expect(() => {
        engine.getCellPrecedents(malformedAddress)
      }).toThrow(new ExpectedValueOfTypeError('SimpleCellAddress | SimpleCellRange', malformedAddress.toString()))
    })    
  })
})
