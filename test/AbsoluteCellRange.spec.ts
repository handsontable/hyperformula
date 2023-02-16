import {AbsoluteCellRange, AbsoluteColumnRange, AbsoluteRowRange} from '../src/AbsoluteCellRange'
import {adr} from './testUtils'

describe('AbsoluteCellRange', () => {
  describe('#addressInRange', () => {
    it('true in simplest case', () => {
      const range = AbsoluteCellRange.fromCoordinates(0, 0, 0, 0, 0)

      expect(range.addressInRange(adr('A1')))
    })

    it('false if different sheets', () => {
      const range = AbsoluteCellRange.fromCoordinates(1, 0, 0, 0, 0)

      expect(range.addressInRange(adr('A1')))
    })
  })

  describe('construct', () => {
    it('start should be copied when using static method', () => {
      const start = adr('A1')
      const range = AbsoluteCellRange.spanFrom(start, 1, 1)

      expect(start).not.toBe(range.start)
    })

    it('ends should be copied whe using constructor', () => {
      const start = adr('A1')
      const end = adr('B2')

      const range = new AbsoluteCellRange(start, end)

      expect(start).not.toBe(range.start)
      expect(end).not.toBe(range.end)
    })

    describe('fromSimpleCellAddresses()', () => {
      it('constructs a AbsoluteCellRange when all the coordinates are finite', () => {
        const start = { sheet: 0, row: 42, col: 42 }
        const end = { sheet: 0, row: 666, col: 666 }
        const range = AbsoluteCellRange.fromSimpleCellAddresses(start, end)

        expect(range).toBeInstanceOf(AbsoluteCellRange)
        expect(range).not.toBeInstanceOf(AbsoluteColumnRange)
        expect(range).not.toBeInstanceOf(AbsoluteRowRange)
      })

      it('constructs a AbsoluteColumnRange when called with end.row = Infinity', () => {
        const start = { sheet: 0, row: 0, col: 42 }
        const end = { sheet: 0, row: Infinity, col: 43 }
        const range = AbsoluteCellRange.fromSimpleCellAddresses(start, end)

        expect(range).toBeInstanceOf(AbsoluteColumnRange)
      })
    })
  })
})
