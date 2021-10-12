import {DetailedCellError} from '../src'
import {ArraySize} from '../src/ArraySize'
import {CellError, ErrorType} from '../src/Cell'
import {FormulaVertex} from '../src/DependencyGraph/FormulaCellVertex'
import {buildNumberAst} from '../src/parser/Ast'
import {adr} from './testUtils'

describe('Matchers', () => {
  it('should compare two simple values', () => {
    expect(1).toEqualError(1)
    expect(1).not.toEqualError(2)
  })

  it('should compare two cell errors ignoring vertices', () => {
    function dummyFormulaVertex(): FormulaVertex {
      return FormulaVertex.fromAst(buildNumberAst(1), adr('A1'), ArraySize.scalar(), 0)
    }

    expect(
      new CellError(ErrorType.ERROR, '', dummyFormulaVertex())
    ).toEqualError(
      new CellError(ErrorType.ERROR, '')
    )

    expect(
      new CellError(ErrorType.ERROR, 'a', dummyFormulaVertex())
    ).not.toEqualError(
      new CellError(ErrorType.ERROR, '', dummyFormulaVertex())
    )

    expect(
      new CellError(ErrorType.NA, '', dummyFormulaVertex())
    ).not.toEqualError(
      new CellError(ErrorType.ERROR, '', dummyFormulaVertex())
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

  it('should compare two ad-hoc objects ignoring addresses', () => {
    expect(
      {type: ErrorType.ERROR, message: '', address: adr('A1')}
    ).toEqualError(
      {type: ErrorType.ERROR, message: '', address: undefined}
    )
  })
})
