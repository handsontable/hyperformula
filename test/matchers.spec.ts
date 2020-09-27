import {DetailedCellError} from '../src'
import {CellError, ErrorType} from '../src/Cell'
import {adr} from './testUtils'

describe('Matchers', () => {
  it('two values', () => {
    expect(1).toEqualError(1)
    expect( () =>
      expect(1).toEqualError(2)
    ).toThrow()
  })


  it('two cell errors', () => {
    expect(
      new CellError(ErrorType.ERROR, '', adr('A1'))
    ).toEqualError(
      new CellError(ErrorType.ERROR, '')
    )

    expect( () => expect(
      new CellError(ErrorType.ERROR, 'a', adr('A1'))
    ).toEqualError(
      new CellError(ErrorType.ERROR, '', adr('A1'))
    )).toThrow()

    expect( () => expect(
      new CellError(ErrorType.NA, '', adr('A1'))
    ).toEqualError(
      new CellError(ErrorType.ERROR, '', adr('A1'))
    )).toThrow()
  })

  it('two detailed errors', () => {
    expect(
      new DetailedCellError(new CellError(ErrorType.ERROR), '')
    ).toEqualError(
      new DetailedCellError(new CellError(ErrorType.ERROR), '', 'A1')
    )

    expect( () =>
      expect(
        new DetailedCellError(new CellError(ErrorType.ERROR), 'a')
      ).toEqualError(
        new DetailedCellError(new CellError(ErrorType.ERROR), '', 'A1')
      )
    ).toThrow()
  })

  it('two ad-hoc objects', () => {
    expect(() => expect(
      {type: ErrorType.ERROR, message: '', address: adr('A1')}
    ).toEqualError(
      {type: ErrorType.ERROR, message: '', address: undefined}
    )).toThrow()

  })
})
