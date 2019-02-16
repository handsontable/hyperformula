import {benchmark, ExpectedValue} from '../benchmark'

export function sheet() {
  const rows = 2000
  const sheet = []

  let current = 1
  while (current <= rows) {
    const rowToPush = [
      `${current}`,
      `=MEDIAN(A1:A${current})`,
      `${current}`,
      `=MEDIAN(C1:C${current})`,
      `${current}`,
      `=MEDIAN(E1:E${current})`,
    ]

    sheet.push(rowToPush)
    ++current
  }

  return sheet
}

export function expectedValues(sheet: string[][]): ExpectedValue[] {
  return [
    { address: 'A1000', value: 1000 },
    { address: 'B1000', value: 500.5 },
    { address: 'C1000', value: 1000 },
    { address: 'D1000', value: 500.5 },
    { address: 'E1000', value: 1000 },
    { address: 'F1000', value: 500.5 },
  ]
}
