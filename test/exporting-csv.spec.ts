import {HandsOnEngine} from '../src'

describe('Exporting CSV', () => {
  it('works', () => {
    const str = [
      `Some header,Another header`,
      `Some simple string value,Bar`,
    ].join('\n')

    const engine = HandsOnEngine.buildFromCsv(str)

    expect(engine.exportAsCsv().trim()).toEqual(str)
  })

  it('exports empty cells as empty strings', () => {
    const str = `foo,,bar`

    const engine = HandsOnEngine.buildFromCsv(str)

    expect(engine.exportAsCsv().trim()).toEqual(str)
  })
})
