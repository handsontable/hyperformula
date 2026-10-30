export const REF_PALETTE = [
  "var(--hfe-ref-1)",
  "var(--hfe-ref-2)",
  "var(--hfe-ref-3)",
  "var(--hfe-ref-4)",
  "var(--hfe-ref-5)",
  "var(--hfe-ref-6)",
  "var(--hfe-ref-7)",
  "var(--hfe-ref-8)",
] as const;

export type RefIndexMap = Map<string, number>;

export function makeRefIndexMap(): RefIndexMap {
  return new Map();
}

function refColorKey(refText: string): string {
  return refText.toUpperCase();
}

export function assignRefIndex(map: RefIndexMap, refText: string): number {
  const key = refColorKey(refText);
  const existing = map.get(key);

  if (existing !== undefined) {
    return existing;
  }

  const index = map.size;

  map.set(key, index);

  return index;
}

export function paletteColorForIndex(index: number): string {
  return REF_PALETTE[index % REF_PALETTE.length] as string;
}
