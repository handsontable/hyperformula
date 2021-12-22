import {HyperFormula} from '../src'
import {CellValueDetailedType} from '../src/Cell'
import {adr} from './testUtils'

describe('serialization', () => {
  it('should not loose sheet information on serialization', () => {
    const [engine1] =HyperFormula.buildFromArray([
      [1, '2', 'foo', true, '\'1', '33$', '12/01/15', '1%', '=FOO(', '#DIV/0!', new Date(1995, 11, 17)]
    ])

    expect(engine1.getCellSerialized(adr('A1'))).toEqual(1)
    expect(engine1.getCellValueFormat(adr('A1'))).toEqual(undefined)
    expect(engine1.getCellValueDetailedType(adr('A1'))).toEqual(CellValueDetailedType.NUMBER_RAW)

    expect(engine1.getCellSerialized(adr('B1'))).toEqual('2')
    expect(engine1.getCellValueFormat(adr('B1'))).toEqual(undefined)
    expect(engine1.getCellValueDetailedType(adr('B1'))).toEqual(CellValueDetailedType.NUMBER_RAW)

    expect(engine1.getCellSerialized(adr('C1'))).toEqual('foo')
    expect(engine1.getCellValueFormat(adr('C1'))).toEqual(undefined)
    expect(engine1.getCellValueDetailedType(adr('C1'))).toEqual(CellValueDetailedType.STRING)

    expect(engine1.getCellSerialized(adr('D1'))).toEqual(true)
    expect(engine1.getCellValueFormat(adr('D1'))).toEqual(undefined)
    expect(engine1.getCellValueDetailedType(adr('D1'))).toEqual(CellValueDetailedType.BOOLEAN)

    expect(engine1.getCellSerialized(adr('E1'))).toEqual('\'1')
    expect(engine1.getCellValueFormat(adr('E1'))).toEqual(undefined)
    expect(engine1.getCellValueDetailedType(adr('E1'))).toEqual(CellValueDetailedType.STRING)

    expect(engine1.getCellSerialized(adr('F1'))).toEqual('33$')
    expect(engine1.getCellValueFormat(adr('F1'))).toEqual('$')
    expect(engine1.getCellValueDetailedType(adr('F1'))).toEqual(CellValueDetailedType.NUMBER_CURRENCY)

    expect(engine1.getCellSerialized(adr('G1'))).toEqual('12/01/15')
    expect(engine1.getCellValueFormat(adr('G1'))).toEqual('DD/MM/YY')
    expect(engine1.getCellValueDetailedType(adr('G1'))).toEqual(CellValueDetailedType.NUMBER_DATE)

    expect(engine1.getCellSerialized(adr('H1'))).toEqual('1%')
    expect(engine1.getCellValueFormat(adr('H1'))).toEqual(undefined)
    expect(engine1.getCellValueDetailedType(adr('H1'))).toEqual(CellValueDetailedType.NUMBER_PERCENT)

    expect(engine1.getCellSerialized(adr('I1'))).toEqual('=FOO(')
    expect(engine1.getCellValueFormat(adr('I1'))).toEqual(undefined)
    expect(engine1.getCellValueDetailedType(adr('I1'))).toEqual(CellValueDetailedType.ERROR)

    expect(engine1.getCellSerialized(adr('J1'))).toEqual('#DIV/0!')
    expect(engine1.getCellValueFormat(adr('J1'))).toEqual(undefined)
    expect(engine1.getCellValueDetailedType(adr('J1'))).toEqual(CellValueDetailedType.ERROR)

    expect(engine1.getCellSerialized(adr('K1'))).toEqual(new Date(1995, 11, 17))
    expect(engine1.getCellValueFormat(adr('K1'))).toEqual('Date()')
    expect(engine1.getCellValueDetailedType(adr('K1'))).toEqual(CellValueDetailedType.NUMBER_DATE)

    // serialize and "send" data to server
    const serialized = engine1.getAllSheetsSerialized()

    // reload data and "restore" the previous state
    const [engine2] =HyperFormula.buildFromSheets(serialized)

    expect(engine2.getCellSerialized(adr('A1'))).toEqual(1)
    expect(engine2.getCellValueFormat(adr('A1'))).toEqual(undefined)
    expect(engine2.getCellValueDetailedType(adr('A1'))).toEqual(CellValueDetailedType.NUMBER_RAW)

    expect(engine2.getCellSerialized(adr('B1'))).toEqual('2')
    expect(engine2.getCellValueFormat(adr('B1'))).toEqual(undefined)
    expect(engine2.getCellValueDetailedType(adr('B1'))).toEqual(CellValueDetailedType.NUMBER_RAW)

    expect(engine2.getCellSerialized(adr('C1'))).toEqual('foo')
    expect(engine2.getCellValueFormat(adr('C1'))).toEqual(undefined)
    expect(engine2.getCellValueDetailedType(adr('C1'))).toEqual(CellValueDetailedType.STRING)

    expect(engine2.getCellSerialized(adr('D1'))).toEqual(true)
    expect(engine2.getCellValueFormat(adr('D1'))).toEqual(undefined)
    expect(engine2.getCellValueDetailedType(adr('D1'))).toEqual(CellValueDetailedType.BOOLEAN)

    expect(engine2.getCellSerialized(adr('E1'))).toEqual('\'1')
    expect(engine2.getCellValueFormat(adr('E1'))).toEqual(undefined)
    expect(engine2.getCellValueDetailedType(adr('E1'))).toEqual(CellValueDetailedType.STRING)

    expect(engine2.getCellSerialized(adr('F1'))).toEqual('33$')
    expect(engine2.getCellValueFormat(adr('F1'))).toEqual('$')
    expect(engine2.getCellValueDetailedType(adr('F1'))).toEqual(CellValueDetailedType.NUMBER_CURRENCY)

    expect(engine2.getCellSerialized(adr('G1'))).toEqual('12/01/15')
    expect(engine2.getCellValueFormat(adr('G1'))).toEqual('DD/MM/YY')
    expect(engine2.getCellValueDetailedType(adr('G1'))).toEqual(CellValueDetailedType.NUMBER_DATE)

    expect(engine1.getCellSerialized(adr('H1'))).toEqual('1%')
    expect(engine1.getCellValueFormat(adr('H1'))).toEqual(undefined)
    expect(engine1.getCellValueDetailedType(adr('H1'))).toEqual(CellValueDetailedType.NUMBER_PERCENT)

    expect(engine1.getCellSerialized(adr('I1'))).toEqual('=FOO(')
    expect(engine1.getCellValueFormat(adr('I1'))).toEqual(undefined)
    expect(engine1.getCellValueDetailedType(adr('I1'))).toEqual(CellValueDetailedType.ERROR)

    expect(engine1.getCellSerialized(adr('J1'))).toEqual('#DIV/0!')
    expect(engine1.getCellValueFormat(adr('J1'))).toEqual(undefined)
    expect(engine1.getCellValueDetailedType(adr('J1'))).toEqual(CellValueDetailedType.ERROR)

    expect(engine1.getCellSerialized(adr('K1'))).toEqual(new Date(1995, 11, 17))
    expect(engine1.getCellValueFormat(adr('K1'))).toEqual('Date()')
    expect(engine1.getCellValueDetailedType(adr('K1'))).toEqual(CellValueDetailedType.NUMBER_DATE)
  })
})
