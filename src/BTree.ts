class BNode {
  constructor(
    public readonly span: number,
    public keys: number[],
    public values: number[],
    public children: BNode[] | null,
    public shift: number = 0,
  ) {
  }

  public addKey(newKey: number, newValue: number) {
    let indexForNewKey = this.keys.length
    for (let i = 0; i < this.keys.length; i++) {
      if (this.keys[i] > newKey) {
        indexForNewKey = i
        break
      }
    }
    
    if (this.children !== null) {
      const childNode = this.children[indexForNewKey]
      if (childNode.keys.length === 2 * this.span - 1) {
        splitNode(this, indexForNewKey)
        if (newKey > this.keys[indexForNewKey]) {
          indexForNewKey++
        }
      }
      this.children[indexForNewKey].addKey(newKey, newValue)
    } else {
      for (let i = this.keys.length - 1; i >= indexForNewKey; i--) {
        this.keys[i+1] = this.keys[i]
        this.values[i+1] = this.values[i]
      }

      this.keys[indexForNewKey] = newKey
      this.values[indexForNewKey] = newValue
    }
  }

  public add2Key(newKey: number, newValue: number) {
    let indexForNewKey = this.keys.length
    for (let i = 0; i < this.keys.length; i++) {
      if (this.keys[i] >= newKey) {
        indexForNewKey = i
        break
      }
    }

    if (this.children !== null) {
      const childNode = this.children[indexForNewKey]
      if (childNode.keys.length === 2 * this.span - 1) {
        splitNode(this, indexForNewKey)
        if (newKey > this.keys[indexForNewKey]) {
          indexForNewKey++
        }
      }
      for (let i = this.keys.length - 1; i >= indexForNewKey; i--) {
        this.keys[i]++
      }
      for (let i = indexForNewKey + 1; i < this.children.length; i++) {
        this.children[i].shift++
      }
      this.children[indexForNewKey].add2Key(newKey, newValue)
    } else {
      for (let i = this.keys.length - 1; i >= indexForNewKey; i--) {
        this.keys[i+1] = this.keys[i] + 1
        this.values[i+1] = this.values[i]
      }

      this.keys[indexForNewKey] = newKey
      this.values[indexForNewKey] = newValue
    }
  }

  public getKey(key: number): number | null {
    const skey = key - this.shift
    for (let i = 0; i < this.keys.length; i++) {
      if (this.keys[i] === skey) {
        return this.values[i]
      } else if (this.keys[i] > skey) {
        if (this.children !== null) {
          return this.children[i].getKey(skey)
        } else {
          return null
        }
      }
    }
    if (this.children !== null) {
      return this.children[this.children.length - 1].getKey(skey)
    } else {
      return null
    }
  }
}

function splitNode(parentNode: BNode, indexOfSplittedChild: number) {
  const span = parentNode.span
  const childNode = parentNode.children![indexOfSplittedChild]
  const keysForNewNode = childNode.keys.splice(span, span - 1)
  const valuesForNewNode = childNode.values.splice(span, span - 1)
  let childrenForNewNode = null
  if (childNode.children !== null) {
    childrenForNewNode = childNode.children.splice(span, span)
  }
  const newNode = new BNode(span, keysForNewNode, valuesForNewNode, childrenForNewNode)
  parentNode.keys.splice(indexOfSplittedChild + 1, 0, ...childNode.keys.splice(span - 1, 1))
  parentNode.values.splice(indexOfSplittedChild + 1, 0, ...childNode.values.splice(span - 1, 1))
  parentNode.children!.splice(indexOfSplittedChild + 2, 0, newNode)
}

export class BTree {
  private root: BNode

  constructor(
    private readonly span: number
  ) {
    this.root = new BNode(this.span, [], [], null)
  }

  public addKey(key: number, val: number) {
    if (this.root.keys.length === 2 * this.span - 1) {
      const newRoot = new BNode(this.span, [], [], [])
      newRoot.children!.push(this.root)
      splitNode(newRoot, 0)
      this.root = newRoot
    }
    this.root.addKey(key, val)
  }

  public add2Key(key: number, val: number) {
    if (this.root.keys.length === 2 * this.span - 1) {
      const newRoot = new BNode(this.span, [], [], [])
      newRoot.children!.push(this.root)
      splitNode(newRoot, 0)
      this.root = newRoot
    }
    this.root.add2Key(key, val)
  }

  public getKey(key: number): number | null {
    return this.root.getKey(key)
  }

  public get _root(): BNode {
    return this.root
  }
}
