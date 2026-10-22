/**
 * Non-DOM teardown unit registered on an `EventScope` via `scope.add()`.
 *
 * @category Events
 */
export interface Disposable {
  dispose(): void;
}

/**
 * Default listener options for every `listen()` call in a scope; individual calls may
 * override per listener.
 *
 * @category Events
 */
export interface ScopePolicy {
  capture?: boolean;
  stopPropagation?: boolean;
  preventDefault?: boolean;
}

/**
 * Per-listener options for `EventScope.listen`; unset fields fall back to the scope policy.
 *
 * @category Events
 */
export interface DomEventOptions {
  capture?: boolean;
  stopPropagation?: boolean;
  preventDefault?: boolean;
  passive?: boolean;
}
