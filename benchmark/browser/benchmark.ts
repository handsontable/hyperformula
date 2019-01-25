import {benchmark} from '../benchmark'
import {sheet as T} from '../sheets/05-sheet-t'
import {sheet as A} from '../sheets/09-sheet-a'
import {sheet as B} from '../sheets/10-sheet-b'

let working = false

interface IExtendedConsole extends Console {
    olog?: any
}

function runBenchmark(fun: any, benchmarkName: string) {
    if (working) {
        return
    }

    const numberOfRuns = parseInt((document.getElementById('numberOfRuns')! as HTMLInputElement).value, 10)
    clear()
    toggle()

    setTimeout(() => {
        working = true
        console.info(`=== ${benchmarkName} ===`)
        benchmark(fun(), [], { millisecondsPerThousandRows: 100, numberOfRuns})
        working = false
        toggle()
    }, 500)
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

    btn_sheetA.addEventListener('click', () => runBenchmark(A, 'Sheet A'))
    btn_sheetB.addEventListener('click', () => runBenchmark(B, 'Sheet B'))
    btn_sheetT.addEventListener('click', () => runBenchmark(T, 'Sheet T'))
}

init()
