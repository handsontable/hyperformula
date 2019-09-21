export class Leaf<T> {
  constructor(
    public keys: number[],
    public values: T[],
    public shift: number,
  ) {
  }
}

export class Internal<T> {
  constructor(
    public keys: number[],
    public children: PNode<T>[],
    public shift: number,
  ) {
  }
}

type PNode<T> = Leaf<T> | Internal<T>

export class PlusTree<T> {
  public static empty(span: number) {
    return new PlusTree(span, new Leaf([], [], 0))
  }
  private readonly minSize: number
  private readonly maxSize: number

  constructor(
    private readonly span: number,
    public _root: PNode<T>,
  ) {
    this.minSize = this.span - 1
    this.maxSize = 2 * this.span - 1
  }

  public getKey(key: number): T | null {
    return this.getKeyRecursive(this._root, key)
  }

  private getKeyRecursive(node: PNode<T>, key: number): T | null {
    const sKey = key - node.shift
    if (node instanceof Leaf) {
      const index = node.keys.indexOf(sKey)
      if (index === -1) {
        return null
      } else {
        return node.values[index]
      }
    } else {
      let indexOfBiggerKey = node.keys.findIndex(k => k >= sKey)
      if (indexOfBiggerKey === -1) {
        indexOfBiggerKey = node.keys.length;
      }
      return this.getKeyRecursive(node.children[indexOfBiggerKey], sKey)
    }
  }

  public addKeyWithShift(key: number, value: T) {
    this.addKeyWithShiftRecursive(this._root, key, value)
    if (this._root.keys.length > this.maxSize) {
      const newRoot = new Internal([], [this._root], 0)
      this.splitNode(newRoot, 0)
      this._root = newRoot
    }
  }

  private addKeyWithShiftRecursive(node: PNode<T>, key: number, value: T) {
    const sKey = key - node.shift
    let indexWhereToAddIt = node.keys.findIndex(k => k >= sKey)
    if (indexWhereToAddIt === -1) {
      indexWhereToAddIt = node.keys.length;
    }
    if (node instanceof Leaf) {
      for (let i = indexWhereToAddIt; i < node.keys.length; i++) {
        node.keys[i]++
      }
      node.keys.splice(indexWhereToAddIt, 0, sKey)
      node.values.splice(indexWhereToAddIt, 0, value)
    } else {
      const childNode = node.children[indexWhereToAddIt]
      this.addKeyWithShiftRecursive(childNode, sKey, value)
      for (let i = indexWhereToAddIt; i < node.keys.length; i++) {
        node.keys[i]++
        node.children[i+1].shift++
      }
      if (childNode.keys.length > this.maxSize) {
        this.splitNode(node, indexWhereToAddIt)
      }
    }
  }

  private splitNode(parentNode: Internal<T>, index: number) {
    const currentNode = parentNode.children[index]
    if (currentNode instanceof Leaf) {
      const keysForNewNode = currentNode.keys.splice(this.span, this.span)
      const valuesForNewNode = currentNode.values.splice(this.span, this.span)
      const newNode = new Leaf(keysForNewNode, valuesForNewNode, currentNode.shift)
      parentNode.keys.splice(index, 0, currentNode.keys[currentNode.keys.length - 1] + currentNode.shift)
      parentNode.children.splice(index + 1, 0, newNode)
    } else {
      const keysForNewNode = currentNode.keys.splice(this.span + 1, this.span - 1)
      const childrenForNewNode = currentNode.children.splice(this.span + 1, this.span)
      const newNode = new Internal(keysForNewNode, childrenForNewNode, currentNode.shift)
      parentNode.keys.splice(index, 0, currentNode.keys.pop()! + currentNode.shift)
      parentNode.children.splice(index + 1, 0, newNode)
    }
  }

  public deleteKeyWithShift(key: number) {
    this.deleteKeyWithShiftRecursive(this._root, key)
  }

  private deleteKeyWithShiftRecursive(node: PNode<T>, key: number) {
    const sKey = key - node.shift
    if (node instanceof Leaf) {
      const foundIndex = node.keys.findIndex(k => k >= sKey)
      if (foundIndex !== -1) {
        if (node.keys[foundIndex] === sKey) {
          node.keys.splice(foundIndex, 1)
          node.values.splice(foundIndex, 1)
        }
        for (let i = foundIndex; i < node.keys.length; i++) {
          node.keys[i]--;
        }
      }
    } else {
      let foundIndex = node.keys.findIndex(k => k >= sKey)
      if (foundIndex === -1) {
        foundIndex = node.keys.length
      }
      const childNode = node.children[foundIndex]
      this.deleteKeyWithShiftRecursive(childNode, sKey)
      for (let i = foundIndex; i < node.keys.length; i++) {
        node.keys[i]--
        node.children[i+1].shift--
      }
      // merging/redistribution of keys
    }
  }
}
