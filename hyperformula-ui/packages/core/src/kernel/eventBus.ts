import type { KernelEventMap } from "./types";

type Listener<K extends keyof KernelEventMap> = (payload: KernelEventMap[K]) => void;

export class EventBus {
  private listeners = new Map<keyof KernelEventMap, Set<Listener<keyof KernelEventMap>>>();

  on<K extends keyof KernelEventMap>(name: K, callback: Listener<K>): () => void {
    let listeners = this.listeners.get(name);

    if (!listeners) {
      listeners = new Set();
      this.listeners.set(name, listeners);
    }

    listeners.add(callback as Listener<keyof KernelEventMap>);

    return () => this.off(name, callback);
  }

  off<K extends keyof KernelEventMap>(name: K, callback: Listener<K>): void {
    this.listeners.get(name)?.delete(callback as Listener<keyof KernelEventMap>);
  }

  emit<K extends keyof KernelEventMap>(name: K, payload: KernelEventMap[K]): void {
    const listeners = this.listeners.get(name);

    if (!listeners || listeners.size === 0) {
      return;
    }

    for (const callback of [...listeners]) {
      try {
        (callback as Listener<K>)(payload);
      } catch (error) {
        console.error(`EventBus listener for "${String(name)}" threw:`, error);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
