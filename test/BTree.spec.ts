import {BTree} from '../src/BTree'

describe('BTree', () => {
  it('initialization works', () => {
    const btree = new BTree(2)
    
    expect(btree.getKey(42)).toEqual(null)
  })

  it('adding a key to empty tree', () => {
    const btree = new BTree(2)

    btree.addKey(42, 10)

    expect(btree.getKey(42)).toEqual(10)
  })

  it('adding a key with key smaller than already present', () => {
    const btree = new BTree(2)

    btree.addKey(42, 10)
    btree.addKey(13, 100)

    expect(btree.getKey(42)).toEqual(10)
    expect(btree.getKey(13)).toEqual(100)
    expect(btree._root.keys).toEqual([13, 42])
  })

  it('adding a key with key bigger than already present', () => {
    const btree = new BTree(2)

    btree.addKey(42, 10)
    btree.addKey(78, 100)

    expect(btree.getKey(42)).toEqual(10)
    expect(btree.getKey(78)).toEqual(100)
    expect(btree._root.keys).toEqual([42, 78])
  })

  it('adding keys to the almost maxed size of a node', () => {
    const btree = new BTree(2)
    btree.addKey(1, 10)
    btree.addKey(2, 10)

    btree.addKey(3, 10)

    expect(btree._root.keys).toEqual([1,2,3])
  })

  it('adding one more key than the span of the node', () => {
    const btree = new BTree(2)

    btree.addKey(1, 10)
    btree.addKey(2, 10)
    btree.addKey(3, 10)
    btree.addKey(4, 10)

    console.warn(btree._root.keys)
    console.warn(btree._root.children![0].keys)
    console.warn(btree._root.children![1].keys)
  })
})
