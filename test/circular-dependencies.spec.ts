import {ErrorType, HyperFormula} from '../src'
import {Config} from '../src/Config'
import {adr, detailedError} from './testUtils'

describe('Circular Dependencies', () => {
  describe('with allowCircularReferences disabled (default)', () => {
    it('simple cycle should return CYCLE error', () => {
      const engine = HyperFormula.buildFromArray([['=B1', '=A1']])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.CYCLE))
      expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.CYCLE))
    })

    it('three-cell cycle should return CYCLE error', () => {
      const engine = HyperFormula.buildFromArray([['=B1', '=C1', '=A1']])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.CYCLE))
      expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.CYCLE))
      expect(engine.getCellValue(adr('C1'))).toEqualError(detailedError(ErrorType.CYCLE))
    })

    it('cycle with formula should return CYCLE error', () => {
      const engine = HyperFormula.buildFromArray([['5', '=A1+B1']])
      expect(engine.getCellValue(adr('B1'))).toEqualError(detailedError(ErrorType.CYCLE))
    })
  })

  describe('with allowCircularReferences enabled', () => {
    it('should handle simple two-cell cycle', () => {
      const engine = HyperFormula.buildFromArray([['=B1+1', '=A1+1']], {
        allowCircularReferences: true
      })

      const valueA = engine.getCellValue(adr('A1'))
      const valueB = engine.getCellValue(adr('B1'))
      
      expect(valueA).toBe(200)
      expect(valueB).toBe(199)
    })

    it('should handle three-cell cycle', () => {
      const engine = HyperFormula.buildFromArray([['=B1+1', '=C1+1', '=A1+1']], {
        allowCircularReferences: true
      })

      const valueA = engine.getCellValue(adr('A1'))
      const valueB = engine.getCellValue(adr('B1'))
      const valueC = engine.getCellValue(adr('C1'))
      
      expect(valueA).toBe(300)
      expect(valueB).toBe(299)
      expect(valueC).toBe(298)
    })

    it('should converge to stable values for self-referencing formula', () => {
      const engine = HyperFormula.buildFromArray([['=A1*0.9 + 10']], {
        allowCircularReferences: true
      })

      const value = engine.getCellValue(adr('A1'))
      expect(value).toBe(99.99734386)
    })

    it('should handle cycles with non-cyclic dependencies', () => {
      const engine = HyperFormula.buildFromArray([
        ['=B1+1', '=A1+1', '10'],
        ['=C1*2', '', '']
      ], {
        allowCircularReferences: true
      })

      const valueA1 = engine.getCellValue(adr('A1'))
      const valueA2 = engine.getCellValue(adr('A2'))
      const valueB1 = engine.getCellValue(adr('B1'))
      const valueC1 = engine.getCellValue(adr('C1'))
      
      expect(valueA1).toBe(200)
      expect(valueA2).toBe(20)
      expect(valueB1).toBe(199)
      expect(valueC1).toBe(10)
    })

    it('should handle multiple independent cycles', () => {
      const engine = HyperFormula.buildFromArray([
        ['=B1+1', '=A1+1'],
        ['=B2+2', '=A2+2']
      ], {
        allowCircularReferences: true
      })

      const valueA1 = engine.getCellValue(adr('A1'))
      const valueA2 = engine.getCellValue(adr('A2'))
      const valueB1 = engine.getCellValue(adr('B1'))
      const valueB2 = engine.getCellValue(adr('B2'))
      
      expect(valueA1).toBe(200)
      expect(valueA2).toBe(400)
      expect(valueB1).toBe(199)
      expect(valueB2).toBe(398)
    })

    it('should propagate changes to dependent cells after cycle resolution', () => {
      const engine = HyperFormula.buildFromArray([
        ['=B1+1', '=A1+1', '=A1+B1']
      ], {
        allowCircularReferences: true
      })

      const valueA = engine.getCellValue(adr('A1'))
      const valueB = engine.getCellValue(adr('B1'))
      const valueC = engine.getCellValue(adr('C1'))
      
      expect(valueA).toBe(200)
      expect(valueB).toBe(199)
      expect(valueC).toBe(399)
    })

    it('should handle self-cycles', () => {
      const engine = HyperFormula.buildFromArray([['5']], {
        allowCircularReferences: true
      })

      // Create cycle by changing cell content
      engine.setCellContents(adr('A1'), [['=A1*2']])
      
      const value = engine.getCellValue(adr('A1'))
      expect(value).toBe(0)
    })

    it('should handle complex formula cycles', () => {
      const engine = HyperFormula.buildFromArray([
        ['=SUM(B1:C1)', '=A1/2', '=A1/3']
      ], {
        allowCircularReferences: true
      })

      const valueA = engine.getCellValue(adr('A1'))
      const valueB = engine.getCellValue(adr('B1'))
      const valueC = engine.getCellValue(adr('C1'))
      
      expect(valueA).toBe(0)
      expect(valueB).toBe(0)
      expect(valueC).toBe(0)
    })

    it('should handle range references in cycles', () => {
      const engine = HyperFormula.buildFromArray([
        ['=SUM(A1:A2)', '=A1'],
        ['5', '=A1']
      ], {
        allowCircularReferences: true
      })

      const valueA1 = engine.getCellValue(adr('A1'))
      const valueB1 = engine.getCellValue(adr('B1'))
      const valueA2 = engine.getCellValue(adr('A2'))
      const valueB2 = engine.getCellValue(adr('B2'))
      
      
      expect(valueA1).toBe(500)
      expect(valueB1).toBe(500)
      expect(valueA2).toBe(5)
      expect(valueB2).toBe(500)
    })

    it('should work with partialRun operations', () => {
      const engine = HyperFormula.buildFromArray([['=B1+1', '=A1+1']], {
        allowCircularReferences: true
      })

      // Add a new dependency
      engine.setCellContents(adr('C1'), [['=A1*2']])
      
      const valueA = engine.getCellValue(adr('A1'))
      const valueB = engine.getCellValue(adr('B1'))
      const valueC = engine.getCellValue(adr('C1'))
      
      expect(valueA).toBe(200)
      expect(valueB).toBe(199)
      expect(valueC).toBe(400)
    })

    it('should handle cascading cycles', () => {
      const engine = HyperFormula.buildFromArray([
        ['=B1+1', '=A1+1', '=D1+1', '=C1+1']
      ], {
        allowCircularReferences: true
      })

      const valueA = engine.getCellValue(adr('A1'))
      const valueB = engine.getCellValue(adr('B1'))
      const valueC = engine.getCellValue(adr('C1'))
      const valueD = engine.getCellValue(adr('D1'))

      expect(valueA).toBe(200)
      expect(valueB).toBe(199)
      expect(valueC).toBe(200)
      expect(valueD).toBe(199)
    })
  })

  describe('configuration validation', () => {
    it('should validate allowCircularReferences as boolean', () => {
      // eslint-disable-next-line
      // @ts-ignore
      expect(() => new Config({allowCircularReferences: 'true'}))
        .toThrowError('Expected value of type: boolean for config parameter: allowCircularReferences')
      
      // eslint-disable-next-line
      // @ts-ignore
      expect(() => new Config({allowCircularReferences: 1}))
        .toThrowError('Expected value of type: boolean for config parameter: allowCircularReferences')
      
      // eslint-disable-next-line
      // @ts-ignore
      expect(() => new Config({allowCircularReferences: {}}))
        .toThrowError('Expected value of type: boolean for config parameter: allowCircularReferences')
    })

    it('should accept valid boolean values', () => {
      expect(() => new Config({allowCircularReferences: true})).not.toThrow()
      expect(() => new Config({allowCircularReferences: false})).not.toThrow()
    })

    it('should default to false', () => {
      const config = new Config()
      expect(config.allowCircularReferences).toBe(false)
    })

    it('should preserve configured value', () => {
      const configTrue = new Config({allowCircularReferences: true})
      const configFalse = new Config({allowCircularReferences: false})
      
      expect(configTrue.allowCircularReferences).toBe(true)
      expect(configFalse.allowCircularReferences).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty cells in cycles', () => {
      const engine = HyperFormula.buildFromArray([['=B1', '']], {
        allowCircularReferences: true
      })

      engine.setCellContents(adr('B1'), [['=A1']])
      
      const valueA = engine.getCellValue(adr('A1'))
      const valueB = engine.getCellValue(adr('B1'))
      
      expect(valueA).toBe('') // Empty cell treated as 0 in numeric context
      expect(valueB).toBe('')
    })

    it('should handle error values in cycles', () => {
      const engine = HyperFormula.buildFromArray([['=B1+1', '=1/0']], {
        allowCircularReferences: true
      })

      const valueA = engine.getCellValue(adr('A1'))
      const valueB = engine.getCellValue(adr('B1'))
      
      expect(valueB).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
      expect(valueA).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    })

    it('should handle string values in cycles', () => {
      const engine = HyperFormula.buildFromArray([['=B1&"a"', '=A1&"b"']], {
        allowCircularReferences: true
      })

      const valueA = engine.getCellValue(adr('A1'))
      const valueB = engine.getCellValue(adr('B1'))

      expect(valueA).toBe('0babababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababa') // 20 iterations
      expect(valueB).toBe('0bababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababababab') // 19 iterations
    })

    it('should handle very large cycles', () => {
      const engine = HyperFormula.buildFromArray([[
            '=B1+1', '=C1+1', '=D1+1', '=E1+1', '=F1+1', '=G1+1', '=H1+1', '=I1+1', '=J1+1', '=A1+1'
        ]], {
        allowCircularReferences: true
      })

      const valueA = engine.getCellValue(adr('A1'))
      const valueB = engine.getCellValue(adr('B1'))
      const valueC = engine.getCellValue(adr('C1'))
      const valueD = engine.getCellValue(adr('D1'))
      const valueE = engine.getCellValue(adr('E1'))
      const valueF = engine.getCellValue(adr('F1'))
      const valueG = engine.getCellValue(adr('G1'))
      const valueH = engine.getCellValue(adr('H1'))
      const valueI = engine.getCellValue(adr('I1'))
      const valueJ = engine.getCellValue(adr('J1'))

      expect(valueA).toBe(1000)
      expect(valueB).toBe(999)
      expect(valueC).toBe(998)
      expect(valueD).toBe(997)
      expect(valueE).toBe(996)
      expect(valueF).toBe(995)
      expect(valueG).toBe(994)
      expect(valueH).toBe(993)
      expect(valueI).toBe(992)
      expect(valueJ).toBe(991)
    })
  })
})
