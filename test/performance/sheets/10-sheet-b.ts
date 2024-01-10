import {ExpectedValue} from '../benchmark'
import {RawCellContent, Sheet} from '../../../src'

export function sheet(rows: number = 5000): Sheet {
  const sheet: Sheet = []
  sheet.push(['1', '2', '3', '0', '0'])

  let prev = 1

  while (prev < rows) {
    const rowToPush: RawCellContent[] = [
      `${prev + 1}`,
      '2',
      '=3*5',
      `=A${prev}+D${prev}`,
      `=SUM($A$1:A${prev})`,
    ]

    sheet.push(rowToPush)
    ++prev
  }
  return sheet
}

export function expectedValues(_sheet: Sheet): ExpectedValue[] {
  return [
    {address: 'A5000', value: 5000},
    {address: 'B5000', value: 2},
    {address: 'C5000', value: 15},
    {address: 'D5000', value: 12497500},
    {address: 'E5000', value: 12497500},
  ]
}
