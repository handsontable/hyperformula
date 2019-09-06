import {BTree} from '../src/BTree'

const initialSize = 100000
const adds = 100
const reads = 10000

function randomNumber(from: number, to: number): number {
  const span = to - from
  return Math.random() * span + from
}
const readsArray: number[] = []
for (let i = 0; i < reads; i++) {
  readsArray.push(randomNumber(0, initialSize - 1))
}

const results: any[] = []

const benchmarkArray = () => {
  const result: any = { name: "Array" }
  let startAt

  const arr = new Array()

  startAt = Date.now()
  for (let i = 0; i < initialSize; i++) {
    arr.push(42)
  }
  result[`building with ${initialSize}`] = Date.now() - startAt

  startAt = Date.now()
  for (let i = 0; i < adds; i++) {
    arr.unshift(42)
  }
  result[`adding ${adds} in beginning`] = Date.now() - startAt

  startAt = Date.now()
  const middle = Math.ceil(initialSize / 2)
  for (let i = 0; i < adds; i++) {
    arr.splice(middle, 0, 42)
  }
  result[`adding ${adds} in middle`] = Date.now() - startAt

  startAt = Date.now()
  for (let i = 0; i < adds; i++) {
    arr.push(42)
  }
  result[`adding ${adds} in end`] = Date.now() - startAt

  startAt = Date.now()
  for (let i = 0; i < reads; i++) {
    arr[readsArray[i]]
  }
  result[`reading ${reads} at random`] = Date.now() - startAt

  results.push(result)
}

const benchmarkBTree = (btreeSpan: number) => {
  const result: any = { name: `BTree(${btreeSpan})` }
  let startAt

  const btree = new BTree(btreeSpan)

  startAt = Date.now()
  for (let i = 0; i < initialSize; i++) {
    btree.addKey(i, 42)
  }
  result[`building with ${initialSize}`] = Date.now() - startAt

  startAt = Date.now()
  for (let i = 0; i < adds; i++) {
    btree.add2Key(0, 42)
  }
  result[`adding ${adds} in beginning`] = Date.now() - startAt

  startAt = Date.now()
  const middle = Math.ceil(initialSize / 2)
  for (let i = 0; i < adds; i++) {
    btree.add2Key(middle, 42)
  }
  result[`adding ${adds} in middle`] = Date.now() - startAt

  startAt = Date.now()
  for (let i = 0; i < adds; i++) {
    btree.addKey(initialSize + adds, 42)
  }
  result[`adding ${adds} in end`] = Date.now() - startAt

  startAt = Date.now()
  for (let i = 0; i < reads; i++) {
    btree.getKey(readsArray[i])
  }
  result[`reading ${reads} at random`] = Date.now() - startAt

  results.push(result)
}

benchmarkArray()
benchmarkBTree(8)
benchmarkBTree(16)
benchmarkBTree(32)
benchmarkBTree(64)
benchmarkBTree(128)

console.table(results)
