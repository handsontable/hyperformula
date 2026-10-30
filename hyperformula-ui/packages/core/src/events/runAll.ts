export function runAll(steps: Array<() => void>): void {
  const errors: unknown[] = [];

  for (const step of steps) {
    try {
      step();
    } catch (error) {
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    throw errors[0];
  }
}
