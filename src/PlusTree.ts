class Leaf<T> {
  constructor(
    public keys: number[],
    public values: T[],
    public shift: number,
  ) {
  }
}

export class PlusTree<T> {
  private readonly minSize: number
  private readonly maxSize: number

  constructor(
    private readonly span: number,
    private root: Leaf<T>,
  ) {
    this.minSize = this.span - 1
    this.maxSize = 2 * this.span - 1
  }

  public static empty(span: number) {
    return new PlusTree(span, new Leaf([], [], 0))
  }

  public getKey(key: number): T | null {
    return null
  }
}
