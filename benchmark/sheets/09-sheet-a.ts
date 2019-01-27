import {benchmark, ExpectedValue} from '../benchmark'

export function sheet() {
  const rows = 10000

  const sheet = []
  sheet.push(['1', '2', '3', '4', '5'])

  let prev = 1

  while (prev < rows) {
    const rowToPush = [
      `${prev + 1}`,
      '3',
      `=A${prev}*A${prev}+5`,
      `=C${prev + 1}*B${prev}-C${prev}`,
      `=A${prev}*A${prev}-10*A${prev}+3*C${prev}+7*2`,
    ]

    sheet.push(rowToPush)
    ++prev
  }
  return sheet
}

export function expectedValues(sheet: string[][]): ExpectedValue[] {
  return [
    { address: 'A10000', value: 10000 },
    { address: 'B10000', value: 3 },
    { address: 'C10000', value: 99980006 },
    { address: 'D10000', value: 199980009 },
    { address: 'E10000', value: 399760052 },
  ]
}
