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
      for (let i = 0; i < node.keys.length; i++) {
        if (node.keys[i] === sKey) {
          return node.values[i]
        }
      }
      return null
    } else {
      let indexOfBiggerKey = node.keys.length;
      for (let i = 0; i < node.keys.length; i++) {
        if (node.keys[i] >= sKey) {
          indexOfBiggerKey = i
          break;
        }
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
    let indexWhereToAddIt = node.keys.length
    for (let i = 0; i < node.keys.length; i++) {
      if (node.keys[i] >= sKey) {
        indexWhereToAddIt = i
        break
      }
    }
    if (node instanceof Leaf) {
      for (let i = node.keys.length; i > indexWhereToAddIt; i--) {
        node.keys[i] = node.keys[i - 1] + 1
        node.values[i] = node.values[i - 1]
      }
      node.keys[indexWhereToAddIt] = sKey
      node.values[indexWhereToAddIt] = value
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
    // shift should be taken into account
    if (node instanceof Leaf) {
      let foundIndex
      // doable with find?
      for (let i = 0; i < node.keys.length; i++) {
        if (node.keys[i] === key) {
          foundIndex = i
          break
        }
      }
      if (foundIndex !== undefined) {
        node.keys.splice(foundIndex, 1)
        node.values.splice(foundIndex, 1)
        for (let i = foundIndex; i < node.keys.length; i++) {
          node.keys[i]--;
        }
      }
    }
  }
}
