import {PlusTree, Leaf, Internal} from '../src/PlusTree'

function getLeaf<T>(tree: PlusTree<T>, idx0?: number): Leaf<T> {
  let result = tree._root
  if (idx0 !== undefined) {
    result = (result as Internal<T>).children[idx0]
  }
  return result as Leaf<T>
}

describe('PlusTree', () => {
  it('initialize empty tree', () => {
    const tree = PlusTree.empty(2)

    expect(tree.getKey(42)).toEqual(null)
  })

  describe('#addKeyWithShift', () => {
    it('to empty tree', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)

      tree.addKeyWithShift(42, 78)

      expect(tree.getKey(42)).toEqual(78)
    })

    it('adding bigger key than there already is', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(42, 78)

      tree.addKeyWithShift(43, 79)

      expect(tree.getKey(43)).toEqual(79)
    })

    it('adding smaller key than there already is', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(43, 430)

      tree.addKeyWithShift(42, 420)

      expect(tree.getKey(42)).toEqual(420)
      expect(tree.getKey(44)).toEqual(430)
    })

    it('leading to split of root node', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)

      tree.addKeyWithShift(4, 40)

      expect(tree._root.keys).toEqual([2])
      expect(getLeaf(tree, 0).keys).toEqual([1,2])
      expect(getLeaf(tree, 0).values).toEqual([10,20])
      expect(getLeaf(tree, 1).keys).toEqual([3,4])
      expect(getLeaf(tree, 1).values).toEqual([30,40])
      expect(tree.getKey(2)).toEqual(20)
      expect(tree.getKey(3)).toEqual(30)
    })

    it('should shift other values', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)

      tree.addKeyWithShift(2, 200)

      expect(getLeaf(tree).keys).toEqual([1,2,3])
      expect(getLeaf(tree).values).toEqual([10,200,20])
    })

    it('adding increments shift of right sibling', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)

      tree.addKeyWithShift(2, 200)

      expect(tree._root.keys).toEqual([3])
      expect(getLeaf(tree, 0).shift).toBe(0)
      expect(getLeaf(tree, 0).keys).toEqual([1,2,3])
      expect(getLeaf(tree, 0).values).toEqual([10,200,20])
      expect(getLeaf(tree, 1).shift).toBe(1)
      expect(getLeaf(tree, 1).keys).toEqual([3,4])
      expect(getLeaf(tree, 1).values).toEqual([30,40])
      expect(tree.getKey(2)).toEqual(200)
      expect(tree.getKey(3)).toEqual(20)
      expect(tree.getKey(4)).toEqual(30)
    })
  })
})
