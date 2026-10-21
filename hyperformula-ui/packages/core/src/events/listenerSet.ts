/**
 * Generic add/emit/clear listener registry — the primitive behind adapter subscription
 * methods.
 *
 * @category Events
 */
export class ListenerSet<Args extends unknown[] = []> {
  private readonly listeners = new Set<(...args: Args) => void>();

  /** Number of registered listeners. */
  get size(): number {
    return this.listeners.size;
  }

  /** Registers `listener`; returns its unsubscribe function. */
  add(listener: (...args: Args) => void): () => void {
    this.listeners.add(listener);

    return () => this.listeners.delete(listener);
  }

  /** Invokes every registered listener with `args`. */
  emit(...args: Args): void {
    for (const listener of this.listeners) {
      listener(...args);
    }
  }

  /** Drops every listener. */
  clear(): void {
    this.listeners.clear();
  }
}
