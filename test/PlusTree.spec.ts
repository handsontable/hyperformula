import {PlusTree} from '../src/PlusTree'

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
  })
})
