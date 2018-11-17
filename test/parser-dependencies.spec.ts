import {absoluteCellAddress, simpleCellAddress} from '../src/Cell'
import {ParserWithCaching} from '../src/parser/ParserWithCaching'

describe('Parsing collecting dependencies', () => {
  it('works for CELL_REFERENCE', () => {
    const parser = new ParserWithCaching('parser')

    const dependencies = parser.parse('=B2', absoluteCellAddress(0, 0)).dependencies

    expect(dependencies).toEqual([
      simpleCellAddress(1, 1),
    ])
  })

  it('works for CELL_RANGE', () => {
    const parser = new ParserWithCaching('parser')

    const dependencies = parser.parse('=B2:C4', absoluteCellAddress(0, 0)).dependencies

    expect(dependencies).toEqual([
      [simpleCellAddress(1, 1), simpleCellAddress(2, 3)]
    ])
  })
})
