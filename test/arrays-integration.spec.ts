import {HyperFormula} from '../src'
import {adr} from './testUtils'

describe('integration test', () => {
  it('should work', () => {
    const [engine] = HyperFormula.buildFromSheets({
      'Output': [['=INDEX(LookupRange,MATCH(1,(Lookup!A1:A8<=Inputs!A1)*(Lookup!B1:B8>=Inputs!A1)*(Lookup!C1:C8=Inputs!B1), 0), 4)']],
      'Inputs': [[23, 'B']],
      'Lookup': [
        [11, 15, 'A', 66],
        [11, 15, 'B', 77],
        [16, 20, 'A', 88],
        [16, 20, 'B', 99],
        [21, 25, 'A', 110],
        [21, 25, 'B', 121],
        [26, 30, 'A', 132],
        [26, 30, 'B', 143],
      ]
    }, {useArrayArithmetic: true}) //flag that enables ArrayFormula() everywhere

    engine.addNamedExpression('LookupRange', '=Lookup!$A$1:Lookup!$D$8')

    expect(engine.getCellValue(adr('A1'))).toEqual(121)

    engine.setCellContents(adr('B1', engine.getSheetId('Inputs')), 'A')

    expect(engine.getCellValue(adr('A1'))).toEqual(110)
  })
})
