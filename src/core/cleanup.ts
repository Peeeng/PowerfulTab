import type { LastAccessedMap, TabInfo } from './types';

export const RETENTION_PERIODS = [
  { label: '1h', hours: 1 }, { label: '2h', hours: 2 },
  { label: '6h', hours: 6 }, { label: '12h', hours: 12 },
  { label: '1d', hours: 24 }, { label: '2d', hours: 48 },
  { label: '3d', hours: 72 }, { label: '5d', hours: 120 },
  { label: '7d', hours: 168 }, { label: '15d', hours: 360 },
] as const;
export const DEFAULT_RETENTION_INDEX = 6;

function validTimestamp(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/** Use the newer visit record; unknown visits and protected tabs are retained. */
export function selectStaleTabIds(
  tabs: readonly TabInfo[],
  lastAccessed: LastAccessedMap,
  cutoff: number,
  windowIds: ReadonlySet<number> | null,
  whitelist: ReadonlySet<string>,
): number[] {
  if (!Number.isFinite(cutoff)) return [];
  return tabs.filter((tab) => {
    if (windowIds && !windowIds.has(tab.windowId)) return false;
    if (tab.pinned || whitelist.has(tab.url) || tab.url.startsWith('chrome-extension://')) return false;
    const visited = Math.max(validTimestamp(lastAccessed[tab.id]), validTimestamp(tab.lastAccessed));
    return visited > 0 && visited < cutoff;
  }).map((tab) => tab.id);
}
