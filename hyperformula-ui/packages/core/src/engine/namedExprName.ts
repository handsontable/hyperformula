const NAME_PATTERN = /^[\p{L}_][\p{L}\p{N}_.]*$/u;
const A1_PATTERN = /^[A-Za-z]+[0-9]+$/;
const R1C1_PATTERN = /^[Rr][0-9]*[Cc][0-9]*$/;

export function validateNamedExprName(name: string): boolean {
  if (!NAME_PATTERN.test(name)) {
    return false;
  }

  return !A1_PATTERN.test(name) && !R1C1_PATTERN.test(name);
}
