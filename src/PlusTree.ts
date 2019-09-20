class Leaf<T> {
  constructor(
    public keys: number[],
    public values: T[],
    public shift: number,
  ) {
  }
}

type PNode<T> = Leaf<T>

export class PlusTree<T> {

  public static empty(span: number) {
    return new PlusTree(span, new Leaf([], [], 0))
  }
  private readonly minSize: number
  private readonly maxSize: number

  constructor(
    private readonly span: number,
    private root: PNode<T>,
  ) {
    this.minSize = this.span - 1
    this.maxSize = 2 * this.span - 1
  }

  public getKey(key: number): T | null {
    return this.getKeyRecursive(this.root, key)
  }

  public addKeyWithShift(key: number, value: T) {
    this.addKeyWithShiftRecursive(this.root, key, value)
  }

  private getKeyRecursive(node: PNode<T>, key: number): T | null {
    for (let i = 0; i < node.keys.length; i++) {
      if (node.keys[i] === key) {
        return node.values[i]
      }
    }
    return null
  }

  private addKeyWithShiftRecursive(node: PNode<T>, key: number, value: T) {
    let indexWhereToAddIt = node.keys.length
    for (let i = 0; i < node.keys.length; i++) {
      if (node.keys[i] >= key) {
        indexWhereToAddIt = i
        break
      }
    }
    for (let i = node.keys.length; i > indexWhereToAddIt; i--) {
      node.keys[i] = node.keys[i - 1]
      node.values[i] = node.values[i - 1]
    }
    node.keys[indexWhereToAddIt] = key
    node.values[indexWhereToAddIt] = value
  }
}
