import {benchmark, ExpectedValue} from './benchmark'

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

const expectedValues: ExpectedValue[] = [
  { address: 'C1', value: `${sheet[0][0]}${sheet[0][1]}` },
  { address: 'C1000', value: `${sheet[999][0]}${sheet[999][1]}` },
  { address: 'C10000', value: `${sheet[9999][0]}${sheet[9999][1]}` },
]

benchmark(sheet, expectedValues, { millisecondsPerThousandRows: 25, numberOfRuns: 3 })
