/** Preserve existing rows; remove closed tabs and append newly encountered tabs. */
export function reconcileTabOrder(previous: readonly number[], desired: readonly number[]): number[] {
  const live = new Set(desired);
  const retained = previous.filter((id) => live.has(id));
  const known = new Set(retained);
  return [...retained, ...desired.filter((id) => !known.has(id))];
}
