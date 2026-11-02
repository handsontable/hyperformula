/**
 * Structural keydown shape {@link resolveEditStartKey} classifies — pass a DOM
 * `KeyboardEvent` or a host grid's equivalent.
 *
 * @category Grid Adapter
 */
export interface EditStartKeyEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

/**
 * The resolved intent of an edit-start key: `seed` carries the typed character when the edit
 * should open pre-seeded (type-to-edit); absent means open on the cell's current value.
 *
 * @category Grid Adapter
 */
export interface EditStartIntent {
  seed?: string;
}

/**
 * Classifies a grid keydown into an edit-start intent: Enter/F2 open without a seed, an
 * unmodified printable key opens seeded with that character (AltGraph combos count as
 * printable), and `null` means the key does not start an edit.
 *
 * @category Grid Adapter
 */
export function resolveEditStartKey(event: EditStartKeyEvent): EditStartIntent | null {
  if (event.key === "Enter" || event.key === "F2") {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return null;
    }
    return {};
  }

  const isAltGraph = event.ctrlKey && event.altKey;
  const hasShortcutModifier = (event.ctrlKey || event.metaKey) && !isAltGraph;

  if (event.key.length === 1 && !hasShortcutModifier) {
    return { seed: event.key };
  }

  return null;
}
