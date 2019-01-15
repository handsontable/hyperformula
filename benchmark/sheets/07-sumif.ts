import {benchmark, ExpectedValue} from '../benchmark'

export function sheet() {
  const rows = 30000
  const differentValues = 5

  const sheet = []

  let prev = 1

  while (prev <= rows) {
    const rowToPush = [
      (prev % differentValues).toString(),
      '42',
      `=SUMIF(A1:A${prev}, "=0", B1:B${prev})`,
    ]

    sheet.push(rowToPush)
    ++prev
  }

  return sheet
}

export function expectedValues(sheet: string[][]): ExpectedValue[] {
  return [
    {address: `C${sheet.length}`, value: Math.floor(sheet.length / 5) * 42},
  ]
}
