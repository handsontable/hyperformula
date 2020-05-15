import { HyperFormula } from '../../src'
import { adr } from '../testUtils'

describe('Function VERSION', () => {
  it('AGPL license key', () => {
    const engine = HyperFormula.buildFromArray([
      ['=VERSION()'],
    ], {
      licenseKey: 'agpl-v3',
    })

    expect(engine.getCellValue(adr('A1'))).toEqual(`HyperFormula v${HyperFormula.version}, 1`)
  })

  it('non-commercial license key', () => {
    const engine = HyperFormula.buildFromArray([
      ['=VERSION()'],
    ], {
      licenseKey: 'non-commercial-and-evaluation',
    })

    expect(engine.getCellValue(adr('A1'))).toEqual(`HyperFormula v${HyperFormula.version}, 2`)
  })

  it('missing license key', () => {
    const engine = HyperFormula.buildFromArray([
      ['=VERSION()'],
    ], {
      licenseKey: '',
    })

    expect(engine.getCellValue(adr('A1'))).toEqual(`HyperFormula v${HyperFormula.version}, 3`)
  })

  it('invalid license key', () => {
    const engine = HyperFormula.buildFromArray([
      ['=VERSION()'],
    ], {
      licenseKey: '11111-11111-11111-11111-11111',
    })

    expect(engine.getCellValue(adr('A1'))).toEqual(`HyperFormula v${HyperFormula.version}, 4`)
  })

  xit('expired license key', () => {
    const engine = HyperFormula.buildFromArray([
      ['=VERSION()'],
    ], {
      licenseKey: '???',
    })

    expect(engine.getCellValue(adr('A1'))).toEqual(`HyperFormula v${HyperFormula.version}, 5`)
  })

  it('correct license key', () => {
    const engine = HyperFormula.buildFromArray([
      ['=VERSION()'],
    ], {
      licenseKey: 'internal-use-in-handsontable',
    })

    expect(engine.getCellValue(adr('A1'))).toEqual(`HyperFormula v${HyperFormula.version}, table`)
  })
})
