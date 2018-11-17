import {benchmark} from './benchmark'

const rows = 10000

const sheet = []

let prev = 0

const prettyRandomString = (chars: number) => [...Array(chars)].map((i) => (~~(Math.random() * 36)).toString(36)).join('')

while (prev < rows) {
  const rowToPush = [
    prettyRandomString(30),
    prettyRandomString(30),
    `=CONCATENATE(A${prev}, B${prev})`,
  ]

  sheet.push(rowToPush)
  ++prev
}

benchmark(sheet, { millisecondsPerThousandRows: 25, numberOfRuns: 3 })
