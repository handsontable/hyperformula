/* eslint-disable no-console */
import {HyperFormula} from '../src'
import {AlwaysSparse} from '../src/DependencyGraph/AddressMapping/ChooseAddressMappingPolicy'

function bytesToMb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

function snapshot(label: string): NodeJS.MemoryUsage {
  if (global.gc) global.gc()
  if (global.gc) global.gc()
  const m = process.memoryUsage()
  console.log(
    `${label.padEnd(40)} heapUsed=${bytesToMb(m.heapUsed).padStart(10)}  rss=${bytesToMb(m.rss).padStart(10)}`
  )
  return m
}

function diff(label: string, before: NodeJS.MemoryUsage, after: NodeJS.MemoryUsage) {
  console.log(
    `Δ ${label.padEnd(38)} heapUsed=${bytesToMb(after.heapUsed - before.heapUsed).padStart(10)}  rss=${bytesToMb(after.rss - before.rss).padStart(10)}`
  )
}

function timed<T>(label: string, fn: () => T): T {
  const t0 = process.hrtime.bigint()
  const r = fn()
  const ms = Number(process.hrtime.bigint() - t0) / 1e6
  console.log(`⏱  ${label.padEnd(38)} ${ms.toFixed(1)} ms`)
  return r
}

function inspectInternals(hf: HyperFormula, sheetId: number) {
  // Reach into private fields purely for diagnostics.
  const dg: any = (hf as any)._dependencyGraph
  const addressMapping: any = dg.addressMapping
  const rangeMapping: any = dg.rangeMapping
  const graph: any = dg.graph

  const sheetMapping = addressMapping.mapping.get(sheetId)
  let mappedCellCount = 0
  if (sheetMapping && typeof sheetMapping.getHeight === 'function') {
    // Strategy: dense or sparse — both expose .mapping
    if (sheetMapping.mapping instanceof Map) {
      // Sparse: Map<col, Map<row, vertex>>
      for (const colMap of sheetMapping.mapping.values()) {
        mappedCellCount += colMap.size
      }
    } else if (Array.isArray(sheetMapping.mapping)) {
      for (const col of sheetMapping.mapping) {
        if (col) mappedCellCount += col.filter((v: any) => v !== undefined).length
      }
    }
  }

  let rangeVertexCount = 0
  for (const sheetRanges of rangeMapping.rangeMapping.values()) {
    rangeVertexCount += sheetRanges.size
  }

  const graphNodeCount = graph.nodes ? graph.nodes.size : (graph.getNodes ? graph.getNodes().length : 'n/a')

  console.log(`   ↳ addressMapping cells (sheet ${sheetId}): ${mappedCellCount}`)
  console.log(`   ↳ rangeMapping rangeVertices total:        ${rangeVertexCount}`)
  console.log(`   ↳ graph node count total:                  ${graphNodeCount}`)
  console.log(`   ↳ addressMapping strategy:                 ${sheetMapping?.constructor?.name}`)
}

function run() {
  console.log('\n=== Baseline (no engine) ===')
  const start = snapshot('process start')

  const useSparse = process.argv.includes('--sparse')
  console.log(`Strategy: ${useSparse ? 'AlwaysSparse' : 'AlwaysDense (default)'}`)

  console.log('\n=== Step 1: 1-cell sheet (A1=1) ===')
  const opts: any = {licenseKey: 'gpl-v3', maxRows: 1_048_576, maxColumns: 16_384}
  if (useSparse) opts.chooseAddressMappingPolicy = new AlwaysSparse()
  const hf = timed('build engine + 1 cell', () =>
    HyperFormula.buildFromArray([[1]], opts)
  )
  const sheetId = 0
  const afterBuild = snapshot('after build (1 cell)')
  diff('build cost', start, afterBuild)
  inspectInternals(hf, sheetId)

  console.log('\n=== Step 2: add formula =SUM(A1:A99999) into B1 ===')
  timed('setCellContents B1=SUM(A1:A99999)', () =>
    hf.setCellContents({sheet: sheetId, col: 1, row: 0}, [['=SUM(A1:A99999)']])
  )
  const afterFormula = snapshot('after formula =SUM(A1:A99999)')
  diff('Δ vs after-build', afterBuild, afterFormula)
  inspectInternals(hf, sheetId)

  // Verify the formula evaluates correctly
  console.log(`   ↳ B1 evaluates to:                         ${hf.getCellValue({sheet: sheetId, col: 1, row: 0})}`)

  console.log('\n=== Step 3: extend to =SUM(A1:A999999) (1M cells) ===')
  timed('setCellContents C1=SUM(A1:A999999)', () =>
    hf.setCellContents({sheet: sheetId, col: 2, row: 0}, [['=SUM(A1:A999999)']])
  )
  const afterBig = snapshot('after =SUM(A1:A999999)')
  diff('Δ vs previous',  afterFormula, afterBig)
  inspectInternals(hf, sheetId)
  console.log(`   ↳ C1 evaluates to:                         ${hf.getCellValue({sheet: sheetId, col: 2, row: 0})}`)

  hf.destroy()
}

run()
