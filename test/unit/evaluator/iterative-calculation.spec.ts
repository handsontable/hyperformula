import {HyperFormula} from '../../../src'
import {ErrorType} from '../../../src/Cell'
import {adr, detailedError} from '../testUtils'

/**
 * Iterative Calculation Feature Tests
 *
 * Config Parameters:
 * - iterativeCalculationEnable: boolean (default: false)
 * - iterativeCalculationMaxIterations: number (default: 100)
 * - iterativeCalculationConvergenceThreshold: number (default: 0.001)
 * - iterativeCalculationInitialValue: number (default: 0)
 *
 * Behavior:
 * - Stop condition: change < threshold (strict less than)
 * - When maxIterations reached without convergence: return last computed value
 */

describe('Iterative Calculation', () => {
  describe('Iteration Disabled (Default Behavior)', () => {
    it('should return #CYCLE! error for direct self-reference', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1+1'],
      ])

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.CYCLE))
    })
  })

  describe('Basic Convergence', () => {
    it('should converge simple formula (A1+10)/2 to 10', () => {
      const engine = HyperFormula.buildFromArray([
        ['=(A1+10)/2'],
      ], {iterativeCalculationEnable: true})

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(10, 2)
    })

    it('should converge damped formula A1*0.5+1 to 2', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1*0.5+1'],
      ], {iterativeCalculationEnable: true})

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(2, 2)
    })

    it('should handle immediate convergence when already at solution', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1*1'],  // Any value is a fixed point
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationInitialValue: 5,
      })

      expect(engine.getCellValue(adr('A1'))).toBe(5)
    })

    it('should converge (A1+2)/2 formula starting from 0', () => {
      const engine = HyperFormula.buildFromArray([
        ['=(A1+2)/2'],
      ], {iterativeCalculationEnable: true})

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(2, 2)
    })
  })

  describe('Max Iterations Behavior', () => {
    it('should return 100 for =A1+1 with default maxIterations=100', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1+1'],
      ], {iterativeCalculationEnable: true})

      expect(engine.getCellValue(adr('A1'))).toBe(100)
    })

    it('should return 1 for =A1+1 with maxIterations=1', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1+1'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 1,
      })

      expect(engine.getCellValue(adr('A1'))).toBe(1)
    })

    it('should stop at maxIterations even when not converged', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1*2'],  // Diverging exponentially
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 10,
        iterativeCalculationInitialValue: 1,
      })

      // Starting from 1: 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024
      expect(engine.getCellValue(adr('A1'))).toBe(1024)
    })
  })

  describe('Convergence Threshold Behavior', () => {
    it('should stop when change < threshold (strict less than)', () => {
      // Formula =(A1+2)/2 converges to 2
      // Iter 1: 1 (change=1), Iter 2: 1.5 (change=0.5), Iter 3: 1.75 (change=0.25), Iter 4: 1.875 (change=0.125)
      // With threshold=0.25, should stop at iter 4 (when change=0.125 < 0.25)
      const engine = HyperFormula.buildFromArray([
        ['=(A1+2)/2'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationConvergenceThreshold: 0.25,
      })

      expect(engine.getCellValue(adr('A1'))).toBe(1.875)
    })

    it('should continue when change equals threshold', () => {
      // With threshold=0.125, iter 4 has change=0.125 which equals threshold
      // Should continue to iter 5 (change=0.0625 < 0.125)
      const engine = HyperFormula.buildFromArray([
        ['=(A1+2)/2'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationConvergenceThreshold: 0.125,
      })

      expect(engine.getCellValue(adr('A1'))).toBe(1.9375)
    })

    it('should use very small threshold for more precision', () => {
      const engine = HyperFormula.buildFromArray([
        ['=(A1+2)/2'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationConvergenceThreshold: 1e-6,
      })

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(2, 5)
    })

    it('should handle threshold=0 requiring exact match', () => {
      // A1*1 is already converged (any value is fixed point)
      const engine = HyperFormula.buildFromArray([
        ['=A1*1'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationConvergenceThreshold: 0,
        iterativeCalculationInitialValue: 5,
      })

      expect(engine.getCellValue(adr('A1'))).toBe(5)
    })
  })

  describe('Initial Value Behavior', () => {
    it('should use default initial value of 0', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1+1'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 1,
      })

      // Starting from 0, after 1 iteration: 0+1 = 1
      expect(engine.getCellValue(adr('A1'))).toBe(1)
    })

    it('should use custom initial value of 5', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1+1'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 1,
        iterativeCalculationInitialValue: 5,
      })

      // Starting from 5, after 1 iteration: 5+1 = 6
      expect(engine.getCellValue(adr('A1'))).toBe(6)
    })

    it('should use negative initial value', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1+1'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 1,
        iterativeCalculationInitialValue: -10,
      })

      // Starting from -10, after 1 iteration: -10+1 = -9
      expect(engine.getCellValue(adr('A1'))).toBe(-9)
    })

    it('should affect convergence target with non-zero initial', () => {
      // Formula =(A1+10)/2 converges to 10 regardless of initial value
      const engine = HyperFormula.buildFromArray([
        ['=(A1+10)/2'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationInitialValue: 100,
      })

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(10, 2)
    })
  })

  describe('Oscillation Behavior', () => {
    it('should return 0 for binary oscillation with even maxIterations', () => {
      const engine = HyperFormula.buildFromArray([
        ['=IF(A1=0,1,0)'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 100,
      })

      // Even iterations: 0 -> 1 -> 0 -> 1 -> ... -> 0
      expect(engine.getCellValue(adr('A1'))).toBe(0)
    })

    it('should return 1 for binary oscillation with odd maxIterations', () => {
      const engine = HyperFormula.buildFromArray([
        ['=IF(A1=0,1,0)'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 101,
      })

      // Odd iterations: 0 -> 1 -> 0 -> 1 -> ... -> 1
      expect(engine.getCellValue(adr('A1'))).toBe(1)
    })

    it('should handle numeric oscillation =-A1+1', () => {
      const engine = HyperFormula.buildFromArray([
        ['=-A1+1'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 100,
      })

      // 0 -> 1 -> 0 -> 1 -> ... (even iterations = 0)
      expect(engine.getCellValue(adr('A1'))).toBe(0)
    })

    it('should handle text oscillation', () => {
      const engine = HyperFormula.buildFromArray([
        ['=IF(A1="a","b","a")'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 100,
      })

      // Initial (0) != "a" -> "a" -> "b" -> "a" -> "b" -> ... (even = "b")
      expect(engine.getCellValue(adr('A1'))).toBe('b')
    })
  })

  describe('Multi-Cell Circular Dependencies', () => {
    it('should compute two-cell mutual dependency correctly', () => {
      const engine = HyperFormula.buildFromArray([
        ['=B1+1', '=A1+1'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 10,
      })

      // With cells evaluated in order A1 first, then B1:
      // Iter 1: A1 = 0+1 = 1, B1 = 1+1 = 2
      // Iter 2: A1 = 2+1 = 3, B1 = 3+1 = 4
      // ...
      // After 10 iters: A1 = 19, B1 = 20
      expect(engine.getCellValue(adr('A1'))).toBe(19)
      expect(engine.getCellValue(adr('B1'))).toBe(20)
    })

    it('should compute three-cell chain with feedback', () => {
      const engine = HyperFormula.buildFromArray([
        ['=C1+1', '=A1+1', '=B1+1'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 5,
      })

      // With evaluation order A1, B1, C1 (sorted by column):
      // Iter 0: A1=1, B1=2, C1=3
      // Iter 1: A1=4, B1=5, C1=6
      // ... after 5 iterations: A1=13, B1=14, C1=15
      expect(engine.getCellValue(adr('A1'))).toBe(13)
      expect(engine.getCellValue(adr('B1'))).toBe(14)
      expect(engine.getCellValue(adr('C1'))).toBe(15)
    })

    it('should converge multi-cell system A1=B1/2, B1=A1/2', () => {
      const engine = HyperFormula.buildFromArray([
        ['=B1/2', '=A1/2'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationInitialValue: 8,
        iterativeCalculationConvergenceThreshold: 1e-6,
      })

      // Both should converge to 0
      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0, 5)
      expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0, 5)
    })

    it('should handle multiple independent cycles', () => {
      const engine = HyperFormula.buildFromArray([
        ['=B1+1', '=A1+1', '', '=E1+2', '=D1+2'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 10,
      })

      // Cycle 1: A1 <-> B1 (each adds 1)
      // Cycle 2: D1 <-> E1 (each adds 2)
      expect(engine.getCellValue(adr('A1'))).toBe(19)
      expect(engine.getCellValue(adr('B1'))).toBe(20)
      expect(engine.getCellValue(adr('D1'))).toBe(38)
      expect(engine.getCellValue(adr('E1'))).toBe(40)
    })

    it('should handle cycle with SUM function', () => {
      const engine = HyperFormula.buildFromArray([
        ['=SUM(B1:D1)', '=A1/4', '=A1/3', 0.1],
      ], {
        iterativeCalculationEnable: true,
      })

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(0.24, 2)
      expect(engine.getCellValue(adr('B1'))).toBeCloseTo(0.06, 2)
      expect(engine.getCellValue(adr('C1'))).toBeCloseTo(0.08, 2)
    })
  })

  describe('Mixed Dependencies', () => {
    it('should handle circular and non-circular cells in same sheet', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1+1', '=5+3'],  // A1 is circular, B1 is not
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 10,
      })

      expect(engine.getCellValue(adr('A1'))).toBe(10)
      expect(engine.getCellValue(adr('B1'))).toBe(8)
    })

    it('should handle circular cell depending on constant', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1+B1', '5'],  // A1 = A1 + 5
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 10,
      })

      // Each iteration adds 5: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50
      expect(engine.getCellValue(adr('A1'))).toBe(50)
    })

    it('should handle non-circular cell depending on circular result', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1+1', '=A1*2'],  // B1 depends on circular A1
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 10,
      })

      expect(engine.getCellValue(adr('A1'))).toBe(10)
      expect(engine.getCellValue(adr('B1'))).toBe(20)
    })

    it('should propagate changes to dependent cells after cycle resolution', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1+1', '=A1*2', '=B1+5'],  // A1 is cycle, B1 and C1 depend on it
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 10,
      })

      // A1 resolves to 10, B1 = 10*2 = 20, C1 = 20+5 = 25
      expect(engine.getCellValue(adr('A1'))).toBe(10)
      expect(engine.getCellValue(adr('B1'))).toBe(20)
      expect(engine.getCellValue(adr('C1'))).toBe(25)
    })
  })

  describe('Conditional Circular References', () => {
    it('should not trigger cycle when condition avoids it', () => {
      const engine = HyperFormula.buildFromArray([
        ['=IF(B1>0, A1+1, 5)', '0'],  // B1=0, so no self-reference
      ], {iterativeCalculationEnable: true})

      expect(engine.getCellValue(adr('A1'))).toBe(5)
    })

    it('should trigger cycle when condition causes it', () => {
      const engine = HyperFormula.buildFromArray([
        ['=IF(B1>0, A1+1, 5)', '1'],  // B1=1, so self-reference is active
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 10,
      })

      expect(engine.getCellValue(adr('A1'))).toBe(10)
    })
  })

  describe('Error Handling', () => {
    it('should handle division by zero in loop', () => {
      const engine = HyperFormula.buildFromArray([
        ['=1/(A1-1)'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationInitialValue: 1,
      })

      // Starting from 1: 1/(1-1) = 1/0 = #DIV/0!
      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    })

    it('should propagate error through cycle when error occurs', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1+B1', '=1/0'],  // B1 is #DIV/0!
      ], {iterativeCalculationEnable: true})

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.DIV_BY_ZERO))
    })

    it('should handle #VALUE! inside iterative formula', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1+"text"'],  // Adding number to text
      ], {iterativeCalculationEnable: true})

      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.VALUE))
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large maxIterations', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1+1'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 1000,
      })

      expect(engine.getCellValue(adr('A1'))).toBe(1000)
    })

    it('should handle very small threshold', () => {
      const engine = HyperFormula.buildFromArray([
        ['=(A1+2)/2'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationConvergenceThreshold: 1e-15,
      })

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(2, 10)
    })

    it('should handle formula that converges to negative value', () => {
      const engine = HyperFormula.buildFromArray([
        ['=(A1-10)/2'],  // Converges to -10
      ], {iterativeCalculationEnable: true})

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(-10, 2)
    })

    it('should handle large number growth', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1*2'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 50,
        iterativeCalculationInitialValue: 1,
      })

      expect(engine.getCellValue(adr('A1'))).toBeCloseTo(Math.pow(2, 50), -5) // huge number
    })

    it('should handle self-referencing SUM formula', () => {
      const engine = HyperFormula.buildFromArray([
        ['=SUM(A1, 1)'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 10,
      })

      expect(engine.getCellValue(adr('A1'))).toBe(10)
    })
  })

  describe('Config Parameter Validation', () => {
    describe('iterativeCalculationMaxIterations', () => {
      it('should throw error for negative maxIterations', () => {
        expect(() => {
          HyperFormula.buildFromArray([['=A1+1']], {
            iterativeCalculationEnable: true,
            iterativeCalculationMaxIterations: -1,
          })
        }).toThrow()
      })

      it('should throw error for zero maxIterations', () => {
        expect(() => {
          HyperFormula.buildFromArray([['=A1+1']], {
            iterativeCalculationEnable: true,
            iterativeCalculationMaxIterations: 0,
          })
        }).toThrow()
      })

      it('should throw error for non-integer maxIterations', () => {
        expect(() => {
          HyperFormula.buildFromArray([['=A1+1']], {
            iterativeCalculationEnable: true,
            iterativeCalculationMaxIterations: 10.5,
          })
        }).toThrow()
      })
    })

    describe('iterativeCalculationConvergenceThreshold', () => {
      it('should throw error for negative convergenceThreshold', () => {
        expect(() => {
          HyperFormula.buildFromArray([['=A1+1']], {
            iterativeCalculationEnable: true,
            iterativeCalculationConvergenceThreshold: -0.001,
          })
        }).toThrow()
      })

      it('should accept zero convergenceThreshold', () => {
        expect(() => {
          HyperFormula.buildFromArray([['=A1*1']], {
            iterativeCalculationEnable: true,
            iterativeCalculationConvergenceThreshold: 0,
          })
        }).not.toThrow()
      })
    })

    describe('iterativeCalculationInitialValue', () => {
      it('should accept any numeric initialValue including negative', () => {
        expect(() => {
          HyperFormula.buildFromArray([['=A1+1']], {
            iterativeCalculationEnable: true,
            iterativeCalculationInitialValue: -100,
          })
        }).not.toThrow()
      })

      it('should accept zero initialValue', () => {
        expect(() => {
          HyperFormula.buildFromArray([['=A1+1']], {
            iterativeCalculationEnable: true,
            iterativeCalculationInitialValue: 0,
          })
        }).not.toThrow()
      })

      it('should accept decimal initialValue', () => {
        expect(() => {
          HyperFormula.buildFromArray([['=A1+1']], {
            iterativeCalculationEnable: true,
            iterativeCalculationInitialValue: 3.14159,
          })
        }).not.toThrow()
      })

      it('should accept string initialValue', () => {
        expect(() => {
          HyperFormula.buildFromArray([['=A1']], {
            iterativeCalculationEnable: true,
            iterativeCalculationInitialValue: 'foo',
          })
        }).not.toThrow()
      })

      it('should accept boolean initialValue', () => {
        expect(() => {
          HyperFormula.buildFromArray([['=A1']], {
            iterativeCalculationEnable: true,
            iterativeCalculationInitialValue: true,
          })
        }).not.toThrow()
      })
    })

    describe('iterativeCalculationEnable', () => {
      it('should accept boolean true', () => {
        expect(() => {
          HyperFormula.buildFromArray([['=A1+1']], {
            iterativeCalculationEnable: true,
          })
        }).not.toThrow()
      })

      it('should accept boolean false', () => {
        expect(() => {
          HyperFormula.buildFromArray([['=A1+1']], {
            iterativeCalculationEnable: false,
          })
        }).not.toThrow()
      })

      it('should accept undefined', () => {
        expect(() => {
          HyperFormula.buildFromArray([['=A1+1']], {
            iterativeCalculationEnable: undefined,
          })
        }).not.toThrow()
      })
    })
  })

  describe('Recalculation After Cell Changes', () => {
    it('should recalculate circular reference after dependent cell changes', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1+B1', '1'],
      ], {
        iterativeCalculationEnable: true,
        iterativeCalculationMaxIterations: 10,
      })

      expect(engine.getCellValue(adr('A1'))).toBe(10)  // 10 iterations of adding 1

      engine.setCellContents(adr('B1'), [[2]])

      expect(engine.getCellValue(adr('A1'))).toBe(20)  // 10 iterations of adding 2
    })

    it('should switch between cycle and non-cycle behavior when toggling config', () => {
      const engine = HyperFormula.buildFromArray([
        ['=A1+1'],
      ], {iterativeCalculationEnable: true, iterativeCalculationMaxIterations: 10})

      expect(engine.getCellValue(adr('A1'))).toBe(10)

      engine.updateConfig({iterativeCalculationEnable: false})
      expect(engine.getCellValue(adr('A1'))).toEqualError(detailedError(ErrorType.CYCLE))

      engine.updateConfig({iterativeCalculationEnable: true})
      expect(engine.getCellValue(adr('A1'))).toBe(10)
    })
  })
})
