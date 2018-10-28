import {benchmark} from "./benchmark";

const rows = 100000

const X = [
  [0.5, 0.1, 0.4],
  [0.2, 0.7, 0.1],
  [0.3, 0.3, 0.4]
]

let sheet = []
sheet.push(['0', '1', '0', '0'])

let prev = 1

while (prev < rows) {
  sheet.push([
    `${prev}`,
    `=B${prev}*${X[0][0]} + C${prev}*${X[1][0]} + D${prev}*${X[2][0]}`,
    `=B${prev}*${X[0][1]} + C${prev}*${X[1][1]} + D${prev}*${X[2][1]}`,
    `=B${prev}*${X[0][2]} + C${prev}*${X[1][2]} + D${prev}*${X[2][2]}`
  ])
  ++prev
}

benchmark(sheet)
