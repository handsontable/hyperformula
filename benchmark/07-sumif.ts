import {benchmark} from './benchmark'

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

benchmark(sheet, [
  { address: `C${rows}`, value: Math.floor(rows / 5) * 42 },
], {
  millisecondsPerThousandRows: 70,
  numberOfRuns: 3,
})
