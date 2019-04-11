import {HandsOnEngine} from '../src'
import './testConfig.ts'

describe('Exporting CSV', () => {
  it('works', () => {
    const str = [
      `Some header,Another header`,
      `Some simple string value,Bar`,
    ].join('\n')

    const engine = HandsOnEngine.buildFromCsv(str)

    expect(engine.exportAsCsv('Sheet1').trim()).toEqual(str)
  })

  it('exports empty cells as empty strings', () => {
    const str = `foo,,bar`

    const engine = HandsOnEngine.buildFromCsv(str)

    expect(engine.exportAsCsv('Sheet1').trim()).toEqual(str)
  })

  it('exports formatter errors', () => {
    const str = `=1/0`

    const engine = HandsOnEngine.buildFromCsv(str)

    expect(engine.exportAsCsv('Sheet1').trim()).toEqual('#DIV_BY_ZERO!')
  })
})
