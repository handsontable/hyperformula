import {HandsOnEngine} from '../src'
import {StatType} from '../src/statistics/Statistics'

export interface Config {
  millisecondsPerThousandRows: number,
  numberOfRuns: number
}

export function benchmark(sheet: string[][], config: Config = {
  millisecondsPerThousandRows: 50,
  numberOfRuns: 3,
}) {
  const stats = []
  const rows = sheet.length

  let currentRun = 0
  while (currentRun < config.numberOfRuns) {
    const engine = new HandsOnEngine()
    engine.loadSheet(sheet)
    stats.push(engine.getStats())
    currentRun++
  }

  const overall = stats.map((s) => s.get(StatType.OVERALL)!).sort()
  const evaluation = stats.map((s) => s.get(StatType.EVALUATION)!).sort()
  const medianRun = overall[Math.trunc(config.numberOfRuns / 2)]
  const parsing = stats.map((s) => s.get(StatType.PARSER)!).sort()
  const topSort = stats.map((s) => s.get(StatType.TOP_SORT)!).sort()
  const buildGraph = stats.map((s) => s.get(StatType.GRAPH_BUILD)!).sort()

  console.warn(`Number of rows: ${rows}`)
  console.warn(`Overall: ${overall.map((v) => (v / 1000))} (in seconds)`)
  console.warn(`Median overall: ${medianRun / 1000}`)
  console.warn(`Evaluation: ${evaluation.map((v) => (v / 1000))} (in seconds)`)
  console.warn(`Median evaluation: ${evaluation[Math.trunc(config.numberOfRuns / 2)] / 1000}`)
  console.warn(`Parsing: ${parsing.map((v) => (v / 1000))}`)
  console.warn(`Median parsing: ${parsing[Math.trunc(config.numberOfRuns / 2)] / 1000}`)
  console.warn(`TopSort: ${topSort.map((v) => (v / 1000))}`)
  console.warn(`Median TopSort: ${topSort[Math.trunc(config.numberOfRuns / 2)] / 1000}`)
  console.warn(`Build Graph: ${buildGraph.map((v) => (v / 1000))}`)
  console.warn(`Median BuildGraph: ${buildGraph[Math.trunc(config.numberOfRuns / 2)] / 1000}`)

  const resultMillisecondsPerThousandRows = medianRun / (rows / 1000)
  console.warn(`Expected to work in: ${config.millisecondsPerThousandRows} ms per 1000 rows`)
  console.warn(`Actual time: ${resultMillisecondsPerThousandRows} ms per 1000 rows`)
  if (resultMillisecondsPerThousandRows > config.millisecondsPerThousandRows) {
    process.exit(1)
  }
}
