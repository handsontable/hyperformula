import {Config, HyperFormula, ExportedCellChange} from '../src'
// import {simpleCellAddress} from '../../src/Cell'
// import {AbsoluteCellRange} from '../../src/AbsoluteCellRange'
// import {ColumnIndex} from '../../src/ColumnSearch/ColumnIndex'
// import {MatrixVertex} from '../../src/DependencyGraph'
// import {InvalidArgumentsError} from '../../src'
// import {CellAddress} from '../../src/parser'
import './testConfig'
import {
  expectEngineToBeTheSameAs,
} from './testUtils'

describe('UndoRedo - removing row', () => {
  it('works for empty row', () => {
    const sheet = [
      ['1'],
      [null], // remove
      ['3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeRows(0, [1, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works', () => {
    const sheet = [
      ['1'],
      ['2'], // remove
      ['3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeRows(0, [1, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })

  it('works with formula in removed row', () => {
    const sheet = [
      ['1'],
      ['=SUM(A1)'], // remove
      ['3'],
    ]
    const engine = HyperFormula.buildFromArray(sheet)
    engine.removeRows(0, [1, 1])

    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray(sheet))
  })
})
