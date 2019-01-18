import {benchmark, ExpectedValue} from '../benchmark'

export function sheet() {
  const rows = 10000

  const sheet = []

  let prev = 1

  while (prev <= rows) {
    const rowToPush = [
      `${prev}`,
      `${prev}`,
      `${prev}`,
      `${prev}`,
      `=SUMPROD(A1:B${prev}, C1:D${prev})`,
    ]

    sheet.push(rowToPush)
    ++prev
  }

  return sheet
}

export function expectedValues(): ExpectedValue[] {
  return [
    {address: `E2000`, value: 5337334000},
  ]
}