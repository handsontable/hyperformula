import {Config} from '../../src'
import {benchmark, benchmarkCsvSheets} from '../benchmark'
import {sheet as T} from '../sheets/05-sheet-t'
import {sheet as A} from '../sheets/09-sheet-a'
import {sheet as B} from '../sheets/10-sheet-b'
import {sheet as C} from '../sheets/12-test-c'
import {sheets as D} from '../sheets/13-sheet-d'
import {vlookup as stage3_vlookup} from '../stage-3'
import {sheetA as stage3_sheetA} from '../stage-3'
import {sheetB as stage3_sheetB} from '../stage-3'

let working = false

interface IExtendedConsole extends Console {
    olog?: any
}

function run(func: (_?: number) => any) {
    const numberOfRuns = parseInt((document.getElementById('numberOfRuns')! as HTMLInputElement).value, 10)

    if (working) {
        return
    }
    clear()
    toggle()

    setTimeout(() => {
        working = true
        func(numberOfRuns)
        working = false
        toggle()
    }, 500)
}

function runBenchmark(fun: any, benchmarkName: string, millisecondsPerThousandRows: number = 100, optionalConfig: Config = new Config()) {
    const numberOfRuns = parseInt((document.getElementById('numberOfRuns')! as HTMLInputElement).value, 10)

    run(() => {
        console.info(`=== ${benchmarkName} ===`)
        const sheetOrSheets = fun()
        if (Array.isArray(sheetOrSheets)) {
            benchmark(sheetOrSheets, [], { millisecondsPerThousandRows, numberOfRuns, engineConfig: optionalConfig})
        } else {
            benchmarkCsvSheets(sheetOrSheets, [], { millisecondsPerThousandRows, numberOfRuns, engineConfig: optionalConfig})
        }
    })
}

function toggle() {
    const inputs = document.getElementsByTagName('input')
    for (let i = 0; i < inputs.length; ++i) {
        inputs[i].disabled = !inputs[i].disabled
    }
}

function clear() {
    const log = document.getElementById('log')!
    log.innerHTML = ''
}

function logInit() {
    const eConsole: IExtendedConsole = console

    const log = document.getElementById('log')!

    if (typeof eConsole  !== 'undefined') {
        if (typeof eConsole.log !== 'undefined') {
            eConsole.olog = eConsole.log
        } else {
            eConsole.olog = () => {}
        }
    }

    eConsole.log = function(message: string) {
        eConsole.olog(message)
        log.innerHTML += '<p>' + message + '</p>'
    }
    eConsole.error = eConsole.debug = eConsole.info =  eConsole.log
}

function init() {
    logInit()

    const btn_sheetA = document.getElementById('btn_sheetA')!
    const btn_sheetB = document.getElementById('btn_sheetB')!
    const btn_sheetT = document.getElementById('btn_sheetT')!
    const btn_sheetCgpu = document.getElementById('btn_sheetCgpu')!
    const btn_sheetCcpu = document.getElementById('btn_sheetCcpu')!
    const btn_sheetDgpu = document.getElementById('btn_sheetDgpu')!
    const btn_sheetDcpu = document.getElementById('btn_sheetDcpu')!
    const btn_stage3_vlookup = document.getElementById('btn_stage3_vlookup')!
    const btn_stage3_sheetA = document.getElementById('btn_stage3_sheetA')!
    const btn_stage3_sheetB = document.getElementById('btn_stage3_sheetB')!

    btn_sheetA.addEventListener('click', () => runBenchmark(A, 'Sheet A'))
    btn_sheetB.addEventListener('click', () => runBenchmark(B, 'Sheet B'))
    btn_sheetT.addEventListener('click', () => runBenchmark(T, 'Sheet T'))
    btn_sheetCgpu.addEventListener('click', () => runBenchmark(C, 'Sheet C (GPU)', 3000, new Config({ gpuMode: 'gpu' })))
    btn_sheetCcpu.addEventListener('click', () => runBenchmark(C, 'Sheet C (CPU)', 6000, new Config({ gpuMode: 'cpu' })))
    btn_sheetDgpu.addEventListener('click', () => runBenchmark(D, 'Sheet D (GPU)', 3000, new Config({ gpuMode: 'gpu' })))
    btn_sheetDcpu.addEventListener('click', () => runBenchmark(D, 'Sheet D (CPU)', 6000, new Config({ gpuMode: 'cpu' })))
    btn_stage3_vlookup.addEventListener('click', () => run(stage3_vlookup))
    btn_stage3_sheetA.addEventListener('click', () => run(stage3_sheetA))
    btn_stage3_sheetB.addEventListener('click', () => run(stage3_sheetB))
}

init()
