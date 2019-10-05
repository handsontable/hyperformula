import {HandsOnEngine} from '../src'
import {StatType} from '../src/statistics/Statistics'
import {average} from './benchmark'

export enum AdditionalStatTypes {
    INIT_DATASTRUCTURES = 'INIT_DATASTRUCTURES',
    PREPROCESSING = 'PREPROCESING',
    CRUDS_TOTAL = 'CRUDS_TOTAL',
    NAME = 'NAME',
}

export function enrichStatistics(stats: Map<string, any>): Map<string, any> {
    const initDatastructures = (stats.get(StatType.GRAPH_BUILD) || 0) - (stats.get(StatType.PARSER) || 0)
    const preprocessing = (stats.get(StatType.GRAPH_BUILD) || 0) + (stats.get(StatType.TOP_SORT) || 0)
    const enriched = new Map(stats)
    enriched.set(AdditionalStatTypes.INIT_DATASTRUCTURES, initDatastructures)
    enriched.set(AdditionalStatTypes.PREPROCESSING, preprocessing)
    return enriched
}

export function averageStats(stats: Array<Map<string, number>>): Map<string, any> {
    const averages = new Map<string, number>()

    for (const key of stats[0].keys()) {
        averages.set(key, average(stats.map((stats) => stats.get(key)!)))
    }

    return averages
}

export function statsToObject(stats: Map<string, any>): any {
    return Object.assign({}, ...[...stats.entries()].map(([k, v]) => ({[k]: v})))
}

export function logStats(stats: any[]): void {
    console.table(stats, ['NAME', 'TOTAL CRUD', ...Object.keys(StatType)])
}

export function measureCruds<T>(engine: HandsOnEngine, stats: any[], name: String, func: () => T): void {
    engine.stats.reset()
    const start = Date.now()
    func()
    const end = Date.now()
    const time = end - start
    const actualStats = engine.getStats() as Map<string, any>
    actualStats.set(AdditionalStatTypes.CRUDS_TOTAL, time)
    actualStats.set('NAME', name)
    statsTreePrintCruds(actualStats)
    stats.push(statsToObject(actualStats))
}

export function statsTreePrint(stats: Map<string, number>): void {
    const str =
`${stats.get('NAME')}
________________________________________________
|BUILD_ENGINE_TOTAL:                        ${stats.get(StatType.BUILD_ENGINE_TOTAL) || 0}
|    |PREPROCESSING:                        ${stats.get(AdditionalStatTypes.PREPROCESSING) || 0}
|    |    |GRAPH_BUILD:                     ${stats.get(StatType.GRAPH_BUILD) || 0}
|    |    |    |INIT_DATASTRUCTURES:        ${stats.get(AdditionalStatTypes.INIT_DATASTRUCTURES) || 0}
|    |    |    |    |BUILD_COLUMN_INDEX:    ${stats.get(StatType.BUILD_COLUMN_INDEX) || 0}
|    |    |    |    |MATRIX_DETECTION:      ${stats.get(StatType.MATRIX_DETECTION) || 0}
|    |    |    |PARSER:                     ${stats.get(StatType.PARSER) || 0}
|    |    |TOP_SORT:                        ${stats.get(StatType.TOP_SORT) || 0}
|    |EVALUATION:                           ${stats.get(StatType.EVALUATION) || 0}
|    |    |VLOOKUP:                         ${stats.get(StatType.VLOOKUP) || 0}
________________________________________________`
    console.log(str)
}

export function statsTreePrintCruds(stats: Map<string, number>): void {
    const str =
`|CRUDS:                                     ${stats.get(AdditionalStatTypes.CRUDS_TOTAL) || 0}
|   |TRANSFORM_ASTS:                        ${stats.get(StatType.TRANSFORM_ASTS) || 0}
|   |TRANSFORM_ASTS_POSTPONED:              ${stats.get(StatType.TRANSFORM_ASTS_POSTPONED) || 0}
|   |ADJUSTING_ADDRESS_MAPPING:             ${stats.get(StatType.ADJUSTING_ADDRESS_MAPPING) || 0}
|   |ADJUSTING_MATRIX_MAPPING:              ${stats.get(StatType.ADJUSTING_MATRIX_MAPPING) || 0}
|   |ADJUSTING_RANGES:                      ${stats.get(StatType.ADJUSTING_RANGES) || 0}
|   |ADJUSTING_GRAPH:                       ${stats.get(StatType.ADJUSTING_GRAPH) || 0}
|   |EVALUATION:                            ${stats.get(StatType.EVALUATION) || 0}
|   |    |VLOOKUP:                          ${stats.get(StatType.VLOOKUP) || 0}
________________________________________________`
    console.log(str)
}
