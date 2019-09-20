import {PlusTree} from '../src/PlusTree'

describe('PlusTree', () => {
  it('initialize empty tree', () => {
    const tree = PlusTree.empty(2)

    expect(tree.getKey(42)).toEqual(null)
  })
})
