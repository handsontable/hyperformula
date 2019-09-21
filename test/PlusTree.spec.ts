import {PlusTree, Leaf, Internal} from '../src/PlusTree'

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
      expect(getLeaf(tree, 1).keys).toEqual([3,4,5])
      expect(getLeaf(tree, 1).values).toEqual([400,30,40])
    })

    it('splitting non-root leaf node', () => {
      const tree: PlusTree<number> = PlusTree.empty(2)
      tree.addKeyWithShift(1, 10)
      tree.addKeyWithShift(2, 20)
      tree.addKeyWithShift(3, 30)
      tree.addKeyWithShift(4, 40)
      tree.addKeyWithShift(5, 50)

      tree.addKeyWithShift(6, 60)

      expect(tree._root.keys).toEqual([2,4])
      expect(getLeaf(tree, 1).shift).toBe(0)
      expect(getLeaf(tree, 1).keys).toEqual([3,4])
      expect(getLeaf(tree, 1).values).toEqual([30,40])
      expect(getLeaf(tree, 2).shift).toBe(0)
      expect(getLeaf(tree, 2).keys).toEqual([5,6])
      expect(getLeaf(tree, 2).values).toEqual([50,60])
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

      expect(tree._root.keys).toEqual([3,5])
      expect(getLeaf(tree, 1).shift).toBe(1)
      expect(getLeaf(tree, 1).keys).toEqual([3,4])
      expect(getLeaf(tree, 1).values).toEqual([30,40])
      expect(getLeaf(tree, 2).shift).toBe(1)
      expect(getLeaf(tree, 2).keys).toEqual([5,6])
      expect(getLeaf(tree, 2).values).toEqual([50,70])
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
      expect(getLeaf(tree, 0).keys).toEqual([2,4])
      expect(getLeaf(tree, 0, 0).keys).toEqual([1,2])
      expect(getLeaf(tree, 0, 1).keys).toEqual([3,4])
      expect(getLeaf(tree, 0, 2).keys).toEqual([5,6])
      expect(getLeaf(tree, 1).keys).toEqual([8])
      expect(getLeaf(tree, 1, 0).keys).toEqual([7,8])
      expect(getLeaf(tree, 1, 1).keys).toEqual([9,10])
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
      //1,2 | 3,4 | 5,6    7,8 | 9,10 | 11,12     13,14 | 15,16
      expect(tree._root.keys).toEqual([6,12])
      expect(getLeaf(tree, 1).keys).toEqual([8,10])
      expect(getLeaf(tree, 1, 0).keys).toEqual([7,8])
      expect(getLeaf(tree, 1, 1).keys).toEqual([9,10])
      expect(getLeaf(tree, 1, 2).keys).toEqual([11,12])
      expect(getLeaf(tree, 2).keys).toEqual([14])
      expect(getLeaf(tree, 2, 0).keys).toEqual([13,14])
      expect(getLeaf(tree, 2, 1).keys).toEqual([15,16])
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
      //1,2 | 3,4 | 5,6,7    7,8 | 9,10 | 11,12     13,14 | 15,16
      expect(tree._root.keys).toEqual([7,13])
      expect(getLeaf(tree, 0).shift).toEqual(0)
      expect(getLeaf(tree, 0).keys).toEqual([2,4])
      expect(getLeaf(tree, 0, 0).keys).toEqual([1,2])
      expect(getLeaf(tree, 0, 1).keys).toEqual([3,4])
      expect(getLeaf(tree, 0, 2).keys).toEqual([5,6,7])
      expect(getLeaf(tree, 0, 2).values).toEqual([50,600,60])
      expect(getLeaf(tree, 1).shift).toEqual(1)
      expect(getLeaf(tree, 1).keys).toEqual([8,10])
      expect(getLeaf(tree, 1, 0).keys).toEqual([7,8])
      expect(getLeaf(tree, 1, 1).keys).toEqual([9,10])
      expect(getLeaf(tree, 1, 2).keys).toEqual([11,12])
      expect(getLeaf(tree, 2).shift).toEqual(1)
      expect(getLeaf(tree, 2).keys).toEqual([14])
      expect(getLeaf(tree, 2, 0).keys).toEqual([13,14])
      expect(getLeaf(tree, 2, 1).keys).toEqual([15,16])
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
      expect(getLeaf(tree, 1, 0).keys).toEqual([7,8,9])
      expect(getLeaf(tree, 1, 0).values).toEqual([70,900,80])
      expect(getLeaf(tree, 1, 1).keys).toEqual([9,10])
      expect(getLeaf(tree, 1, 2)).toBeUndefined()
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

      expect(getLeaf(tree).keys).toEqual([1,2])
      expect(getLeaf(tree).values).toEqual([10,30])
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
      expect(getLeaf(tree, 1).keys).toEqual([3,4])
      expect(getLeaf(tree, 1).values).toEqual([30,40])
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
      expect(getLeaf(tree, 0).keys).toEqual([1,2])
      expect(getLeaf(tree, 0).values).toEqual([10,20])
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
      expect(getLeaf(tree, 0).keys).toEqual([1,2,3])
      expect(getLeaf(tree, 0).values).toEqual([10,200,20])
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
      expect(getLeaf(tree, 0).keys).toEqual([2,5])
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
      expect(getLeaf(tree, 0).keys).toEqual([1,2,3])
      expect(getLeaf(tree, 0).values).toEqual([10,20,30])
      expect(getLeaf(tree, 1).shift).toEqual(0)
      expect(getLeaf(tree, 1).keys).toEqual([4,5,6])
      expect(getLeaf(tree, 1).values).toEqual([40,70,80])
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
      expect(getLeaf(tree, 0).keys).toEqual([1,2])
      expect(getLeaf(tree, 0).values).toEqual([20,30])
      expect(getLeaf(tree, 1).shift).toEqual(-1)
      expect(getLeaf(tree, 1).keys).toEqual([4,5,6])
      expect(getLeaf(tree, 1).values).toEqual([40,70,80])
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
      expect(getLeaf(tree, 0).keys).toEqual([1,2,3])
      expect(getLeaf(tree, 0).values).toEqual([10,20,30])
      expect(getLeaf(tree, 1).shift).toEqual(0)
      expect(getLeaf(tree, 1).keys).toEqual([4,5,6])
      expect(getLeaf(tree, 1).values).toEqual([40,50,70])
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

      expect(getLeaf(tree).keys).toEqual([3,5])
      expect(getLeaf(tree, 0).keys).toEqual([1,2,3])
      expect(getLeaf(tree, 0).values).toEqual([10,20,30])
      expect(getLeaf(tree, 1).shift).toEqual(0)
      expect(getLeaf(tree, 1).keys).toEqual([4,5])
      expect(getLeaf(tree, 1).values).toEqual([40,70])
      expect(getLeaf(tree, 2).shift).toEqual(-2)
      expect(getLeaf(tree, 2).keys).toEqual([8,9])
      expect(getLeaf(tree, 2).values).toEqual([80,90])
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

      expect(getLeaf(tree).keys).toEqual([4,6])
      expect(getLeaf(tree, 0).keys).toEqual([1,2,3,4])
      expect(getLeaf(tree, 0).values).toEqual([100,10,20,30])
      expect(getLeaf(tree, 1).shift).toEqual(1)
      expect(getLeaf(tree, 1).keys).toEqual([4,5])
      expect(getLeaf(tree, 1).values).toEqual([40,70])
      expect(getLeaf(tree, 2).shift).toEqual(-1)
      expect(getLeaf(tree, 2).keys).toEqual([8,9])
      expect(getLeaf(tree, 2).values).toEqual([80,90])
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
      expect(getLeaf(tree, 0).keys).toEqual([1,2])
      expect(getLeaf(tree, 0).values).toEqual([10,20])
      expect(getLeaf(tree, 1).keys).toEqual([3,4])
      expect(getLeaf(tree, 1).values).toEqual([30,40])
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

      expect(getLeaf(tree).keys).toEqual([2,5])
      expect(getLeaf(tree, 0).keys).toEqual([1,2])
      expect(getLeaf(tree, 0).values).toEqual([10,20])
      expect(getLeaf(tree, 1).shift).toEqual(-1)
      expect(getLeaf(tree, 1).keys).toEqual([4,5,6])
      expect(getLeaf(tree, 1).values).toEqual([300,40,50])
      expect(getLeaf(tree, 2).shift).toEqual(0)
      expect(getLeaf(tree, 2).keys).toEqual([6,7])
      expect(getLeaf(tree, 2).values).toEqual([60,70])
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
      //1,2 | 3,4 | 5    7 | 8     13,14 | 15,16

      tree.deleteKeyWithShift(7)

      //             5
      //   [2     4]        [7      9]^-1
      //1,2 | 3,4 | 5    7 | 13,14 | 15,16
      expect(tree._root.keys).toEqual([5])
      expect(getLeaf(tree, 1).shift).toEqual(-1)
      expect(getLeaf(tree, 1).keys).toEqual([7,9])
      expect(getLeaf(tree, 1, 0).shift).toEqual(0)
      expect(getLeaf(tree, 1, 0).keys).toEqual([7])
      expect(getLeaf(tree, 1, 1).shift).toEqual(-5)
      expect(getLeaf(tree, 1, 1).keys).toEqual([13,14])
      expect(getLeaf(tree, 1, 2).shift).toEqual(-5)
      expect(getLeaf(tree, 1, 2).keys).toEqual([15,16])
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
      //1,2 | 3,4 | 5,6    7 | 8     13,14 | 15,16

      tree.deleteKeyWithShift(8)

      //             6
      //   [2     4]        [7      9]
      //1,2 | 3,4 | 5,6    7 | 13,14 | 15,16
      expect(tree._root.keys).toEqual([6])
      expect(getLeaf(tree, 1).shift).toEqual(0)
      expect(getLeaf(tree, 1).keys).toEqual([7,9])
      expect(getLeaf(tree, 1, 0).shift).toEqual(0)
      expect(getLeaf(tree, 1, 0).keys).toEqual([7])
      expect(getLeaf(tree, 1, 1).shift).toEqual(-5)
      expect(getLeaf(tree, 1, 1).keys).toEqual([13,14])
      expect(getLeaf(tree, 1, 2).shift).toEqual(-5)
      expect(getLeaf(tree, 1, 2).keys).toEqual([15,16])
      expect(getLeaf(tree, 2)).toBeUndefined()
    })
  })
})
