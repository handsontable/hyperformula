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

    expect(btree._root.keys).toEqual([2])
    expect(btree._root.children![0].keys).toEqual([1])
    expect(btree._root.children![1].keys).toEqual([3,4])
  })

  it('adding key so tree has to split child', () => {
    const btree = new BTree(2)

    btree.addKey(1, 10)
    btree.addKey(2, 10)
    btree.addKey(3, 10)
    btree.addKey(4, 10)
    btree.addKey(5, 10)
    btree.addKey(6, 16)

    expect(btree._root.keys).toEqual([2,4])
    expect(btree._root.children![0].keys).toEqual([1])
    expect(btree._root.children![1].keys).toEqual([3])
    expect(btree._root.children![2].keys).toEqual([5,6])
    expect(btree.getKey(6)).toEqual(16)
  })

  it('addKeyWithShift', () => {
    const btree = new BTree(2)
    btree.addKey(1, 11)
    btree.addKey(2, 12)
    btree.addKey(3, 13)
    btree.addKey(4, 14)
    btree.addKey(5, 15)
    btree.addKey(6, 16)

    btree.addKeyWithShift(4, 99)

    expect(btree.getKey(1)).toEqual(11)
    expect(btree.getKey(2)).toEqual(12)
    expect(btree.getKey(3)).toEqual(13)
    expect(btree.getKey(4)).toEqual(99)
    expect(btree.getKey(5)).toEqual(14)
    expect(btree.getKey(6)).toEqual(15)
    expect(btree.getKey(7)).toEqual(16)
    expect(btree.getKey(8)).toEqual(null)
  })
})
