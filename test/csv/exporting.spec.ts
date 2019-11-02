import {CsvExporter, CsvImporter} from '../../src'
import '../testConfig.ts'
import {adr} from '../testUtils'

describe('Exporting CSV', () => {
  it('works',  () => {
    const str = [
      `Some header,Another header`,
      `Some simple string value,Bar`,
    ].join('\n')

    const exporter = new CsvExporter()
    const engine = new CsvImporter().importSheet(str)

    expect(exporter.exportSheetByName(engine, 'Sheet1').trim()).toEqual(str)
  })

  it('exports empty cells as empty strings',  () => {
    const str = `foo,,bar`

    const exporter = new CsvExporter()
    const engine = new CsvImporter().importSheet(str)

    expect(exporter.exportSheetByName(engine, 'Sheet1').trim()).toEqual(str)
  })

  it('exports formatter errors',  () => {
    const str = `=1/0`

    const exporter = new CsvExporter()
    const engine = new CsvImporter().importSheet(str)

    expect(exporter.exportSheetByName(engine, 'Sheet1').trim()).toEqual('#DIV_BY_ZERO!')
  })
})
