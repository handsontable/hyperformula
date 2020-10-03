import {CellError, ErrorType} from '../src/Cell'
import {adr} from './testUtils'
import {DetailedCellError} from '../src'

describe('Matchers', () => {
  it('should compare two simple values', () => {
    expect(1).toEqualError(1)
    expect(1).not.toEqualError(2)
  })


  it('should compare two cell errors ignoring addresses', () => {
    expect(
      new CellError(ErrorType.ERROR, '', adr('A1'))
    ).toEqualError(
      new CellError(ErrorType.ERROR, '')
    )

    expect(
      new CellError(ErrorType.ERROR, 'a', adr('A1'))
    ).not.toEqualError(
      new CellError(ErrorType.ERROR, '', adr('A1'))
    )

    expect(
      new CellError(ErrorType.NA, '', adr('A1'))
    ).not.toEqualError(
      new CellError(ErrorType.ERROR, '', adr('A1'))
    )
  })

  it('compare two detailed errors ignoring addresses', () => {
    expect(
      new DetailedCellError(new CellError(ErrorType.ERROR), '')
    ).toEqualError(
      new DetailedCellError(new CellError(ErrorType.ERROR), '', 'A1')
    )

    expect(
      new DetailedCellError(new CellError(ErrorType.ERROR), 'a')
    ).not.toEqualError(
      new DetailedCellError(new CellError(ErrorType.ERROR), '', 'A1')
    )
  })

  it('should compare two ad-hoc objects', () => {
    expect(
      {type: ErrorType.ERROR, message: '', address: adr('A1')}
    ).toEqualError(
      {type: ErrorType.ERROR, message: '', address: undefined}
    )
  })
})
