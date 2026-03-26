/**
 * Circular dependency convergence benchmark.
 *
 * Tests several scenarios:
 *  1. Fast-converging (damped) — should benefit from early termination
 *  2. Non-converging (divergent) — no early termination, baseline comparison
 *  3. Trivial identity cycle — converges instantly
 *  4. Large-scale converging model — many cells in a damped cycle
 *  5. Mixed: circular + non-circular dependents
 *  6. setCellContents triggering circular recalc (CRUD path)
 *
 * Usage:
 *   npm run tsnode test/performance/run-circular-benchmark.ts
 */

import {HyperFormula, Sheet, ConfigParams} from '../../src'

interface BenchmarkScenario {
  name: string
  runs: number
  setup: () => { engine: HyperFormula, action?: () => void }
}

function runScenario(scenario: BenchmarkScenario): { name: string, avgMs: number, medianMs: number, minMs: number } {
  const times: number[] = []

  for (let r = 0; r < scenario.runs; r++) {
    const {engine, action} = scenario.setup()

    const start = performance.now()
    if (action) {
      action()
    }
    const end = performance.now()

    times.push(end - start)
  }

  times.sort((a, b) => a - b)
  const avg = times.reduce((s, t) => s + t, 0) / times.length
  const median = times.length % 2 === 0
    ? (times[times.length / 2 - 1] + times[times.length / 2]) / 2
    : times[Math.floor(times.length / 2)]
  const min = times[0]

  return {name: scenario.name, avgMs: +avg.toFixed(3), medianMs: +median.toFixed(3), minMs: +min.toFixed(3)}
}

// ── Helpers ──────────────────────────────────────────────────────────

function colLetter(n: number): string {
  let s = ''
  while (n >= 0) {
    s = String.fromCharCode((n % 26) + 65) + s
    n = Math.floor(n / 26) - 1
  }
  return s
}

// ── Scenarios ────────────────────────────────────────────────────────

const RUNS = 50

