import type { FormulaBarOptions } from "../../src/formulaBar/formulaBar";
import { FormulaBar } from "../../src/formulaBar/formulaBar";
import type { LiveRegion } from "../../src/ui/liveRegion";

export function stubLiveRegion(): LiveRegion {
  return { announce: () => {}, destroy: () => {} } as unknown as LiveRegion;
}

export function makeFormulaBar(
  container: HTMLElement,
  options: Omit<FormulaBarOptions, "liveRegion"> & { liveRegion?: LiveRegion },
): FormulaBar {
  return new FormulaBar(container, { liveRegion: stubLiveRegion(), ...options });
}
