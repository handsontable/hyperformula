import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import {adr} from './testUtils'
import {simpleCellAddress} from '../src/Cell'

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
      const start = simpleCellAddress(0, 0, 0)
      const range = AbsoluteCellRange.spanFrom(start, 1, 1)

      expect(start).not.toBe(range.start)
      expect(start).not.toBe(range.start)
    })

    it('ends should be copied whe using constructor', () => {
      const start = simpleCellAddress(0, 0, 0)
      const end = simpleCellAddress(0, 1, 1)

      const range = new AbsoluteCellRange(start, end)

      expect(start).not.toBe(range.start)
      expect(end).not.toBe(range.end)
    })
  })
})
