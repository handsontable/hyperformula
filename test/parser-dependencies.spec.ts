import {absoluteCellAddress, simpleCellAddress} from 'src/Cell'
import {ParserWithCaching} from 'src/parser/ParserWithCaching'

describe('Parsing collecting dependencies', () => {
  it('works for CELL_REFERENCE with relative dependency', () => {
    const parser = new ParserWithCaching('parser')

    const dependencies = parser.parse('=B2', absoluteCellAddress(1, 1)).dependencies

    expect(dependencies).toEqual([
      simpleCellAddress(1, 1),
    ])
  })

  it('works with absolute dependencies', () => {
    const parser = new ParserWithCaching('parser')

    const dependencies = parser.parse('=$B$2', absoluteCellAddress(1, 1)).dependencies

    expect(dependencies.length).toEqual(1)
    expect(dependencies[0]).toMatchObject(simpleCellAddress(1, 1))
  })

  it('works for CELL_RANGE', () => {
    const parser = new ParserWithCaching('parser')

    const dependencies = parser.parse('=B2:C4', absoluteCellAddress(0, 0)).dependencies

    expect(dependencies).toEqual([
      [simpleCellAddress(1, 1), simpleCellAddress(2, 3)],
    ])
  })

  it('goes inside unary minus', () => {
    const parser = new ParserWithCaching('parser')

    const dependencies = parser.parse('=-B2', absoluteCellAddress(0, 0)).dependencies

    expect(dependencies).toEqual([
      simpleCellAddress(1, 1),
    ])
  })

  it('goes inside plus operator', () => {
    const parser = new ParserWithCaching('parser')

    const dependencies = parser.parse('=B2+C3', absoluteCellAddress(0, 0)).dependencies

    expect(dependencies).toEqual([
      simpleCellAddress(1, 1),
      simpleCellAddress(2, 2),
    ])
  })

  it('goes inside function call arguments', () => {
    const parser = new ParserWithCaching('parser')

    const dependencies = parser.parse('=SUM(B2; C3)', absoluteCellAddress(0, 0)).dependencies

    expect(dependencies).toEqual([
      simpleCellAddress(1, 1),
      simpleCellAddress(2, 2),
    ])
  })

  it('OFFSET call is correctly found as dependency', () => {
    const parser = new ParserWithCaching('parser')

    const dependencies = parser.parse('=OFFSET(D4; 0; 0)', absoluteCellAddress(1, 1)).dependencies
    expect(dependencies).toEqual([
      simpleCellAddress(3, 3),
    ])
  })

  it('COLUMNS arguments are not dependencies', () => {
    const parser = new ParserWithCaching('parser')

    const dependencies = parser.parse('=COLUMNS(A1:B3)', absoluteCellAddress(1, 1)).dependencies
    expect(dependencies).toEqual([])
  })
})
