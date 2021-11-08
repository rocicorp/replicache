export function range(
  startInclusive: number,
  endExclusive: number,
  step?: number,
): number[] {
  const definedStep =
    step !== undefined ? step : endExclusive < startInclusive ? -1 : 1;
  if (definedStep === 0) {
    return [];
  }
  if (
    (endExclusive < startInclusive && definedStep > 0) ||
    (endExclusive > startInclusive && definedStep < 0)
  ) {
    return [];
  }
  const length = Math.ceil(
    Math.abs(endExclusive - startInclusive) / Math.abs(definedStep),
  );
  return Array.from({length}, (_, i) => startInclusive + i * definedStep);
}

export function rangeRight(endExclusive: number, step?: number): number[] {
  return range(0, endExclusive, step);
}
