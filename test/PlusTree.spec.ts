import {Internal, Leaf, PlusTree} from '../src/PlusTree'

function getLeaf<T>(tree: PlusTree<T>, idx0?: number, idx1?: number): Leaf<T> {
  let result = tree._root
  if (idx0 !== undefined) {
    result = (result as Internal<T>).children[idx0]
  }
  if (idx1 !== undefined) {
    result = (result as Internal<T>).children[idx1]
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
      expect(getLeaf(tree, 0).keys).toEqual([1, 2])
      expect(getLeaf(tree, 0).values).toEqual([10, 20])
      expect(getLeaf(tree, 1).keys).toEqual([3, 4])
      expect(getLeaf(tree, 1).values).toEqual([30, 40])
      expect(tree.getKey(2)).toEqual(20)
      expect(tree.getKey(3)).toEqual(30)
    })

    it('should shift other values', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)

      tree.addKeyWithShift(2, 200)

      expect(getLeaf(tree).keys).toEqual([1, 2, 3])
      expect(getLeaf(tree).values).toEqual([10, 200, 20])
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
      expect(getLeaf(tree, 0).keys).toEqual([1, 2, 3])
      expect(getLeaf(tree, 0).values).toEqual([10, 200, 20])
      expect(getLeaf(tree, 1).shift).toBe(1)
      expect(getLeaf(tree, 1).keys).toEqual([3, 4])
      expect(getLeaf(tree, 1).values).toEqual([30, 40])
      expect(tree.getKey(2)).toEqual(200)
      expect(tree.getKey(3)).toEqual(20)
      expect(tree.getKey(4)).toEqual(30)
    })

    it('adding to a shifted node', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(2, 200)

      tree.addKeyWithShift(4, 400)

      expect(tree._root.keys).toEqual([3])
      expect(getLeaf(tree, 1).shift).toBe(1)
      expect(getLeaf(tree, 1).keys).toEqual([3, 4, 5])
      expect(getLeaf(tree, 1).values).toEqual([400, 30, 40])
    })

    it('splitting non-root leaf node', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)

      tree.addKeyWithShift(6, 60)

      expect(tree._root.keys).toEqual([2, 4])
      expect(getLeaf(tree, 1).shift).toBe(0)
      expect(getLeaf(tree, 1).keys).toEqual([3, 4])
      expect(getLeaf(tree, 1).values).toEqual([30, 40])
      expect(getLeaf(tree, 2).shift).toBe(0)
      expect(getLeaf(tree, 2).keys).toEqual([5, 6])
      expect(getLeaf(tree, 2).values).toEqual([50, 60])
    })

    it('splitting non-root leaf node (which is shifted)', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(2, 200)

      tree.addKeyWithShift(7, 70)

      expect(tree._root.keys).toEqual([3, 5])
      expect(getLeaf(tree, 1).shift).toBe(1)
      expect(getLeaf(tree, 1).keys).toEqual([3, 4])
      expect(getLeaf(tree, 1).values).toEqual([30, 40])
      expect(getLeaf(tree, 2).shift).toBe(1)
      expect(getLeaf(tree, 2).keys).toEqual([5, 6])
      expect(getLeaf(tree, 2).values).toEqual([50, 70])
    })

    it('splitting internal root node', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(6, 60)
      tree.addKeyWithShift(7, 70)
      tree.addKeyWithShift(8, 80)
      tree.addKeyWithShift(9, 90)

      tree.addKeyWithShift(10, 100)

      expect(tree._root.keys).toEqual([6])
      expect(getLeaf(tree, 0).keys).toEqual([2, 4])
      expect(getLeaf(tree, 0, 0).keys).toEqual([1, 2])
      expect(getLeaf(tree, 0, 1).keys).toEqual([3, 4])
      expect(getLeaf(tree, 0, 2).keys).toEqual([5, 6])
      expect(getLeaf(tree, 1).keys).toEqual([8])
      expect(getLeaf(tree, 1, 0).keys).toEqual([7, 8])
      expect(getLeaf(tree, 1, 1).keys).toEqual([9, 10])
      expect(getLeaf(tree, 1, 2)).toBeUndefined()
    })

    it('splitting internal node', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(6, 60)
      tree.addKeyWithShift(7, 70)
      tree.addKeyWithShift(8, 80)
      tree.addKeyWithShift(9, 90)
      tree.addKeyWithShift(10, 100)
      tree.addKeyWithShift(11, 110)
      tree.addKeyWithShift(12, 120)
      tree.addKeyWithShift(13, 130)
      tree.addKeyWithShift(14, 140)
      tree.addKeyWithShift(15, 150)
      tree.addKeyWithShift(16, 160)

      //             6                       12
      //   [2     4]          [8     10]                [14]
      // 1,2 | 3,4 | 5,6    7,8 | 9,10 | 11,12     13,14 | 15,16
      expect(tree._root.keys).toEqual([6, 12])
      expect(getLeaf(tree, 1).keys).toEqual([8, 10])
      expect(getLeaf(tree, 1, 0).keys).toEqual([7, 8])
      expect(getLeaf(tree, 1, 1).keys).toEqual([9, 10])
      expect(getLeaf(tree, 1, 2).keys).toEqual([11, 12])
      expect(getLeaf(tree, 2).keys).toEqual([14])
      expect(getLeaf(tree, 2, 0).keys).toEqual([13, 14])
      expect(getLeaf(tree, 2, 1).keys).toEqual([15, 16])
    })

    it('splitting internal node (which is shifted)', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(6, 60)
      tree.addKeyWithShift(7, 70)
      tree.addKeyWithShift(8, 80)
      tree.addKeyWithShift(9, 90)
      tree.addKeyWithShift(10, 100)
      tree.addKeyWithShift(11, 110)
      tree.addKeyWithShift(12, 120)
      tree.addKeyWithShift(13, 130)
      tree.addKeyWithShift(14, 140)
      tree.addKeyWithShift(15, 150)
      tree.addKeyWithShift(6, 600)
      tree.addKeyWithShift(16, 160)

      //             7                       13
      //   [2     4]          [8     10]                [14]
      // 1,2 | 3,4 | 5,6,7    7,8 | 9,10 | 11,12     13,14 | 15,16
      expect(tree._root.keys).toEqual([7, 13])
      expect(getLeaf(tree, 0).shift).toEqual(0)
      expect(getLeaf(tree, 0).keys).toEqual([2, 4])
      expect(getLeaf(tree, 0, 0).keys).toEqual([1, 2])
      expect(getLeaf(tree, 0, 1).keys).toEqual([3, 4])
      expect(getLeaf(tree, 0, 2).keys).toEqual([5, 6, 7])
      expect(getLeaf(tree, 0, 2).values).toEqual([50, 600, 60])
      expect(getLeaf(tree, 1).shift).toEqual(1)
      expect(getLeaf(tree, 1).keys).toEqual([8, 10])
      expect(getLeaf(tree, 1, 0).keys).toEqual([7, 8])
      expect(getLeaf(tree, 1, 1).keys).toEqual([9, 10])
      expect(getLeaf(tree, 1, 2).keys).toEqual([11, 12])
      expect(getLeaf(tree, 2).shift).toEqual(1)
      expect(getLeaf(tree, 2).keys).toEqual([14])
      expect(getLeaf(tree, 2, 0).keys).toEqual([13, 14])
      expect(getLeaf(tree, 2, 1).keys).toEqual([15, 16])
    })

    it('adding key through internal node (shifted)', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(6, 60)
      tree.addKeyWithShift(7, 70)
      tree.addKeyWithShift(8, 80)
      tree.addKeyWithShift(9, 90)
      tree.addKeyWithShift(10, 100)
      tree.addKeyWithShift(4, 400)

      tree.addKeyWithShift(9, 900)

      expect(tree._root.keys).toEqual([7])
      expect(getLeaf(tree, 1).shift).toEqual(1)
      expect(getLeaf(tree, 1, 0).keys).toEqual([7, 8, 9])
      expect(getLeaf(tree, 1, 0).values).toEqual([70, 900, 80])
      expect(getLeaf(tree, 1, 1).keys).toEqual([9, 10])
      expect(getLeaf(tree, 1, 2)).toBeUndefined()
    })
  })

  describe('#addKeyWithoutShift', () => {
    it('raise error when key exists', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)

      expect(() => {
        tree.addKeyWithoutShift(1, 100)
      }).toThrow('Cant add without shift if key already exists')
    })

    it('do not shift other values', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)

      tree.addKeyWithoutShift(1, 10)

      expect(getLeaf(tree).keys).toEqual([1, 2, 3])
      expect(getLeaf(tree).values).toEqual([10, 20, 30])
    })

    it('does not increase siblings shift', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)

      tree.addKeyWithoutShift(1, 10)

      expect(getLeaf(tree).keys).toEqual([3])
      expect(getLeaf(tree, 0).keys).toEqual([1, 2, 3])
      expect(getLeaf(tree, 0).values).toEqual([10, 20, 30])
      expect(getLeaf(tree, 1).shift).toEqual(0)
    })
  })

  describe('#deleteKeyWithShift', () => {
    it('delete from single root node', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(42, 78)

      tree.deleteKeyWithShift(42)

      expect(tree.getKey(42)).toEqual(null)
      expect(getLeaf(tree).keys).toEqual([])
      expect(getLeaf(tree).values).toEqual([])
    })

    it('deleting decrements other keys', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)

      tree.deleteKeyWithShift(1)

      expect(getLeaf(tree).keys).toEqual([1])
      expect(getLeaf(tree).values).toEqual([20])
    })

    it('even if theres no key, we decrement', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(3, 30)

      tree.deleteKeyWithShift(2)

      expect(getLeaf(tree).keys).toEqual([1, 2])
      expect(getLeaf(tree).values).toEqual([10, 30])
    })

    it('delete key from leaf node', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)

      tree.deleteKeyWithShift(2)

      expect(getLeaf(tree).keys).toEqual([1])
      expect(getLeaf(tree, 0).keys).toEqual([1])
      expect(getLeaf(tree, 0).values).toEqual([10])
      expect(getLeaf(tree, 1).shift).toEqual(-1)
      expect(getLeaf(tree, 1).keys).toEqual([3, 4])
      expect(getLeaf(tree, 1).values).toEqual([30, 40])
    })

    it('delete key from last leaf node', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)

      tree.deleteKeyWithShift(3)

      expect(getLeaf(tree).keys).toEqual([2])
      expect(getLeaf(tree, 0).shift).toEqual(0)
      expect(getLeaf(tree, 0).keys).toEqual([1, 2])
      expect(getLeaf(tree, 0).values).toEqual([10, 20])
      expect(getLeaf(tree, 1).shift).toEqual(0)
      expect(getLeaf(tree, 1).keys).toEqual([3])
      expect(getLeaf(tree, 1).values).toEqual([40])
    })

    it('delete key from shifted node', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(2, 200)

      tree.deleteKeyWithShift(4)

      expect(getLeaf(tree).keys).toEqual([3])
      expect(getLeaf(tree, 0).shift).toEqual(0)
      expect(getLeaf(tree, 0).keys).toEqual([1, 2, 3])
      expect(getLeaf(tree, 0).values).toEqual([10, 200, 20])
      expect(getLeaf(tree, 1).shift).toEqual(1)
      expect(getLeaf(tree, 1).keys).toEqual([3])
      expect(getLeaf(tree, 1).values).toEqual([40])
    })

    it('delete key with internal shifted node', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(6, 60)
      tree.addKeyWithShift(7, 70)
      tree.addKeyWithShift(8, 80)
      tree.addKeyWithShift(9, 90)
      tree.addKeyWithShift(10, 100)
      tree.addKeyWithShift(4, 400)
      //               7
      //     [2       5]         [8]
      // [1 2] [3 4 5] [5 6] [7 8] [9 10]

      tree.deleteKeyWithShift(9)

      expect(getLeaf(tree).keys).toEqual([7])
      expect(getLeaf(tree, 0).shift).toEqual(0)
      expect(getLeaf(tree, 0).keys).toEqual([2, 5])
      expect(getLeaf(tree, 1).shift).toEqual(1)
      expect(getLeaf(tree, 1).keys).toEqual([7])
      expect(getLeaf(tree, 1, 0).shift).toEqual(0)
      expect(getLeaf(tree, 1, 0).keys).toEqual([7])
      expect(getLeaf(tree, 1, 0).values).toEqual([70])
    })

    it('merge with right sibling if it has minSize elements', () => {
      const tree: PlusTree<number> = PlusTree.empty(3)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(6, 60)
      tree.addKeyWithShift(7, 70)
      tree.addKeyWithShift(8, 80)
      tree.addKeyWithShift(9, 90)
      tree.deleteKeyWithShift(9)
      tree.deleteKeyWithShift(6)

      tree.deleteKeyWithShift(5)

      expect(getLeaf(tree).keys).toEqual([3])
      expect(getLeaf(tree, 0).keys).toEqual([1, 2, 3])
      expect(getLeaf(tree, 0).values).toEqual([10, 20, 30])
      expect(getLeaf(tree, 1).shift).toEqual(0)
      expect(getLeaf(tree, 1).keys).toEqual([4, 5, 6])
      expect(getLeaf(tree, 1).values).toEqual([40, 70, 80])
      expect(getLeaf(tree, 2)).toBeUndefined()
    })

    it('merge with right sibling if it has minSize elements and childNode is shifted', () => {
      const tree: PlusTree<number> = PlusTree.empty(3)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(6, 60)
      tree.addKeyWithShift(7, 70)
      tree.addKeyWithShift(8, 80)
      tree.addKeyWithShift(9, 90)
      tree.deleteKeyWithShift(9)
      tree.deleteKeyWithShift(6)
      tree.deleteKeyWithShift(1)

      tree.deleteKeyWithShift(4)

      expect(getLeaf(tree).keys).toEqual([2])
      expect(getLeaf(tree, 0).keys).toEqual([1, 2])
      expect(getLeaf(tree, 0).values).toEqual([20, 30])
      expect(getLeaf(tree, 1).shift).toEqual(-1)
      expect(getLeaf(tree, 1).keys).toEqual([4, 5, 6])
      expect(getLeaf(tree, 1).values).toEqual([40, 70, 80])
      expect(getLeaf(tree, 2)).toBeUndefined()
    })

    it('merge with left sibling if it has minSize elements', () => {
      const tree: PlusTree<number> = PlusTree.empty(3)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(6, 60)
      tree.addKeyWithShift(7, 70)
      tree.addKeyWithShift(8, 80)
      tree.addKeyWithShift(9, 90)
      tree.deleteKeyWithShift(9)
      tree.deleteKeyWithShift(6)

      tree.deleteKeyWithShift(7)

      expect(getLeaf(tree).keys).toEqual([3])
      expect(getLeaf(tree, 0).keys).toEqual([1, 2, 3])
      expect(getLeaf(tree, 0).values).toEqual([10, 20, 30])
      expect(getLeaf(tree, 1).shift).toEqual(0)
      expect(getLeaf(tree, 1).keys).toEqual([4, 5, 6])
      expect(getLeaf(tree, 1).values).toEqual([40, 50, 70])
      expect(getLeaf(tree, 2)).toBeUndefined()
    })

    it('pulls one element from right sibling', () => {
      const tree: PlusTree<number> = PlusTree.empty(3)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(6, 60)
      tree.addKeyWithShift(7, 70)
      tree.addKeyWithShift(8, 80)
      tree.addKeyWithShift(9, 90)
      tree.deleteKeyWithShift(6)

      tree.deleteKeyWithShift(5)

      expect(getLeaf(tree).keys).toEqual([3, 5])
      expect(getLeaf(tree, 0).keys).toEqual([1, 2, 3])
      expect(getLeaf(tree, 0).values).toEqual([10, 20, 30])
      expect(getLeaf(tree, 1).shift).toEqual(0)
      expect(getLeaf(tree, 1).keys).toEqual([4, 5])
      expect(getLeaf(tree, 1).values).toEqual([40, 70])
      expect(getLeaf(tree, 2).shift).toEqual(-2)
      expect(getLeaf(tree, 2).keys).toEqual([8, 9])
      expect(getLeaf(tree, 2).values).toEqual([80, 90])
    })

    it('pulls one element from right sibling, child is shifted', () => {
      const tree: PlusTree<number> = PlusTree.empty(3)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(6, 60)
      tree.addKeyWithShift(7, 70)
      tree.addKeyWithShift(8, 80)
      tree.addKeyWithShift(9, 90)
      tree.deleteKeyWithShift(6)
      tree.addKeyWithShift(1, 100)

      tree.deleteKeyWithShift(6)

      expect(getLeaf(tree).keys).toEqual([4, 6])
      expect(getLeaf(tree, 0).keys).toEqual([1, 2, 3, 4])
      expect(getLeaf(tree, 0).values).toEqual([100, 10, 20, 30])
      expect(getLeaf(tree, 1).shift).toEqual(1)
      expect(getLeaf(tree, 1).keys).toEqual([4, 5])
      expect(getLeaf(tree, 1).values).toEqual([40, 70])
      expect(getLeaf(tree, 2).shift).toEqual(-1)
      expect(getLeaf(tree, 2).keys).toEqual([8, 9])
      expect(getLeaf(tree, 2).values).toEqual([80, 90])
    })

    it('pulls one element from left sibling', () => {
      const tree: PlusTree<number> = PlusTree.empty(3)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(6, 60)
      tree.deleteKeyWithShift(6)

      tree.deleteKeyWithShift(5)

      expect(getLeaf(tree).keys).toEqual([2])
      expect(getLeaf(tree, 0).keys).toEqual([1, 2])
      expect(getLeaf(tree, 0).values).toEqual([10, 20])
      expect(getLeaf(tree, 1).keys).toEqual([3, 4])
      expect(getLeaf(tree, 1).values).toEqual([30, 40])
    })

    it('pulls one element from left sibling, child is shifted', () => {
      const tree: PlusTree<number> = PlusTree.empty(3)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(6, 60)
      tree.addKeyWithShift(7, 70)
      tree.addKeyWithShift(8, 80)
      tree.addKeyWithShift(9, 90)
      tree.deleteKeyWithShift(9)
      tree.deleteKeyWithShift(3)
      tree.addKeyWithShift(3, 300)

      tree.deleteKeyWithShift(8)

      expect(getLeaf(tree).keys).toEqual([2, 5])
      expect(getLeaf(tree, 0).keys).toEqual([1, 2])
      expect(getLeaf(tree, 0).values).toEqual([10, 20])
      expect(getLeaf(tree, 1).shift).toEqual(-1)
      expect(getLeaf(tree, 1).keys).toEqual([4, 5, 6])
      expect(getLeaf(tree, 1).values).toEqual([300, 40, 50])
      expect(getLeaf(tree, 2).shift).toEqual(0)
      expect(getLeaf(tree, 2).keys).toEqual([6, 7])
      expect(getLeaf(tree, 2).values).toEqual([60, 70])
    })

    it('merging internal node (shifted) with right sibling', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(6, 60)
      tree.addKeyWithShift(7, 70)
      tree.addKeyWithShift(8, 80)
      tree.addKeyWithShift(9, 90)
      tree.addKeyWithShift(10, 100)
      tree.addKeyWithShift(11, 110)
      tree.addKeyWithShift(12, 120)
      tree.addKeyWithShift(13, 130)
      tree.addKeyWithShift(14, 140)
      tree.addKeyWithShift(15, 150)
      tree.addKeyWithShift(16, 160)
      tree.deleteKeyWithShift(12)
      tree.deleteKeyWithShift(11)
      tree.deleteKeyWithShift(10)
      tree.deleteKeyWithShift(9)
      tree.deleteKeyWithShift(6)
      //              5            7
      //   [2     4]      [7]^-1       [14]^(-5)
      // 1,2 | 3,4 | 5    7 | 8     13,14 | 15,16

      tree.deleteKeyWithShift(7)

      //             5
      //   [2     4]        [7      9]^-1
      // 1,2 | 3,4 | 5    7 | 13,14 | 15,16
      expect(tree._root.keys).toEqual([5])
      expect(getLeaf(tree, 1).shift).toEqual(-1)
      expect(getLeaf(tree, 1).keys).toEqual([7, 9])
      expect(getLeaf(tree, 1, 0).shift).toEqual(0)
      expect(getLeaf(tree, 1, 0).keys).toEqual([7])
      expect(getLeaf(tree, 1, 1).shift).toEqual(-5)
      expect(getLeaf(tree, 1, 1).keys).toEqual([13, 14])
      expect(getLeaf(tree, 1, 2).shift).toEqual(-5)
      expect(getLeaf(tree, 1, 2).keys).toEqual([15, 16])
      expect(getLeaf(tree, 2)).toBeUndefined()
    })

    it('merging internal node with right sibling', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(6, 60)
      tree.addKeyWithShift(7, 70)
      tree.addKeyWithShift(8, 80)
      tree.addKeyWithShift(9, 90)
      tree.addKeyWithShift(10, 100)
      tree.addKeyWithShift(11, 110)
      tree.addKeyWithShift(12, 120)
      tree.addKeyWithShift(13, 130)
      tree.addKeyWithShift(14, 140)
      tree.addKeyWithShift(15, 150)
      tree.addKeyWithShift(16, 160)
      tree.deleteKeyWithShift(12)
      tree.deleteKeyWithShift(11)
      tree.deleteKeyWithShift(10)
      tree.deleteKeyWithShift(9)
      //             6            8
      //   [2     4]        [7]          [14]^(-4)
      // 1,2 | 3,4 | 5,6    7 | 8     13,14 | 15,16

      tree.deleteKeyWithShift(8)

      //             6
      //   [2     4]        [7      9]
      // 1,2 | 3,4 | 5,6    7 | 13,14 | 15,16
      expect(tree._root.keys).toEqual([6])
      expect(getLeaf(tree, 1).shift).toEqual(0)
      expect(getLeaf(tree, 1).keys).toEqual([7, 9])
      expect(getLeaf(tree, 1, 0).shift).toEqual(0)
      expect(getLeaf(tree, 1, 0).keys).toEqual([7])
      expect(getLeaf(tree, 1, 1).shift).toEqual(-5)
      expect(getLeaf(tree, 1, 1).keys).toEqual([13, 14])
      expect(getLeaf(tree, 1, 2).shift).toEqual(-5)
      expect(getLeaf(tree, 1, 2).keys).toEqual([15, 16])
      expect(getLeaf(tree, 2)).toBeUndefined()
    })

    it('merging internal node with right sibling, leaf nodes are shifted', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(6, 60)
      tree.addKeyWithShift(7, 70)
      tree.addKeyWithShift(8, 80)
      tree.addKeyWithShift(1, 100)
      tree.addKeyWithShift(10, 100)
      tree.addKeyWithShift(11, 110)
      tree.addKeyWithShift(12, 120)
      tree.addKeyWithShift(13, 130)
      tree.addKeyWithShift(14, 140)
      tree.addKeyWithShift(15, 150)
      tree.addKeyWithShift(16, 160)
      tree.addKeyWithShift(17, 170)
      //                    7                                     13
      //      3       5                   9         11                  15
      // 1,2,3 | 3,4^1 | 5,6^1       7,8^1 | 9,10^1 | 11,12^1     13,14^1 | 15,16^1
      tree.deleteKeyWithShift(13)
      tree.deleteKeyWithShift(12)
      tree.deleteKeyWithShift(11)
      tree.deleteKeyWithShift(10)
      //                    7                       9
      //      3       5                 8                 15^-4
      // 1,2,3 | 3,4^1 | 5,6^1       7^1 | 8^1      13,14^1 | 15,16^1

      tree.deleteKeyWithShift(9)

      //                    7
      //      3       5                 8         10
      // 1,2,3 | 3,4^1 | 5,6^1       7^1 | 13,14^-4 | 15,16^-4
      expect(tree._root.keys).toEqual([7])
      expect(getLeaf(tree, 0).shift).toEqual(0)
      expect(getLeaf(tree, 0).keys).toEqual([3, 5])
      expect(getLeaf(tree, 0, 0).shift).toEqual(0)
      expect(getLeaf(tree, 0, 0).keys).toEqual([1, 2, 3])
      expect(getLeaf(tree, 0, 1).shift).toEqual(1)
      expect(getLeaf(tree, 0, 1).keys).toEqual([3, 4])
      expect(getLeaf(tree, 0, 2).shift).toEqual(1)
      expect(getLeaf(tree, 0, 2).keys).toEqual([5, 6])
      expect(getLeaf(tree, 1).shift).toEqual(0)
      expect(getLeaf(tree, 1).keys).toEqual([8, 10])
      expect(getLeaf(tree, 1, 0).shift).toEqual(1)
      expect(getLeaf(tree, 1, 0).keys).toEqual([7])
      expect(getLeaf(tree, 1, 1).shift).toEqual(-4)
      expect(getLeaf(tree, 1, 1).keys).toEqual([13, 14])
      expect(getLeaf(tree, 1, 2).shift).toEqual(-4)
      expect(getLeaf(tree, 1, 2).keys).toEqual([15, 16])
      expect(getLeaf(tree, 2)).toBeUndefined()
    })

    it('pulling from right internal node', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(6, 60)
      tree.addKeyWithShift(7, 70)
      tree.addKeyWithShift(8, 80)
      tree.addKeyWithShift(9, 90)
      tree.addKeyWithShift(10, 100)
      tree.addKeyWithShift(11, 110)
      tree.addKeyWithShift(12, 120)
      tree.addKeyWithShift(13, 130)
      tree.addKeyWithShift(14, 140)
      tree.addKeyWithShift(15, 150)
      tree.addKeyWithShift(16, 160)
      tree.addKeyWithShift(17, 170)
      tree.addKeyWithShift(18, 180)
      //             6                       12
      //   [2     4]          [8     10]                [14     16]
      // 1,2 | 3,4 | 5,6    7,8 | 9,10 | 11,12     13,14 | 15,16 | 17,18
      tree.deleteKeyWithShift(12)
      tree.deleteKeyWithShift(11)
      tree.deleteKeyWithShift(10)
      tree.deleteKeyWithShift(9)
      tree.deleteKeyWithShift(8)

      //             6                     9
      //   [2     4]        [7]                [16]^-5
      // 1,2 | 3,4 | 5,6    7 | 13,14^-5     15,16 | 17,18
      expect(tree._root.keys).toEqual([6, 9])
      expect(getLeaf(tree, 1).shift).toEqual(0)
      expect(getLeaf(tree, 1).keys).toEqual([7])
      expect(getLeaf(tree, 1, 0).shift).toEqual(0)
      expect(getLeaf(tree, 1, 0).keys).toEqual([7])
      expect(getLeaf(tree, 1, 1).shift).toEqual(-5)
      expect(getLeaf(tree, 1, 1).keys).toEqual([13, 14])
      expect(getLeaf(tree, 2).shift).toEqual(-5)
      expect(getLeaf(tree, 2).keys).toEqual([16])
      expect(getLeaf(tree, 2, 0).shift).toEqual(0)
      expect(getLeaf(tree, 2, 0).keys).toEqual([15, 16])
      expect(getLeaf(tree, 2, 1).shift).toEqual(0)
      expect(getLeaf(tree, 2, 1).keys).toEqual([17, 18])
    })

    it('pulling from left internal node', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)
      tree.addKeyWithShift(6, 60)
      tree.addKeyWithShift(7, 70)
      tree.addKeyWithShift(8, 80)
      tree.addKeyWithShift(9, 90)
      tree.addKeyWithShift(10, 100)
      tree.addKeyWithShift(11, 110)
      tree.addKeyWithShift(12, 120)
      tree.addKeyWithShift(13, 130)
      tree.addKeyWithShift(14, 140)
      tree.addKeyWithShift(15, 150)
      tree.addKeyWithShift(16, 160)
      // tree.addKeyWithShift(17, 170)
      // tree.addKeyWithShift(18, 180)
      //             6                       12
      //   [2     4]          [8     10]                [14]
      // 1,2 | 3,4 | 5,6    7,8 | 9,10 | 11,12     13,14 | 15,16
      tree.deleteKeyWithShift(16)
      tree.deleteKeyWithShift(15)
      tree.deleteKeyWithShift(14)
      // tree.deleteKeyWithShift(9)
      // tree.deleteKeyWithShift(8)

      //             6                10
      //   [2     4]          [8]             [12]
      // 1,2 | 3,4 | 5,6    7,8 | 9,10     11,12 | 13
      expect(tree._root.keys).toEqual([6, 10])
      expect(getLeaf(tree, 1).shift).toEqual(0)
      expect(getLeaf(tree, 1).keys).toEqual([8])
      expect(getLeaf(tree, 1, 0).shift).toEqual(0)
      expect(getLeaf(tree, 1, 0).keys).toEqual([7, 8])
      expect(getLeaf(tree, 1, 1).shift).toEqual(0)
      expect(getLeaf(tree, 1, 1).keys).toEqual([9, 10])
      expect(getLeaf(tree, 2).shift).toEqual(0)
      expect(getLeaf(tree, 2).keys).toEqual([12])
      expect(getLeaf(tree, 2, 0).shift).toEqual(0)
      expect(getLeaf(tree, 2, 0).keys).toEqual([11, 12])
      expect(getLeaf(tree, 2, 1).shift).toEqual(0)
      expect(getLeaf(tree, 2, 1).keys).toEqual([13])
    })

    it('root node collapses', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.deleteKeyWithShift(4)
      tree.deleteKeyWithShift(3)
      tree.deleteKeyWithShift(2)

      expect(getLeaf(tree).keys).toEqual([1])
      expect(getLeaf(tree).values).toEqual([10])
    })
  })

  describe('#values', () => {
    it('empty tree', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)

      expect(Array.from(tree.values())).toEqual([])
    })

    it('with two keys', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(42, 78)
      tree.addKeyWithShift(43, 79)

      expect(Array.from(tree.values())).toEqual([78, 79])
    })

    it('order of insertion does not matter', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(43, 79)
      tree.addKeyWithShift(42, 78)

      expect(Array.from(tree.values())).toEqual([78, 79])
    })

    it('with 2 levels', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 11)
      tree.addKeyWithShift(2, 12)
      tree.addKeyWithShift(3, 13)
      tree.addKeyWithShift(4, 14)
      tree.addKeyWithShift(1, 100)

      expect(Array.from(tree.values())).toEqual([100, 11, 12, 13, 14])
    })
  })

  describe('#entries', () => {
    it('empty tree', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)

      expect(Array.from(tree.entries())).toEqual([])
    })

    it('with two keys', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(42, 78)
      tree.addKeyWithShift(43, 79)

      expect(Array.from(tree.entries())).toEqual([[42, 78], [43, 79]])
    })

    it('order of insertion does not matter', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(43, 79)
      tree.addKeyWithShift(42, 78)

      expect(Array.from(tree.entries())).toEqual([[42, 78], [44, 79]])
    })

    it('with 2 levels, one leaf is shifted', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 11)
      tree.addKeyWithShift(2, 12)
      tree.addKeyWithShift(3, 13)
      tree.addKeyWithShift(4, 14)
      tree.addKeyWithShift(1, 100)

      expect(Array.from(tree.entries())).toEqual([
        [1, 100],
        [2, 11],
        [3, 12],
        [4, 13],
        [5, 14],
      ])
    })

    it('with 3 levels, with some internal node having shift', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 11)
      tree.addKeyWithShift(2, 12)
      tree.addKeyWithShift(3, 13)
      tree.addKeyWithShift(4, 14)
      tree.addKeyWithShift(5, 15)
      tree.addKeyWithShift(6, 16)
      tree.addKeyWithShift(7, 17)
      tree.addKeyWithShift(8, 18)
      tree.addKeyWithShift(9, 19)
      tree.addKeyWithShift(10, 20)
      tree.addKeyWithShift(1, 100)

      expect(Array.from(tree.entries())).toEqual([
        [1, 100],
        [2, 11],
        [3, 12],
        [4, 13],
        [5, 14],
        [6, 15],
        [7, 16],
        [8, 17],
        [9, 18],
        [10, 19],
        [11, 20],
      ])
    })
  })

  describe('#entriesFromKeyRange', () => {
    it('empty tree', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)

      expect(Array.from(tree.entriesFromKeyRange(10, 20))).toEqual([])
    })

    it('theres no key bigger than smallest key in leaf', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(10, 100)

      expect(Array.from(tree.entriesFromKeyRange(20, 30))).toEqual([])
    })

    it('includes key bigger or equal than minKey', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(40, 400)
      tree.addKeyWithShift(42, 420)
      tree.addKeyWithShift(43, 430)

      expect(Array.from(tree.entriesFromKeyRange(42, 50))).toEqual([[42, 420], [43, 430]])
    })

    it('includes key smaller or equal than maxKey', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(40, 400)
      tree.addKeyWithShift(42, 420)
      tree.addKeyWithShift(43, 430)

      expect(Array.from(tree.entriesFromKeyRange(0, 42))).toEqual([[40, 400], [42, 420]])
    })

    it('ensure that it does not go deep into unnecessary child from beginning', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 11)
      tree.addKeyWithShift(2, 12)
      tree.addKeyWithShift(3, 13)
      tree.addKeyWithShift(4, 14)
      tree.addKeyWithShift(5, 15)
      tree.addKeyWithShift(6, 16)

      const entriesFromKeyRangeRecursiveSpy = jest.spyOn(tree as any, 'entriesFromKeyRangeRecursive')
      expect(Array.from(tree.entriesFromKeyRange(3, 100))).toEqual([[3, 13], [4, 14], [5, 15], [6, 16]])
      expect(entriesFromKeyRangeRecursiveSpy).toHaveBeenCalledTimes(3)
    })

    it('ensure that it does not go deep into unnecessary child from beginning, when theres no key in root with bigger value', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 11)
      tree.addKeyWithShift(2, 12)
      tree.addKeyWithShift(3, 13)
      tree.addKeyWithShift(4, 14)

      const entriesFromKeyRangeRecursiveSpy = jest.spyOn(tree as any, 'entriesFromKeyRangeRecursive')
      expect(Array.from(tree.entriesFromKeyRange(3, 100))).toEqual([[3, 13], [4, 14]])
      expect(entriesFromKeyRangeRecursiveSpy).toHaveBeenCalledTimes(2)
    })

    it('ensure that it does not go deep into unnecessary child from the end', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 11)
      tree.addKeyWithShift(2, 12)
      tree.addKeyWithShift(3, 13)
      tree.addKeyWithShift(4, 14)

      const entriesFromKeyRangeRecursiveSpy = jest.spyOn(tree as any, 'entriesFromKeyRangeRecursive')
      expect(Array.from(tree.entriesFromKeyRange(0, 2))).toEqual([[1, 11], [2, 12]])
      expect(entriesFromKeyRangeRecursiveSpy).toHaveBeenCalledTimes(2)
    })

    it('includes key bigger or equal than minKey, when node is shifted', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(40, 400)
      tree.addKeyWithShift(42, 420)
      tree.addKeyWithShift(43, 430)
      tree.addKeyWithShift(1, 1000)

      expect(Array.from(tree.entriesFromKeyRange(43, 50))).toEqual([[43, 420], [44, 430]])
    })

    it('includes key smaller or equal than maxKey, when node is shifted', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(40, 400)
      tree.addKeyWithShift(42, 420)
      tree.addKeyWithShift(43, 430)
      tree.addKeyWithShift(1, 1000)

      expect(Array.from(tree.entriesFromKeyRange(20, 43))).toEqual([[41, 400], [43, 420]])
    })

    it('works with three levels', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 11)
      tree.addKeyWithShift(2, 12)
      tree.addKeyWithShift(3, 13)
      tree.addKeyWithShift(4, 14)
      tree.addKeyWithShift(5, 15)
      tree.addKeyWithShift(6, 16)
      tree.addKeyWithShift(7, 17)
      tree.addKeyWithShift(8, 18)
      tree.addKeyWithShift(9, 19)
      tree.addKeyWithShift(10, 20)
      tree.addKeyWithShift(1, 1000)

      expect(Array.from(tree.entriesFromKeyRange(10, 11))).toEqual([[10, 19], [11, 20]])
    })
  })
})
