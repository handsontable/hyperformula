import {CellValueChange, ChangeExporter, ContentChanges} from '../src/ContentChanges'
import {adr} from './testUtils'
import {SimpleRangeValue} from '../src/interpreter/SimpleRangeValue'

class IdentityChangeExporter implements ChangeExporter<CellValueChange>{
  exportChange(change: CellValueChange): CellValueChange {
    return change
  }
}

describe('ContentChanges', () => {
  const exporter = new IdentityChangeExporter()

  it('should be empty', () => {
    const contentChanges = ContentChanges.empty()

    expect(contentChanges.isEmpty()).toEqual(true)
  })

  it('should export simple value change', () => {
    const contentChanges = ContentChanges.empty()

    contentChanges.addChange(1, adr('A1'))

    const exportedChanges = contentChanges.exportChanges(exporter)

    expect(contentChanges.isEmpty()).toEqual(false)
    expect(exportedChanges.length).toEqual(1)
    expect(exportedChanges).toContainEqual({ sheet: 0, col: 0, row: 0, value: 1})
  })

  it('should export SimpleRangeValue change', () => {
    const contentChanges = ContentChanges.empty()

    contentChanges.addChange(SimpleRangeValue.onlyValues([['foo', 'bar']]), adr('A1'))

    const exportedChanges = contentChanges.exportChanges(exporter)

    expect(exportedChanges.length).toEqual(1)
    expect(exportedChanges).toContainEqual({ sheet: 0, col: 0, row: 0, value: SimpleRangeValue.onlyValues([['foo', 'bar']])})
  })

  it('should add all changes', () => {
    const contentChanges = ContentChanges.empty()
    contentChanges.addChange(1, adr('A1'))

    const otherChanges = ContentChanges.empty()
    otherChanges.addChange(2, adr('A2'))
    contentChanges.addAll(otherChanges)

    const exportedChanges = contentChanges.exportChanges(exporter)
    expect(exportedChanges.length).toEqual(2)
    expect(exportedChanges).toContainEqual({ sheet: 0, col: 0, row: 0, value: 1})
    expect(exportedChanges).toContainEqual({ sheet: 0, col: 0, row: 1, value: 2})
  })
})
