import type { LastAccessedMap, TabInfo } from './types';

/** 仅完整 URL 字符串完全一致才去重，包含 path、参数顺序和 hash。 */
export function dedupe(tabs: TabInfo[], lastAccessed: LastAccessedMap): number[] {
  const buckets = new Map<string, TabInfo[]>();
  for (const tab of tabs) {
    const bucket = buckets.get(tab.url) ?? [];
    bucket.push(tab);
    buckets.set(tab.url, bucket);
  }
  const toClose: number[] = [];
  for (const bucket of buckets.values()) {
    bucket.sort((a, b) => (lastAccessed[b.id] ?? 0) - (lastAccessed[a.id] ?? 0));
    toClose.push(...bucket.slice(1).map((tab) => tab.id));
  }
  return toClose;
}
