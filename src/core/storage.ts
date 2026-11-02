import type { Settings, Whitelist, LastAccessedMap } from './types';
import { migrateStorage } from './storage-migration';

const SETTINGS_KEY = 'powerfultab.settings';
const WHITELIST_KEY = 'powerfultab.whitelist';
const LAST_ACCESSED_KEY = 'powerfultab.lastAccessed';
const SEARCH_HISTORY_KEY = 'powerfultab.searchHistory';

export async function getSearchHistory(count = 1): Promise<string[]> {
  await migrateStorage();
  const stored = (await chrome.storage.local.get(SEARCH_HISTORY_KEY))[SEARCH_HISTORY_KEY];
  return Array.isArray(stored) ? stored.filter((item): item is string => typeof item === 'string' && !!item.trim()).slice(0, count) : [];
}

export async function setSearchHistory(history: string[], count = 1): Promise<void> {
  await migrateStorage();
  await chrome.storage.local.set({ [SEARCH_HISTORY_KEY]: history.slice(0, count) });
}

const DEFAULT_SETTINGS: Settings = {
  groupMode: 'domain',
  sortScope: 'perWindow',
  theme: 'light',
  pathDomainWhitelist: [],
  domainPathWhitelist: [],
  maxGroupCount: 15,
  minGroupTabs: 3,
  groupTabSort: 'accessed',
  searchHistoryCount: 1,
  searchClearTimeoutSeconds: 60,
};

export async function getCreatedAtMap(): Promise<LastAccessedMap> {
  await migrateStorage();
  const stored = await chrome.storage.local.get('powerfultab.createdAt');
  return (stored['powerfultab.createdAt'] as LastAccessedMap | undefined) ?? {};
}

let creationWrite = Promise.resolve();
export function recordTabCreation(tabId: number): Promise<void> {
  creationWrite = creationWrite.catch(() => undefined).then(async () => {
    const map = await getCreatedAtMap();
    if (map[tabId] == null) {
      map[tabId] = Date.now();
      await chrome.storage.local.set({ 'powerfultab.createdAt': map });
    }
  });
  return creationWrite;
}

export function normalizeMaxGroupCount(value: number): number {
  if (!Number.isFinite(value)) return 15;
  return Math.max(1, Math.floor(value));
}

export function normalizeMinGroupTabs(value: number): number {
  if (!Number.isFinite(value)) return 3;
  return Math.max(1, Math.floor(value));
}

export function normalizeSearchClearTimeout(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 60;
}

/** 接受 hostname、URL，以及逗号/空格/换行分隔的输入，返回规范化后的 hostname。 */
export function parseDomainWhitelist(input: string): string[] {
  const hosts = new Set<string>();
  for (const raw of input.split(/[\s,，;；]+/)) {
    const value = raw.trim().toLowerCase();
    if (!value) continue;
    try {
      const candidate = value.includes('://') ? value : `https://${value}`;
      const hostname = new URL(candidate).hostname.toLowerCase();
      if (hostname) hosts.add(hostname);
    } catch {
      // 忽略无效项，让用户可以边输入边保存有效域名。
    }
  }
  return [...hosts].sort();
}

const DEFAULT_WHITELIST: Whitelist = { urls: [] };

export async function getSettings(): Promise<Settings> {
  await migrateStorage();
  const res = await chrome.storage.local.get(SETTINGS_KEY);
  const stored = res[SETTINGS_KEY] as (Partial<Settings> & { dedupeMode?: string }) | undefined;
  const settings = { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
  settings.groupMode = stored?.groupMode ?? (stored?.dedupeMode === 'path' ? 'path' : 'domain');
  settings.maxGroupCount = normalizeMaxGroupCount(settings.maxGroupCount);
  settings.minGroupTabs = normalizeMinGroupTabs(settings.minGroupTabs);
  settings.searchHistoryCount = Number.isFinite(settings.searchHistoryCount) ? Math.max(0, Math.floor(settings.searchHistoryCount)) : 1;
  settings.searchClearTimeoutSeconds = normalizeSearchClearTimeout(settings.searchClearTimeoutSeconds);
  return settings;
}

export async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  next.minGroupTabs = normalizeMinGroupTabs(next.minGroupTabs);
  next.searchClearTimeoutSeconds = normalizeSearchClearTimeout(next.searchClearTimeoutSeconds);
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  return next;
}

export async function getWhitelist(): Promise<Whitelist> {
  await migrateStorage();
  const res = await chrome.storage.local.get(WHITELIST_KEY);
  const stored = res[WHITELIST_KEY] as Whitelist | undefined;
  return stored ?? DEFAULT_WHITELIST;
}

export async function setWhitelist(wl: Whitelist): Promise<void> {
  await migrateStorage();
  await chrome.storage.local.set({ [WHITELIST_KEY]: wl });
}

export async function getLastAccessedMap(): Promise<LastAccessedMap> {
  await migrateStorage();
  const res = await chrome.storage.local.get(LAST_ACCESSED_KEY);
  const stored = res[LAST_ACCESSED_KEY] as LastAccessedMap | undefined;
  return stored ?? {};
}

export async function setLastAccessedMap(map: LastAccessedMap): Promise<void> {
  await migrateStorage();
  await chrome.storage.local.set({ [LAST_ACCESSED_KEY]: map });
}

export async function updateLastAccessed(tabId: number, ts: number = Date.now()): Promise<void> {
  const map = await getLastAccessedMap();
  map[tabId] = ts;
  await setLastAccessedMap(map);
}

export async function removeLastAccessed(tabId: number): Promise<void> {
  const map = await getLastAccessedMap();
  delete map[tabId];
  await setLastAccessedMap(map);
}
