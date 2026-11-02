import type { Kernel } from "../kernel/kernel";

export function isFormula(kernel: Kernel): boolean {
  return kernel.getState().text.startsWith("=");
}
