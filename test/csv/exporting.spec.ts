import {HandsOnEngine} from '../../src'
import {Exporter, Importer} from '../../src/csv'
import '../testConfig.ts'

describe('Exporting CSV', () => {
  it('works', async () => {
    const str = [
      `Some header,Another header`,
      `Some simple string value,Bar`,
    ].join('\n')

    const exporter = new Exporter()
    const engine = new Importer().importSheet(str)

    expect(exporter.exportSheetByName(engine, 'Sheet1').trim()).toEqual(str)
  })

  it('exports empty cells as empty strings', async () => {
    const str = `foo,,bar`

    const exporter = new Exporter()
    const engine = new Importer().importSheet(str)

    expect(exporter.exportSheetByName(engine, 'Sheet1').trim()).toEqual(str)
  })

  it('exports formatter errors', async () => {
    const str = `=1/0`

    const exporter = new Exporter()
    const engine = new Importer().importSheet(str)

    expect(exporter.exportSheetByName(engine, 'Sheet1').trim()).toEqual('#DIV_BY_ZERO!')
  })
})
