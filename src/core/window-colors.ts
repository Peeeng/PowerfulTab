const WINDOW_HUES = [210, 30, 145, 270, 330, 185, 60, 115, 245, 0];

/** Retain live windows' colors and allocate unused palette entries first. */
export function assignWindowColors(
  windowIds: readonly number[],
  previous: ReadonlyMap<number, number>,
): Map<number, number> {
  const ids = [...new Set(windowIds)].sort((a, b) => a - b);
  const colors = new Map<number, number>();
  const usage = new Map(WINDOW_HUES.map((hue) => [hue, 0]));
  for (const id of ids) {
    const hue = previous.get(id);
    if (hue === undefined || !usage.has(hue)) continue;
    colors.set(id, hue);
    usage.set(hue, usage.get(hue)! + 1);
  }
  for (const id of ids) {
    if (colors.has(id)) continue;
    const hue = WINDOW_HUES.reduce((best, candidate) =>
      usage.get(candidate)! < usage.get(best)! ? candidate : best);
    colors.set(id, hue);
    usage.set(hue, usage.get(hue)! + 1);
  }
  return new Map(ids.map((id) => [id, colors.get(id)!]));
}
