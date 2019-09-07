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

  it('addKeyWithShift when there is already a shift', () => {
    const btree = new BTree(2)
    btree.addKey(1, 11)
    btree.addKey(2, 12)
    btree.addKey(3, 14)
    btree.addKey(4, 15)
    btree.addKey(5, 17)
    btree.addKey(6, 18)
    btree.addKeyWithShift(3, 13)

    btree.addKeyWithShift(6, 16)

    expect(btree.getKey(1)).toEqual(11)
    expect(btree.getKey(2)).toEqual(12)
    expect(btree.getKey(3)).toEqual(13)
    expect(btree.getKey(4)).toEqual(14)
    expect(btree.getKey(5)).toEqual(15)
    expect(btree.getKey(6)).toEqual(16)
    expect(btree.getKey(7)).toEqual(17)
    expect(btree.getKey(8)).toEqual(18)
    expect(btree.getKey(9)).toEqual(null)
  })

  it('addKey when there is already a shift', () => {
    const btree = new BTree(2)
    btree.addKey(1, 11)
    btree.addKey(2, 12)
    btree.addKey(3, 14)
    btree.addKey(4, 15)
    btree.addKey(5, 16)
    btree.addKey(7, 18)
    btree.addKeyWithShift(3, 13)

    btree.addKey(7, 17)

    expect(btree.getKey(1)).toEqual(11)
    expect(btree.getKey(2)).toEqual(12)
    expect(btree.getKey(3)).toEqual(13)
    expect(btree.getKey(4)).toEqual(14)
    expect(btree.getKey(5)).toEqual(15)
    expect(btree.getKey(6)).toEqual(16)
    expect(btree.getKey(7)).toEqual(17)
    expect(btree.getKey(8)).toEqual(18)
    expect(btree.getKey(9)).toEqual(null)
  })

  it('deleteKeyWithShift from root node', () => {
    const btree = new BTree(2)
    btree.addKey(1, 11)
    btree.addKey(2, 12)
    btree.addKey(3, 13)

    btree.deleteKeyWithShift(2)

    expect(btree._root.keys).toEqual([1, 2])
    expect(btree._root.values).toEqual([11, 13])
  })

  it('deleteKeyWithShift from root node does nothing if no key present', () => {
    const btree = new BTree(2)
    btree.addKey(1, 11)
    btree.addKey(2, 12)
    btree.addKey(4, 14)

    btree.deleteKeyWithShift(3)

    expect(btree._root.keys).toEqual([1, 2, 4])
    expect(btree._root.values).toEqual([11, 12, 14])
  })

  it('deleteKeyWithShift from last leaf node, last element, h = 1', () => {
    const btree = new BTree(2)
    btree.addKey(1, 11)
    btree.addKey(2, 12)
    btree.addKey(3, 13)
    btree.addKey(4, 14)
    btree.addKey(5, 15)

    btree.deleteKeyWithShift(5)

    expect(btree._root.keys).toEqual([2])
    expect(btree._root.values).toEqual([12])
    expect(btree._root.children![0].keys).toEqual([1])
    expect(btree._root.children![0].values).toEqual([11])
    expect(btree._root.children![1].keys).toEqual([3,4])
    expect(btree._root.children![1].values).toEqual([13,14])
  })

  it('deleteKeyWithShift from last leaf node, not last element, h = 1', () => {
    const btree = new BTree(2)
    btree.addKey(1, 11)
    btree.addKey(2, 12)
    btree.addKey(3, 13)
    btree.addKey(4, 14)
    btree.addKey(5, 15)

    btree.deleteKeyWithShift(4)

    expect(btree._root.keys).toEqual([2])
    expect(btree._root.values).toEqual([12])
    expect(btree._root.children![0].keys).toEqual([1])
    expect(btree._root.children![0].values).toEqual([11])
    expect(btree._root.children![1].keys).toEqual([3,4])
    expect(btree._root.children![1].values).toEqual([13,15])
  })

  it('deleteKeyWithShift from not last leaf node, h = 1', () => {
    const btree = new BTree(2)
    btree.addKey(1, 11)
    btree.addKey(2, 12)
    btree.addKey(3, 13)
    btree.addKey(5, 15)
    btree.addKey(6, 16)
    btree.addKey(7, 17)
    btree.addKey(4, 14)

    btree.deleteKeyWithShift(4)

    expect(btree._root.keys).toEqual([2,4])
    expect(btree._root.values).toEqual([12,15])

    expect(btree._root.children![1].shift).toEqual(0)
    expect(btree._root.children![1].keys).toEqual([3])
    expect(btree._root.children![1].values).toEqual([13])

    expect(btree._root.children![2].shift).toEqual(-1)
    expect(btree._root.children![2].keys).toEqual([6,7])
    expect(btree._root.children![2].values).toEqual([16,17])
  })

  it('deleteKeyWithShift from not last leaf node, when not found the element, h = 1', () => {
    const btree = new BTree(2)
    btree.addKey(1, 11)
    btree.addKey(2, 12)
    btree.addKey(3, 13)
    btree.addKey(6, 16)
    btree.addKey(7, 17)
    btree.addKey(8, 18)
    btree.addKey(5, 15)

    btree.deleteKeyWithShift(4)

    expect(btree._root.keys).toEqual([2,6])
    expect(btree._root.values).toEqual([12,16])

    expect(btree._root.children![1].shift).toEqual(0)
    expect(btree._root.children![1].keys).toEqual([3,5])
    expect(btree._root.children![1].values).toEqual([13,15])

    expect(btree._root.children![2].shift).toEqual(0)
    expect(btree._root.children![2].keys).toEqual([7,8])
    expect(btree._root.children![2].values).toEqual([17,18])
  })

  it('deleteKeyWithShift from the leaf which is shifted, h = 1', () => {
    const btree = new BTree(2)
    btree.addKey(1, 11)
    btree.addKey(2, 12)
    btree.addKey(3, 13)
    btree.addKey(4, 14)
    btree.addKey(5, 15)
    btree.addKey(6, 16)
    btree.addKeyWithShift(3, 130)

    btree.deleteKeyWithShift(7)

    expect(btree._root.keys).toEqual([2,5])
    expect(btree._root.values).toEqual([12,14])

    expect(btree._root.children![1].keys).toEqual([3,4])
    expect(btree._root.children![1].values).toEqual([130,13])

    expect(btree._root.children![2].shift).toEqual(1)
    expect(btree._root.children![2].keys).toEqual([5])
    expect(btree._root.children![2].values).toEqual([15])
  })

  it('deleteKeyWithShift from the leaf, which has only t-1 nodes, h = 1', () => {
    const btree = new BTree(2)
    btree.addKey(1, 11)
    btree.addKey(2, 12)
    btree.addKey(3, 13)
    btree.addKey(4, 14)
    btree.addKey(5, 15)
    btree.addKey(6, 16)

    btree.deleteKeyWithShift(3)

    expect(btree._root.keys).toEqual([2,4])
    expect(btree._root.values).toEqual([12,15])

    expect(btree._root.children![1].keys).toEqual([3])
    expect(btree._root.children![1].values).toEqual([14])

    expect(btree._root.children![2].shift).toEqual(-1)
    expect(btree._root.children![2].keys).toEqual([6])
    expect(btree._root.children![2].values).toEqual([16])
  })

  it('deleteKeyWithShift from the leaf, which has only t-1 nodes, and has shifted right sibling, h = 1', () => {
    const btree = new BTree(2)
    btree.addKey(1, 11)
    btree.addKey(2, 12)
    btree.addKey(3, 13)
    btree.addKey(4, 14)
    btree.addKey(5, 15)
    btree.addKey(6, 16)
    btree.addKeyWithShift(1, 110)

    btree.deleteKeyWithShift(4)

    expect(btree._root.keys).toEqual([3,5])
    expect(btree._root.values).toEqual([12,15])

    expect(btree._root.children![0].shift).toEqual(0)
    expect(btree._root.children![0].keys).toEqual([1,2])
    expect(btree._root.children![0].values).toEqual([110,11])

    expect(btree._root.children![1].shift).toEqual(1)
    expect(btree._root.children![1].keys).toEqual([3])
    expect(btree._root.children![1].values).toEqual([14])

    expect(btree._root.children![2].shift).toEqual(0)
    expect(btree._root.children![2].keys).toEqual([6])
    expect(btree._root.children![2].values).toEqual([16])
  })

  it('deleteKeyWithShift from the leaf, which has only t-1 nodes, and has only left sibling with t nodes, h = 1', () => {
    const btree = new BTree(2)
    btree.addKey(1, 11)
    btree.addKey(2, 12)
    btree.addKey(3, 13)
    btree.addKey(5, 15)
    btree.addKey(6, 16)
    btree.addKey(7, 17)
    btree.addKey(4, 14)
    btree.deleteKeyWithShift(7)

    btree.deleteKeyWithShift(6)

    expect(btree._root.keys).toEqual([2,4])
    expect(btree._root.values).toEqual([12,14])

    expect(btree._root.children![0].shift).toEqual(0)
    expect(btree._root.children![0].keys).toEqual([1])
    expect(btree._root.children![0].values).toEqual([11])

    expect(btree._root.children![1].shift).toEqual(0)
    expect(btree._root.children![1].keys).toEqual([3])
    expect(btree._root.children![1].values).toEqual([13])

    expect(btree._root.children![2].shift).toEqual(0)
    expect(btree._root.children![2].keys).toEqual([5])
    expect(btree._root.children![2].values).toEqual([15])
  })

  it('deleteKeyWithShift from the leaf, which has only t-1 nodes, and has only left sibling with t nodes, h = 1', () => {
    const btree = new BTree(2)
    btree.addKey(1, 11)
    btree.addKey(2, 12)
    btree.addKey(3, 13)
    btree.addKey(5, 15)
    btree.addKey(6, 16)
    btree.addKey(7, 17)
    btree.addKey(4, 14)
    btree.addKeyWithShift(1, 110)
    btree.deleteKeyWithShift(8)

    btree.deleteKeyWithShift(7)

    expect(btree._root.keys).toEqual([3,5])
    expect(btree._root.values).toEqual([12,14])

    expect(btree._root.children![0].shift).toEqual(0)
    expect(btree._root.children![0].keys).toEqual([1,2])
    expect(btree._root.children![0].values).toEqual([110, 11])

    expect(btree._root.children![1].shift).toEqual(1)
    expect(btree._root.children![1].keys).toEqual([3])
    expect(btree._root.children![1].values).toEqual([13])

    expect(btree._root.children![2].shift).toEqual(1)
    expect(btree._root.children![2].keys).toEqual([5])
    expect(btree._root.children![2].values).toEqual([15])
  })

  it('deleteKeyWithShift from the leaf, which has only t-1 nodes, and has right sibling with t-1 nodes, h = 1', () => {
    const btree = new BTree(3)
    btree.addKey(1, 11)
    btree.addKey(2, 12)
    btree.addKey(3, 13)
    btree.addKey(4, 14)
    btree.addKey(5, 15)
    btree.addKey(6, 16)
    btree.addKey(7, 17)
    btree.addKey(8, 18)
    btree.addKey(9, 19)
    btree.deleteKeyWithShift(9)

    btree.deleteKeyWithShift(5)

    expect(btree._root.keys).toEqual([3])
    expect(btree._root.values).toEqual([13])

    expect(btree._root.children![0].keys).toEqual([1,2])
    expect(btree._root.children![0].values).toEqual([11,12])

    expect(btree._root.children![1].keys).toEqual([4,5,6,7])
    expect(btree._root.children![1].values).toEqual([14,16,17,18])

    expect(btree._root.children![2]).toBeUndefined()
  })

  it('deleteKeyWithShift from the leaf, which has only t-1 nodes, and has right sibling with t-1 nodes, and nodes are shifted, h = 1', () => {
    const btree = new BTree(3)
    btree.addKey(1, 11)
    btree.addKey(2, 12)
    btree.addKey(4, 14)
    btree.addKey(5, 15)
    btree.addKey(6, 16)
    btree.addKey(8, 18)
    btree.addKey(9, 19)
    btree.addKey(10, 20)
    btree.addKey(11, 21)
    btree.addKey(3, 13)
    btree.addKey(7, 17)
    btree.deleteKeyWithShift(11)
    btree.deleteKeyWithShift(7)
    btree.deleteKeyWithShift(3)

    expect(btree._root.children![1].shift).toEqual(-1)
    expect(btree._root.children![2].shift).toEqual(-2)

    btree.deleteKeyWithShift(5)

    expect(btree._root.keys).toEqual([3])
    expect(btree._root.values).toEqual([14])

    expect(btree._root.children![0].keys).toEqual([1,2])
    expect(btree._root.children![0].values).toEqual([11,12])

    expect(btree._root.children![1].shift).toEqual(-1)
    expect(btree._root.children![1].keys).toEqual([5,6,7,8])
    expect(btree._root.children![1].values).toEqual([15,18,19,20])

    expect(btree._root.children![2]).toBeUndefined()
  })

  it('deleteKeyWithShift from the leaf, which has only t-1 nodes, and has only left sibling with t-1 nodes, and nodes are shifted, h = 1', () => {
    const btree = new BTree(3)
    btree.addKey(1, 11)
    btree.addKey(2, 12)
    btree.addKey(4, 14)
    btree.addKey(5, 15)
    btree.addKey(6, 16)
    btree.addKey(8, 18)
    btree.addKey(9, 19)
    btree.addKey(10, 20)
    btree.addKey(11, 21)
    btree.addKey(3, 13)
    btree.addKey(7, 17)
    btree.deleteKeyWithShift(11)
    btree.deleteKeyWithShift(7)
    btree.deleteKeyWithShift(3)

    expect(btree._root.children![1].shift).toEqual(-1)
    expect(btree._root.children![2].shift).toEqual(-2)

    btree.deleteKeyWithShift(7)

    expect(btree._root.keys).toEqual([3])
    expect(btree._root.values).toEqual([14])

    expect(btree._root.children![0].keys).toEqual([1,2])
    expect(btree._root.children![0].values).toEqual([11,12])

    expect(btree._root.children![1].shift).toEqual(-1)
    expect(btree._root.children![1].keys).toEqual([5,6,7,8])
    expect(btree._root.children![1].values).toEqual([15,16,18,20])

    expect(btree._root.children![2]).toBeUndefined()
  })
})
