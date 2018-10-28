import {benchmark} from "./benchmark";

const rows = 100000

const X = [
  ["0.5", "0.1", "0.4"],
  ["0.2", "0.7", "0.1"],
  ["0.3", "0.3", "0.4"]
]

let sheet = []
sheet.push(['0', '1', '0', '0'])

let prev = 1

while (prev < rows) {
  const rowToPush = [
    `${prev}`,
    `=B${prev}*$E$2 + C${prev}*$E$3 + D${prev}*$E$4`,
    `=B${prev}*$F$2 + C${prev}*$F$3 + D${prev}*$F$4`,
    `=B${prev}*$G$2 + C${prev}*$G$3 + D${prev}*$G$4`
  ]
  if (prev <= X.length) {
    rowToPush.concat(X[prev - 1])
  }

  sheet.push(rowToPush)
  ++prev
}

benchmark(sheet)
