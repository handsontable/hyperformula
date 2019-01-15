import {benchmark, ExpectedValue} from './benchmark'

export function sheet() {
  const rows = 10000

  const sheet = []

  let prev = 1

  const prettyRandomString = (chars: number) => [...Array(chars)].map((i) => (~~(Math.random() * 36)).toString(36)).join('')

  while (prev <= rows) {
    const rowToPush = [
      prettyRandomString(30),
      prettyRandomString(30),
      `=CONCATENATE(A${prev}, B${prev})`,
    ]

    sheet.push(rowToPush)
    ++prev
  }
  return sheet
}

const sh = sheet()
const expectedValues: ExpectedValue[] = [
  { address: 'C1', value: `${sh[0][0]}${sh[0][1]}` },
  { address: 'C1000', value: `${sh[999][0]}${sh[999][1]}` },
  { address: 'C10000', value: `${sh[9999][0]}${sh[9999][1]}` },
]

benchmark(sh, expectedValues, { millisecondsPerThousandRows: 25, numberOfRuns: 3 })
