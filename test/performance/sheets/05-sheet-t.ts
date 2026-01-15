import {ExpectedValue} from '../benchmark'
import {RawCellContent, Sheet} from '../../../src'

/**
 *
 */
export function sheet(rows: number = 10000): Sheet {
  const sheet: Sheet = []

  let prev = 1

  const prettyRandomString = (chars: number) => [...Array(chars)].map(() => (~~(Math.random() * 36)).toString(36)).join('')

  while (prev <= rows) {
    const rowToPush: RawCellContent[] = [
      prettyRandomString(30),
      prettyRandomString(30),
      `=CONCATENATE(A${prev}, B${prev})`,
    ]

    sheet.push(rowToPush)
    ++prev
  }
  return sheet
}

/**
 *
 */
export function expectedValues(sheet: Sheet): ExpectedValue[] {
  return [
    {address: 'C1', value: `${sheet[0][0]}${sheet[0][1]}`},
    {address: 'C1000', value: `${sheet[999][0]}${sheet[999][1]}`},
    {address: 'C10000', value: `${sheet[9999][0]}${sheet[9999][1]}`},
  ]
}
