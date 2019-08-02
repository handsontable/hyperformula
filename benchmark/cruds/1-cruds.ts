import {HandsOnEngine} from '../../src'
import {sheet as Sb} from '../sheets/01-simple-big'
import {sheet as Bs} from '../sheets/06-big-sum'
import {batch} from './operations'

function start() {
  let engine = HandsOnEngine.buildFromArray(Sb(10000))
  let dimensions = engine.getSheetsDimensions().get('Sheet1')!
  console.log('\n== Simple big ==', dimensions)
  batch(engine)

  engine = HandsOnEngine.buildFromArray(Sb(100000))
  dimensions = engine.getSheetsDimensions().get('Sheet1')!
  console.log('\n== Simple big ==', dimensions)
  batch(engine)

  engine = HandsOnEngine.buildFromArray(Bs(100000))
  dimensions = engine.getSheetsDimensions().get('Sheet1')!
  console.log('\n== Big sum ==', dimensions)
  batch(engine)
}

start()
