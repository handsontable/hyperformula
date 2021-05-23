import {ErrorType, HyperFormula} from '../../src'
import {adr, detailedError, expectEngineToBeTheSameAs} from '../testUtils'
import {ErrorMessage} from '../../src/error-message'

describe('Add rows', () => {
  it('should be possible to add row above matrix', () => {
    const engine = HyperFormula.buildFromArray([
      ['=-C1:D3'],
      [],
      [],
      ['foo']
    ], {useArrayArithmetic: true})

    engine.addRows(0, [0, 1])

    const expected = HyperFormula.buildFromArray([
      [],
      ['=-C2:D4'],
      [],
      [],
      ['foo']
    ], {useArrayArithmetic: true})

    expectEngineToBeTheSameAs(engine, expected)
  })
  
  it('adding row across array should not change array', () => {
    const engine = HyperFormula.buildFromArray([
      [], [], [],
      ['=-A1:B3'],
      [], [],
      ['foo']
    ], { useArrayArithmetic: true })

    engine.addRows(0, [4, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [], [], [],
      ['=-A1:B3'],
      [], [], [],
      ['foo']
    ], { useArrayArithmetic: true }))
  })

  it('adding row should expand dependent array', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
      ['=TRANSPOSE(A1:B2)']
    ], { useArrayArithmetic: true })

    engine.addRows(0, [1, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [1, 2],
      [],
      [3, 4],
      ['=TRANSPOSE(A1:B3)']
    ], { useArrayArithmetic: true }))
  })

  it('undo add row with dependent array', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
      ['=TRANSPOSE(A1:B2)']
    ], { useArrayArithmetic: true })

    engine.addRows(0, [1, 1])
    engine.undo()

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
      ['=TRANSPOSE(A1:B2)']
    ], { useArrayArithmetic: true }))
  })
})

describe('Remove rows', () => {
  it('should be possible to remove row above matrix', () => {
    const engine = HyperFormula.buildFromArray([
      [],
      ['=-C2:D4'],
      [],
      [],
      ['foo']
    ], {useArrayArithmetic: true})

    engine.removeRows(0, [0, 1])

    const expected = HyperFormula.buildFromArray([
      ['=-C1:D3'],
      [],
      [],
      ['foo']
    ], {useArrayArithmetic: true})

    expectEngineToBeTheSameAs(engine, expected)
  })

  it('removing row across array should not change array', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2], [3, 4], [5, 6],
      ['=-A1:B3'],
      [], [], [],
      ['foo']
    ], { useArrayArithmetic: true })

    engine.removeRows(0, [4, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [1, 2], [3, 4], [5, 6],
      ['=-A1:B3'],
      [], [],
      ['foo']
    ], { useArrayArithmetic: true }))
  })

  it('removing row should shrink dependent array', () => {
    const engine = HyperFormula.buildFromArray([
      [1, 2],
      [],
      [3, 4],
      ['=TRANSPOSE(A1:B3)']
    ], { useArrayArithmetic: true })

    engine.removeRows(0, [1, 1])

    expectEngineToBeTheSameAs(engine, HyperFormula.buildFromArray([
      [1, 2],
      [3, 4],
      ['=TRANSPOSE(A1:B2)']
    ], { useArrayArithmetic: true }))
  })

  it('it should be REF if no space after removing row', () => {
    const engine = HyperFormula.buildFromArray([
      ['=-B3:B4'],
      [],
      [1, 1],
      [null, 2],
    ], { useArrayArithmetic: true })

    engine.removeRows(0, [1, 1])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.REF, ErrorMessage.NoSpaceForArrayResult))
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('B2'))).toEqual(1)
    expect(engine.getCellValue(adr('B3'))).toEqual(2)

    const expected = HyperFormula.buildFromArray([
      ['=-B2:B3'],
      [1, 1],
      [null, 2]
    ], { useArrayArithmetic: true })
    expectEngineToBeTheSameAs(engine, expected)
  })

  it('it should be REF, not CYCLE, after removing rows', () => {
    const engine = HyperFormula.buildFromArray([
      ['=-A3:A4'],
      [],
      [1],
      [2]
    ], { useArrayArithmetic: true })

    engine.removeRows(0, [1, 1])

    expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.REF, ErrorMessage.NoSpaceForArrayResult))
    expect(engine.getCellValue(adr('A2'))).toEqual(1)
    expect(engine.getCellValue(adr('A3'))).toEqual(2)

    const expected = HyperFormula.buildFromArray([
      ['=-A2:A3'],
      [1],
      [2]
    ], { useArrayArithmetic: true })
    expectEngineToBeTheSameAs(engine, expected)
  })
})

