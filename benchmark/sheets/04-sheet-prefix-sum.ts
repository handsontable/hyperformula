import { ExpectedValue} from '../benchmark'

export function sheet(rows: number = 10000) {
  const sheet = []
  sheet.push(['=1*E$1', '=SUM($A$1:A1)', '=A1', `=SUM(B1:B${rows})`, '5'])

  let prev = 1

  while (prev < rows) {
    const rowToPush = [
      `=${prev + 1}*E$1`,
      `=SUM($A$1:A${prev + 1})`,
      `=A${prev + 1}+C${prev}`,
    ]

    sheet.push(rowToPush)
    ++prev
  }
  return sheet
}

export function expectedValues(sheet: string[][]): ExpectedValue[] {
  return [
    {address: 'A1', value: 5},
    {address: 'B1', value: 5},
    {address: 'C1', value: 5},
    {address: 'A25', value: 125},
    {address: 'B25', value: 1625},
    {address: 'C25', value: 1625},
    {address: 'A1000', value: 5000},
    {address: 'B1000', value: 2502500},
    {address: 'C1000', value: 2502500},
  ]
}
