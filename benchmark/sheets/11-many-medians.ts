import {benchmark, ExpectedValue} from '../benchmark'

export function sheet() {
  const rows = 1000
  const sheet = []

  let current = 1
  while (current <= rows) {
    const rowToPush = [
      `${current}`,
      `=MEDIAN(A${current}:A${rows})`,
      `${current}`,
      `=MEDIAN(C${current}:C${rows})`,
      `${current}`,
      `=MEDIAN(E${current}:E${rows})`,
    ]

    sheet.push(rowToPush)
    ++current
  }

  return sheet
}

export function expectedValues(sheet: string[][]): ExpectedValue[] {
  return [
    // { address: 'A10000', value: 10000 },
    // { address: 'B10000', value: 3 },
    // { address: 'C10000', value: 99980001 },
  ]
}
