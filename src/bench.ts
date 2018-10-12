import {HandsOnEngine} from "../src";
import {performance} from "perf_hooks";

const rows = 10000
const millisecondsPerThousandRows = 150
const numberOfRuns = 3

let sheet = []
sheet.push(['100', '200', '300', '400', '500'])

let prev = 1
while (prev < rows) {
  sheet.push([
    `=D${prev}*E${prev} - D${prev}*(B${prev} + C${prev}) + C${prev}*(D${prev} - A${prev}) - C${prev} * C${prev} + A${prev}`, // always 100
    `=D${prev}*E${prev} - D${prev}*(B${prev} + C${prev}) + C${prev}*(D${prev} - A${prev}) - C${prev} * C${prev} + B${prev}`, // always 200
    `=D${prev}*E${prev} - D${prev}*(B${prev} + C${prev}) + C${prev}*(D${prev} - A${prev}) - C${prev} * C${prev} + C${prev}`, // always 300
    `=D${prev}*E${prev} - D${prev}*(B${prev} + C${prev}) + C${prev}*(D${prev} - A${prev}) - C${prev} * C${prev} + D${prev}`, // always 400
    `=D${prev}*E${prev} - D${prev}*(B${prev} + C${prev}) + C${prev}*(D${prev} - A${prev}) - C${prev} * C${prev} + E${prev}`, // always 500
  ])

  prev++
}

let runsData = []
let currentRun = 0
while (currentRun < numberOfRuns) {
  const engine = new HandsOnEngine()

  const timestampBefore = Date.now()
  engine.loadSheet(sheet)
  const timestampAfter = Date.now()

  runsData.push(timestampAfter - timestampBefore)

  currentRun++
}
runsData.sort()
const medianRun = runsData[Math.trunc(numberOfRuns / 2)];
console.warn(`Number of rows: ${rows}`)
console.warn(`Runs: ${runsData.map((v) => (v / 1000))} (in seconds)`)
console.warn(`Median run: ${medianRun / 1000}`)

const resultMillisecondsPerThousandRows = medianRun / (rows / 1000)
console.warn(`Expected to work in: ${millisecondsPerThousandRows} ms per 1000 rows`)
console.warn(`Actual time: ${resultMillisecondsPerThousandRows} ms per 1000 rows`)
if (resultMillisecondsPerThousandRows > millisecondsPerThousandRows) {
  process.exit(1)
}
