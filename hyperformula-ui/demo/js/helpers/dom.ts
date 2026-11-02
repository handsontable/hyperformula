export function requireEl<T extends HTMLElement = HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`required element #${id} not found`);
  }

  return element as T;
}