const scenarios: BenchmarkScenario[] = [
  // 1. Fast-converging damped 2-cell cycle (build triggers initial, setCellContents triggers iteration)
  {
    name: 'Damped 2-cell (converges ~5 iters)',
    runs: RUNS,
    setup() {
      const engine = HyperFormula.buildFromArray(
        [['=0.5*B1+1', '1']],
        {allowCircularReferences: true, maxIterations: 100, licenseKey: 'gpl-v3'},
      )
      return {
        engine,
        action: () => engine.setCellContents({sheet: 0, col: 1, row: 0}, [['=0.5*A1+1']]),
      }
    },
  },

  // 2. Non-converging divergent 2-cell cycle
  {
    name: 'Divergent 2-cell (no convergence, 100 iters)',
    runs: RUNS,
    setup() {
      const engine = HyperFormula.buildFromArray(
        [['=B1+1', '1']],
        {allowCircularReferences: true, maxIterations: 100, licenseKey: 'gpl-v3'},
      )
      return {
        engine,
        action: () => engine.setCellContents({sheet: 0, col: 1, row: 0}, [['=A1+1']]),
      }
    },
  },

  // 3. Trivial identity 2-cell cycle (converges in 1 iter)
  {
    name: 'Identity 2-cell (converges 1 iter)',
    runs: RUNS,
    setup() {
      const engine = HyperFormula.buildFromArray(
        [['=B1', '1']],
        {allowCircularReferences: true, maxIterations: 100, licenseKey: 'gpl-v3'},
      )
      return {
        engine,
        action: () => engine.setCellContents({sheet: 0, col: 1, row: 0}, [['=A1']]),
      }
    },
  },

  // 4. Large damped cycle: 50 cells in a ring, each = 0.5 * prev + 1
  {
    name: 'Damped 50-cell ring (converges early)',
    runs: RUNS,
    setup() {
      const size = 50
      const row: string[] = []
      for (let i = 0; i < size; i++) {
        const prev = colLetter((i - 1 + size) % size)
        row.push(`=0.5*${prev}1+1`)
      }
      // Replace last cell with a constant so we can introduce cycle via setCellContents
      const lastCol = colLetter(size - 1)
      row[size - 1] = '1'

      const engine = HyperFormula.buildFromArray(
        [row],
        {allowCircularReferences: true, maxIterations: 100, licenseKey: 'gpl-v3'},
      )

      const prevCol = colLetter(size - 2)
      return {
        engine,
        action: () => engine.setCellContents(
          {sheet: 0, col: size - 1, row: 0},
          [[`=0.5*${prevCol}1+1`]],
        ),
      }
    },
  },

  // 5. Large divergent cycle: 50 cells in a ring, each = prev + 1
  {
    name: 'Divergent 50-cell ring (no convergence)',
    runs: RUNS,
    setup() {
      const size = 50
      const row: string[] = []
      for (let i = 0; i < size; i++) {
        const prev = colLetter((i - 1 + size) % size)
        row.push(`=${prev}1+1`)
      }
      row[size - 1] = '1'

      const engine = HyperFormula.buildFromArray(
        [row],
        {allowCircularReferences: true, maxIterations: 100, licenseKey: 'gpl-v3'},
      )

      const prevCol = colLetter(size - 2)
      return {
        engine,
        action: () => engine.setCellContents(
          {sheet: 0, col: size - 1, row: 0},
          [[`=${prevCol}1+1`]],
        ),
      }
    },
  },

  // 6. Damped 2-cell with high maxIterations (1000) — shows convergence saves most time
  {
    name: 'Damped 2-cell, maxIter=1000 (converges ~5)',
    runs: RUNS,
    setup() {
      const engine = HyperFormula.buildFromArray(
        [['=0.5*B1+1', '1']],
        {allowCircularReferences: true, maxIterations: 1000, licenseKey: 'gpl-v3'},
      )
      return {
        engine,
        action: () => engine.setCellContents({sheet: 0, col: 1, row: 0}, [['=0.5*A1+1']]),
      }
    },
  },

  // 7. Large model: 200 cells, damped ring, maxIterations=1000
  {
    name: 'Damped 200-cell ring, maxIter=1000',
    runs: 20,
    setup() {
      const size = 200
      const row: string[] = []
      for (let i = 0; i < size; i++) {
        const prev = colLetter((i - 1 + size) % size)
        row.push(`=0.5*${prev}1+1`)
      }
      row[size - 1] = '1'

      const engine = HyperFormula.buildFromArray(
        [row],
        {allowCircularReferences: true, maxIterations: 1000, licenseKey: 'gpl-v3'},
      )

      const prevCol = colLetter(size - 2)
      return {
        engine,
        action: () => engine.setCellContents(
          {sheet: 0, col: size - 1, row: 0},
          [[`=0.5*${prevCol}1+1`]],
        ),
      }
    },
  },

  // 8. Mixed: circular cells + downstream non-circular dependents
  {
    name: 'Damped 2-cell + 100 downstream deps',
    runs: RUNS,
    setup() {
      // A1=0.5*B1+1, B1=constant initially, C1..CV1 = A1+col
      const row: string[] = ['=0.5*B1+1', '1']
      for (let i = 2; i < 102; i++) {
        row.push(`=A1+${i}`)
      }

      const engine = HyperFormula.buildFromArray(
        [row],
        {allowCircularReferences: true, maxIterations: 100, licenseKey: 'gpl-v3'},
      )
      return {
        engine,
        action: () => engine.setCellContents({sheet: 0, col: 1, row: 0}, [['=0.5*A1+1']]),
      }
    },
  },
]

// ── Main ─────────────────────────────────────────────────────────────

;(() => {
  console.log('\n=== Circular Dependency Convergence Benchmark ===\n')
  const results = scenarios.map(runScenario)

  // Pretty-print table
  const nameWidth = Math.max(...results.map(r => r.name.length))
  const header = `${'Scenario'.padEnd(nameWidth)}  Avg (ms)   Median (ms)  Min (ms)`
  console.log(header)
  console.log('-'.repeat(header.length))

  for (const r of results) {
    const avg = r.avgMs.toFixed(3).padStart(9)
    const med = r.medianMs.toFixed(3).padStart(12)
    const min = r.minMs.toFixed(3).padStart(9)
    console.log(`${r.name.padEnd(nameWidth)}${avg}${med}${min}`)
  }

  // Also dump JSON for comparison tooling
  console.log('\n--- JSON ---')
  console.log(JSON.stringify(results.map(r => ({name: r.name, totalTime: r.avgMs}))))
})()
