import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
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
})
