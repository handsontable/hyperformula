import {benchmark, ExpectedValue} from '../benchmark'

export function sheet() {
  const rows = 10000

  const sheet = []
  sheet.push(['1', '2', '3', '4', '5'])

  let prev = 1

  while (prev < rows) {
    let rowToPush = [
      `${prev+1}`,
      `2`,
      `3`,
      `=4*12`,
      `=A${prev}-B${prev}*B${prev}+B${prev}*A${prev}/B${prev}+B${prev}*B${prev}`
    ]

    sheet.push(rowToPush)
    ++prev
  }
  return sheet
}

export function expectedValues(sheet: string[][]): ExpectedValue[] {
  return [
    { address: 'A10000', value: 10000 },
    { address: 'B10000', value: 2 },
    { address: 'C10000', value: 3 },
    { address: 'D10000', value: 48 },
    { address: 'E10000', value: 9999 - 2*2 + 2*9999/2 + 2*2 },
  ]
}

