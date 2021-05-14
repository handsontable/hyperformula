import {simpleCellAddress} from '../src/Cell'
import {CellValueChange, ChangeExporter, ContentChanges} from '../src/ContentChanges'
import {SimpleRangeValue} from '../src/interpreter/SimpleRangeValue'
import {adr} from './testUtils'

class IdentityChangeExporter implements ChangeExporter<CellValueChange>{
  exportChange(change: CellValueChange): CellValueChange {
    return change
  }
}

class SpreadRangeExporter implements ChangeExporter<CellValueChange>{
  exportChange(change: CellValueChange): CellValueChange | CellValueChange[] {
    const value = change.value
    const address = simpleCellAddress(change.sheet, change.col, change.row)
    if (value instanceof SimpleRangeValue) {
      return Array.from(value.entriesFromTopLeftCorner(address)).map(([v, a]) => {
        return { sheet: a.sheet, col: a.col, row: a.row, value: v }
      })
    } else {
      return change
    }
  }
}

describe('ContentChanges', () => {
  const identityChangeExporter = new IdentityChangeExporter()

  it('should be empty', () => {
    const contentChanges = ContentChanges.empty()

    expect(contentChanges.isEmpty()).toEqual(true)
  })

  it('should export simple value change', () => {
    const contentChanges = ContentChanges.empty()

    contentChanges.addChange(1, adr('A1'))

    const exportedChanges = contentChanges.exportChanges(identityChangeExporter)

    expect(contentChanges.isEmpty()).toEqual(false)
    expect(exportedChanges.length).toEqual(1)
    expect(exportedChanges).toContainEqual({ sheet: 0, col: 0, row: 0, value: 1})
  })

  it('should export SimpleRangeValue change', () => {
    const contentChanges = ContentChanges.empty()

    contentChanges.addChange(SimpleRangeValue.onlyValues([['foo', 'bar']]), adr('A1'))

    const exportedChanges = contentChanges.exportChanges(identityChangeExporter)

    expect(exportedChanges.length).toEqual(1)
    expect(exportedChanges).toContainEqual({ sheet: 0, col: 0, row: 0, value: SimpleRangeValue.onlyValues([['foo', 'bar']])})
  })

  it('should add all changes', () => {
    const contentChanges = ContentChanges.empty()
    contentChanges.addChange(1, adr('A1'))

    const otherChanges = ContentChanges.empty()
    otherChanges.addChange(2, adr('A2'))
    contentChanges.addAll(otherChanges)

    const exportedChanges = contentChanges.exportChanges(identityChangeExporter)
    expect(exportedChanges.length).toEqual(2)
    expect(exportedChanges).toContainEqual({ sheet: 0, col: 0, row: 0, value: 1})
    expect(exportedChanges).toContainEqual({ sheet: 0, col: 0, row: 1, value: 2})
  })

  it('should handle array change', () => {
    const contentChanges = ContentChanges.empty()
    contentChanges.addChange(SimpleRangeValue.onlyValues([[1, 2], ['foo', 'bar']]), adr('A1'))

    const exportedChanges = contentChanges.exportChanges(new SpreadRangeExporter())

    expect(exportedChanges.length).toEqual(4)
    expect(exportedChanges).toContainEqual({ sheet: 0, col: 0, row: 0, value: 1})
    expect(exportedChanges).toContainEqual({ sheet: 0, col: 1, row: 0, value: 2})
    expect(exportedChanges).toContainEqual({ sheet: 0, col: 0, row: 1, value: 'foo'})
    expect(exportedChanges).toContainEqual({ sheet: 0, col: 1, row: 1, value: 'bar'})
  })
})
