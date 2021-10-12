import {HyperFormula} from '../../../src'
import {StatType} from '../../../src/statistics'

export type Stats = Map<EnrichedStatType, number>

export enum ExtStatType {
  INIT_DATASTRUCTURES = 'INIT_DATASTRUCTURES',
  PREPROCESSING = 'PREPROCESING',
  CRUDS_TOTAL = 'CRUDS_TOTAL',
}

export const EnrichedStatType = {...StatType, ...ExtStatType}
export type EnrichedStatType = StatType | ExtStatType

export function enrichStatistics(stats: Stats): Stats {
  const initDatastructures = (stats.get(EnrichedStatType.GRAPH_BUILD) || 0) - (stats.get(EnrichedStatType.PARSER) || 0)
  const preprocessing = (stats.get(EnrichedStatType.GRAPH_BUILD) || 0) + (stats.get(EnrichedStatType.TOP_SORT) || 0)
  const enriched = new Map(stats)
  enriched.set(EnrichedStatType.INIT_DATASTRUCTURES, initDatastructures)
  enriched.set(EnrichedStatType.PREPROCESSING, preprocessing)
  return enriched
}

export function measureCruds(engine: HyperFormula, name: string, func: (engine: HyperFormula) => void): Stats {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  engine._stats.reset()

  const start = Date.now()
  func(engine)
  const end = Date.now()

  const time = end - start
  const actualStats: Stats = engine.getStats()
  actualStats.set(EnrichedStatType.CRUDS_TOTAL, time)

  return actualStats
}

export function statsTreePrint(stats: Stats): void {
  const str =
    `________________________________________________
|BUILD_ENGINE_TOTAL:                        ${stats.get(EnrichedStatType.BUILD_ENGINE_TOTAL) || 0}
|    |PREPROCESSING:                        ${stats.get(EnrichedStatType.PREPROCESSING) || 0}
|    |    |GRAPH_BUILD:                     ${stats.get(EnrichedStatType.GRAPH_BUILD) || 0}
|    |    |    |INIT_DATASTRUCTURES:        ${stats.get(EnrichedStatType.INIT_DATASTRUCTURES) || 0}
|    |    |    |    |BUILD_COLUMN_INDEX:    ${stats.get(EnrichedStatType.BUILD_COLUMN_INDEX) || 0}
|    |    |    |PARSER:                     ${stats.get(EnrichedStatType.PARSER) || 0}
|    |    |TOP_SORT:                        ${stats.get(EnrichedStatType.TOP_SORT) || 0}
|    |EVALUATION:                           ${stats.get(EnrichedStatType.EVALUATION) || 0}
|    |    |VLOOKUP:                         ${stats.get(EnrichedStatType.VLOOKUP) || 0}
________________________________________________\n`
  console.log(str)
}

export function statsTreePrintCruds(stats: Stats): void {
  const str =
    `|CRUDS:                                     ${stats.get(EnrichedStatType.CRUDS_TOTAL) || 0}
|   |TRANSFORM_ASTS:                        ${stats.get(EnrichedStatType.TRANSFORM_ASTS) || 0}
|   |TRANSFORM_ASTS_POSTPONED:              ${stats.get(EnrichedStatType.TRANSFORM_ASTS_POSTPONED) || 0}
|   |ADJUSTING_ADDRESS_MAPPING:             ${stats.get(EnrichedStatType.ADJUSTING_ADDRESS_MAPPING) || 0}
|   |ADJUSTING_MATRIX_MAPPING:              ${stats.get(EnrichedStatType.ADJUSTING_ARRAY_MAPPING) || 0}
|   |ADJUSTING_RANGES:                      ${stats.get(EnrichedStatType.ADJUSTING_RANGES) || 0}
|   |ADJUSTING_GRAPH:                       ${stats.get(EnrichedStatType.ADJUSTING_GRAPH) || 0}
|   |EVALUATION:                            ${stats.get(EnrichedStatType.EVALUATION) || 0}
|   |    |VLOOKUP:                          ${stats.get(EnrichedStatType.VLOOKUP) || 0}
________________________________________________\n`
  console.log(str)
}

export function reduceStats(stats: Stats[], fn: (_: number[]) => number): Stats {
  const averages = new Map<EnrichedStatType, number>()

  for (const key of stats[0].keys()) {
    const avg = fn(stats.map((stats) => stats.get(key) || 0))
    averages.set(key, avg)
  }

  return averages
}

export function average(values: number[]): number {
  const sum = values.reduce((sum, value) => {
    return sum + value
  }, 0)
  return sum / values.length
}

export function median(values: number[]): number {
  return values.sort((a, b) => a - b)[Math.trunc(values.length / 2)]
}

export function stdDev(values: number[]): number {
  const avg = average(values)
  const sqrDiffs = squareDiffs(values, avg)
  const avgSquareDiffs = average(sqrDiffs)

  return Math.sqrt(avgSquareDiffs)
}

function squareDiffs(values: number[], avg: number): number[] {
  return values.map((value) => {
    const diff = value - avg
    return diff * diff
  })
}
