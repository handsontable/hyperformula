export function withSharedClose<T extends { showClose?: boolean }>(
  shared: boolean | undefined,
  own?: T,
): T | undefined {
  if (shared === undefined) {
    return own;
  }

  return { ...own, showClose: own?.showClose ?? shared } as T;
}
