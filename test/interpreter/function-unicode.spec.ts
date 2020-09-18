import {HyperFormula} from '../../src'
import {CellValueType, ErrorType} from '../../src'
import {ErrorMessage} from '../../src/error-message'
import {adr, detailedError} from '../testUtils'

describe('Function UNICODE', () => {
    it('should not work for wrong number of arguments', () => {
        const engine = HyperFormula.buildFromArray([
            ['=UNICODE()'],
            ['=UNICODE("foo", "bar")'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
        expect(engine.getCellValue(adr('A2'))).toEqual(detailedError(ErrorType.NA, ErrorMessage.WrongArgNumber))
    })

    it('should not work for empty strings', () => {
        const engine = HyperFormula.buildFromArray([
            ['=UNICODE("")'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(detailedError(ErrorType.VALUE, ErrorMessage.EmptyString))
    })

    it('should work for single chars', () => {
        const engine = HyperFormula.buildFromArray([
            ['=UNICODE("")'],
            ['=UNICODE("!")'],
            ['=UNICODE("A")'],
            ['=UNICODE("Z")'],
            ['=UNICODE("Ñ")'],
            ['=UNICODE("ÿ")'],
            ['=UNICODE(TRUE())'],
            ['=UNICODE("€")'],
            ['=UNICODE("􏿿")'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(1)
        expect(engine.getCellValue(adr('A2'))).toEqual(33)
        expect(engine.getCellValue(adr('A3'))).toEqual(65)
        expect(engine.getCellValue(adr('A4'))).toEqual(90)
        expect(engine.getCellValue(adr('A5'))).toEqual(209)
        expect(engine.getCellValue(adr('A6'))).toEqual(255)
        expect(engine.getCellValue(adr('A7'))).toEqual(84)
        expect(engine.getCellValue(adr('A8'))).toEqual(8364)
        expect(engine.getCellValue(adr('A9'))).toEqual(1114111)
    })

    it('should return code of first character', () => {
        const engine = HyperFormula.buildFromArray([
            ['=UNICODE("Abar")'],
            ['=UNICODE("Ñbaz")'],
        ])

        expect(engine.getCellValue(adr('A1'))).toEqual(65)
        expect(engine.getCellValue(adr('A2'))).toEqual(209)
    })


    it('should return number', () => {
        const engine = HyperFormula.buildFromArray([
            ['=UNICODE("foo")']
        ])

        expect(engine.getCellValueType(adr('A1'))).toEqual(CellValueType.NUMBER)
    })
})
