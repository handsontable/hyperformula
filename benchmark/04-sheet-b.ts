import {benchmark} from "./benchmark";

const rows = 1000

let sheet = []
sheet.push(['=1*E$1', '=SUM($A$1:A1)', '=A1', `=SUM(B1:B${rows})`, '5'])

let prev = 1

while (prev < rows) {
  const rowToPush = [
    `=${prev+1}*E$1`,
    `=SUM($A$1:A${prev+1})`,
    `=A${prev+1}+C${prev}`,
  ]

  sheet.push(rowToPush)
  ++prev
}

benchmark(sheet, { millisecondsPerThousandRows: 1000, numberOfRuns: 3 })
