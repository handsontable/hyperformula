import {PlusTree, Leaf, Internal} from '../src/PlusTree'

function getLeaf<T>(tree: PlusTree<T>, idx0: number): Leaf<T> {
  return (tree._root as Internal<T>).children[idx0] as Leaf<T>
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
      expect(tree.getKey(43)).toEqual(430)
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
  })
})
