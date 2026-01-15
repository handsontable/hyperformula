import {Statistics, StatType} from '../../../src/statistics'

describe('Statistics', () => {

  it('reset - should return to base values', () => {
    const statistics = new Statistics()

    const baseSnapshot = statistics.snapshot()

    statistics.start(StatType.BUILD_ENGINE_TOTAL)
    statistics.end(StatType.BUILD_ENGINE_TOTAL)
    statistics.start(StatType.VLOOKUP)
    statistics.end(StatType.VLOOKUP)
    statistics.start(StatType.PROCESS_DEPENDENCIES)
    statistics.end(StatType.PROCESS_DEPENDENCIES)
    statistics.incrementCriterionFunctionFullCacheUsed()
    statistics.incrementCriterionFunctionPartialCacheUsed()

    const modifiedSnapshot = statistics.snapshot()

    statistics.reset()

    const resetSnapshot = statistics.snapshot()

    expect(baseSnapshot.size).toBe(2)
    expect(baseSnapshot.get(StatType.CRITERION_FUNCTION_FULL_CACHE_USED)).toBe(0)
    expect(baseSnapshot.get(StatType.CRITERION_FUNCTION_PARTIAL_CACHE_USED)).toBe(0)

    expect(modifiedSnapshot.size).toBe(5)
    expect(modifiedSnapshot.has(StatType.CRITERION_FUNCTION_FULL_CACHE_USED)).toBe(true)
    expect(modifiedSnapshot.has(StatType.CRITERION_FUNCTION_PARTIAL_CACHE_USED)).toBe(true)
    expect(modifiedSnapshot.has(StatType.BUILD_ENGINE_TOTAL)).toBe(true)
    expect(modifiedSnapshot.has(StatType.VLOOKUP)).toBe(true)
    expect(modifiedSnapshot.has(StatType.PROCESS_DEPENDENCIES)).toBe(true)

    expect(resetSnapshot).toEqual(baseSnapshot)
  })

  it('start - should throw if you try and start multiple of the same StatType', () => {
    const statistics = new Statistics()

    statistics.start(StatType.BUILD_ENGINE_TOTAL)
    statistics.start(StatType.VLOOKUP)

    expect(() => {
      statistics.start(StatType.BUILD_ENGINE_TOTAL)
    }).toThrowError(`Statistics ${StatType.BUILD_ENGINE_TOTAL} already started`)

    expect(() => {
      statistics.start(StatType.VLOOKUP)
    }).toThrowError(`Statistics ${StatType.VLOOKUP} already started`)
  })

  it('end - should throw if you try and end a StatType that has not been started', () => {
    const statistics = new Statistics()

    statistics.start(StatType.BUILD_ENGINE_TOTAL)
    statistics.start(StatType.VLOOKUP)

    expect(() => {
      statistics.end(StatType.PROCESS_DEPENDENCIES)
    }).toThrowError(`Statistics ${StatType.PROCESS_DEPENDENCIES} not started`)

    expect(() => {
      statistics.end(StatType.ADJUSTING_ADDRESS_MAPPING)
    }).toThrowError(`Statistics ${StatType.ADJUSTING_ADDRESS_MAPPING} not started`)
  })

})
