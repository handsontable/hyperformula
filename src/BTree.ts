class BNode {
  constructor(
    public keys: number[],
    public values: number[],
    public children: BNode[] | null,
    public shift: number = 0,
  ) {
  }
}

export class BTree {
  private root: BNode
  private readonly maxSize: number
  private readonly minSize: number

  constructor(
    private readonly span: number
  ) {
    this.root = new BNode([], [], null)
    this.minSize = this.span - 1
    this.maxSize = 2 * this.span - 1
  }

  public addKey(key: number, val: number) {
    this.ensureThatRootNotFull()
    this.addKeyRecursive(this.root, key, val)
  }

  public addKeyWithShift(key: number, val: number) {
    this.ensureThatRootNotFull()
    this.addKeyWithShiftRecursive(this.root, key, val)
  }

  public getKey(key: number): number | null {
    const result = this.findNodeWithKey(this.root, key)
    if (result === null) {
      return null
    }
    return result[0].values[result[1]]
  }

  public deleteKeyWithShift(key: number) {
    this.deleteKeyWithShiftRecursive(this.root, key)
  }

  public get _root(): BNode {
    return this.root
  }

  private addKeyRecursive(node: BNode, newKey: number, newValue: number) {
    let sNewKey = newKey - node.shift
    let indexForNewKey = node.keys.length
    for (let i = 0; i < node.keys.length; i++) {
      if (node.keys[i] > sNewKey) {
        indexForNewKey = i
        break
      }
    }

    if (node.children !== null) {
      const childNode = node.children[indexForNewKey]
      if (childNode.keys.length === this.maxSize) {
        this.splitNode(node, indexForNewKey)
        if (sNewKey > node.keys[indexForNewKey]) {
          indexForNewKey++
        }
      }
      this.addKeyRecursive(node.children[indexForNewKey], sNewKey, newValue)
    } else {
      for (let i = node.keys.length - 1; i >= indexForNewKey; i--) {
        node.keys[i+1] = node.keys[i]
        node.values[i+1] = node.values[i]
      }

      node.keys[indexForNewKey] = sNewKey
      node.values[indexForNewKey] = newValue
    }
  }

  private addKeyWithShiftRecursive(node: BNode, newKey: number, newValue: number) {
    let sNewKey = newKey - node.shift
    let indexForNewKey = node.keys.length
    for (let i = 0; i < node.keys.length; i++) {
      if (node.keys[i] >= sNewKey) {
        indexForNewKey = i
        break
      }
    }

    if (node.children !== null) {
      const childNode = node.children[indexForNewKey]
      if (childNode.keys.length === this.maxSize) {
        this.splitNode(node, indexForNewKey)
        if (sNewKey > node.keys[indexForNewKey]) {
          indexForNewKey++
        }
      }
      for (let i = node.keys.length - 1; i >= indexForNewKey; i--) {
        node.keys[i]++
      }
      for (let i = indexForNewKey + 1; i < node.children.length; i++) {
        node.children[i].shift++
      }
      this.addKeyWithShiftRecursive(node.children[indexForNewKey], sNewKey, newValue)
    } else {
      for (let i = node.keys.length - 1; i >= indexForNewKey; i--) {
        node.keys[i+1] = node.keys[i] + 1
        node.values[i+1] = node.values[i]
      }

      node.keys[indexForNewKey] = sNewKey
      node.values[indexForNewKey] = newValue
    }
  }

  private deleteKeyWithShiftRecursive(node: BNode, key: number): boolean {
    let skey = key - node.shift
    if (node.children === null) {
      for (let i = 0; i < node.keys.length; i++) {
        if (node.keys[i] === skey) {
          node.keys.splice(i, 1)
          node.values.splice(i, 1)
          for (let j = i; j < node.keys.length; j++) {
            node.keys[j]--
          }
          return true
        }
      }
      return false
    } else {
      let indexWithKey = node.keys.length
      for (let i = 0; i < node.keys.length; i++) {
        // if (node.keys[i] === key) {
        //   // we have key in the internal node
        //   indexWithKey = i
        //   break
        // } else if (node.keys[i] > key) {
        if (node.keys[i] > skey) {
          indexWithKey = i
          break
        }
      }
      const childNode = node.children![indexWithKey]
      if (childNode.keys.length === this.minSize && node.children![indexWithKey + 1].keys.length > this.minSize) {
        this.rotateLeft(node, indexWithKey)
        return this.deleteFromChildNodeAtIndex(node, indexWithKey, skey)
      } else {
        return this.deleteFromChildNodeAtIndex(node, indexWithKey, skey)
      }
    }
  }

  private deleteFromChildNodeAtIndex(parentNode: BNode, indexWithKey: number, skey: number): boolean {
    const didRemoveInChild = this.deleteKeyWithShiftRecursive(parentNode.children![indexWithKey], skey)
    if (didRemoveInChild) {
      for (let i = indexWithKey + 1; i < parentNode.children!.length; i++) {
        parentNode.children![i].shift--
      }
      for (let i = indexWithKey; i < parentNode.keys.length; i++) {
        parentNode.keys[i]--
      }
    }
    return didRemoveInChild
  }

  private rotateLeft(parentNode: BNode, index: number) {
    const rightNode = parentNode.children![index + 1]
    const leftNode = parentNode.children![index]
    leftNode.keys.push(parentNode.keys[index] - leftNode.shift)
    leftNode.values.push(parentNode.values[index])
    // leftNode.children.push(rightNode.children.splice(0, 1)[0])
    parentNode.keys[index] = rightNode.keys.splice(0, 1)[0] + rightNode.shift
    parentNode.values[index] = rightNode.values.splice(0, 1)[0]
  }

  private splitNode(parentNode: BNode, indexOfSplittedChild: number) {
    const childNode = parentNode.children![indexOfSplittedChild]
    const keysForNewNode = childNode.keys.splice(this.span, this.span - 1)
    const valuesForNewNode = childNode.values.splice(this.span, this.span - 1)
    let childrenForNewNode = null
    if (childNode.children !== null) {
      childrenForNewNode = childNode.children.splice(this.span, this.span)
    }
    const newNode = new BNode(keysForNewNode, valuesForNewNode, childrenForNewNode)
    parentNode.keys.splice(indexOfSplittedChild + 1, 0, ...childNode.keys.splice(this.span - 1, 1))
    parentNode.values.splice(indexOfSplittedChild + 1, 0, ...childNode.values.splice(this.span - 1, 1))
    parentNode.children!.splice(indexOfSplittedChild + 2, 0, newNode)
  }

  private findNodeWithKey(node: BNode, key: number): [BNode, number] | null {
    const skey = key - node.shift
    for (let i = 0; i < node.keys.length; i++) {
      if (node.keys[i] === skey) {
        return [node, i]
      } else if (node.keys[i] > skey) {
        if (node.children !== null) {
          return this.findNodeWithKey(node.children[i], skey)
        } else {
          return null
        }
      }
    }
    if (node.children !== null) {
      return this.findNodeWithKey(node.children[node.children.length - 1], skey)
    } else {
      return null
    }
  }

  private ensureThatRootNotFull() {
    if (this.root.keys.length === this.maxSize) {
      const newRoot = new BNode([], [], [])
      newRoot.children!.push(this.root)
      this.splitNode(newRoot, 0)
      this.root = newRoot
    }
  }
}
