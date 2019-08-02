import {Config, HandsOnEngine} from '../../src'
import {sheet} from '../sheets/14-numeric-matrix'
import {batch} from './operations'

function start() {
  let engine = HandsOnEngine.buildFromArray(sheet(1000, 1000), new Config({
    matrixDetection: false,
  }))
  let dimensions = engine.getSheetsDimensions().get('Sheet1')!
  console.log('\n== Matrix - detection off ==', dimensions)

  batch(engine)

  engine = HandsOnEngine.buildFromArray(sheet(1000, 1000), new Config({
    matrixDetectionThreshold: 1,
    matrixDetection: true,
  }))
  dimensions = engine.getSheetsDimensions().get('Sheet1')!
  console.log('\n== Matrix - detection on ==', dimensions)

  batch(engine)
}

start()
