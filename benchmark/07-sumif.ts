import {benchmark} from './benchmark'

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

const sh = sheet()
const expectedValues = [
  { address: `C${sh.length}`, value: Math.floor(sh.length / 5) * 42 },
]

benchmark(sh, expectedValues, { millisecondsPerThousandRows: 70, numberOfRuns: 3})
