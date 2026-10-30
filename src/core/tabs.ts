import { dedupe } from './dedupe';
import { applyGroupingRules, applyTabGroups, groupByDomain } from './grouping';
import { applySort } from './sort';
import { getCreatedAtMap, getLastAccessedMap, getSettings, getWhitelist } from './storage';
import type {
  OrganizeSummary,
  SortScope,
  TabInfo,
} from './types';

/** 把 chrome.tabs.Tab 转成内部 TabInfo */
export function toTabInfo(t: chrome.tabs.Tab): TabInfo | null {
  if (t.id == null || t.url == null || t.windowId == null) return null;
  return {
    id: t.id,
    windowId: t.windowId,
    url: t.url,
    title: t.title ?? '',
    favIconUrl: t.favIconUrl,
    pinned: t.pinned ?? false,
    active: t.active,
    groupId: t.groupId ?? -1,
    index: t.index,
  };
}

export async function queryAllTabs(): Promise<TabInfo[]> {
  const all = await chrome.tabs.query({});
  const list: TabInfo[] = [];
  for (const t of all) {
    const info = toTabInfo(t);
    if (info) list.push(info);
  }
  return list;
}

/** 跳过 pinned 与白名单 url */
function filterEligible(tabs: TabInfo[], whitelistUrls: Set<string>): TabInfo[] {
  return tabs.filter((t) => !t.pinned && !whitelistUrls.has(t.url));
}

/** 一键整理仅分组，绝不调用去重、关闭标签或跨窗口排序。 */
export async function organizeAll(): Promise<OrganizeSummary> {
  const [allTabs, wl, settings, createdAt, lastAccessed] = await Promise.all([
    queryAllTabs(),
    getWhitelist(),
    getSettings(),
    getCreatedAtMap(),
    getLastAccessedMap(),
  ]);
  const wlSet = new Set(wl.urls);
  const pathDomainWhitelist = new Set(settings.pathDomainWhitelist);
  const eligible = filterEligible(allTabs, wlSet);

  const byFirstPath = settings.groupMode === 'path';
  let groupsCreated = 0;
  let grouped = 0;
  const byWin = new Map<number, TabInfo[]>();
  for (const t of eligible) {
    let arr = byWin.get(t.windowId);
    if (!arr) {
      arr = [];
      byWin.set(t.windowId, arr);
    }
    arr.push(t);
  }
  for (const [winId, arr] of byWin) {
    const preGroups = groupByDomain(arr, byFirstPath, pathDomainWhitelist);
    const groups = applyGroupingRules(
      preGroups,
      settings.minGroupTabs,
      settings.maxGroupCount,
    );
    grouped += groups
      .reduce((acc, g) => acc + g.tabs.length, 0);
    for (const group of groups) {
      group.tabs.sort((a, b) => settings.groupTabSort === 'created'
        ? (createdAt[a.id] ?? a.id) - (createdAt[b.id] ?? b.id)
        : (lastAccessed[b.id] ?? 0) - (lastAccessed[a.id] ?? 0));
    }
    groupsCreated += await applyTabGroups(winId, groups, true);
  }

  return {
    closed: 0,
    grouped,
    groupsCreated,
  };
}

export async function dedupeOnly(): Promise<number> {
  const [allTabs, lastAccessed, wl] = await Promise.all([
    queryAllTabs(),
    getLastAccessedMap(),
    getWhitelist(),
  ]);
  const wlSet = new Set(wl.urls);
  const eligible = filterEligible(allTabs, wlSet);
  const toClose = dedupe(eligible, lastAccessed);
  if (toClose.length > 0) {
    try {
      await chrome.tabs.remove(toClose);
    } catch (e) {
      console.warn('[PowerfulTab] remove failed', e);
    }
  }
  return toClose.length;
}

export async function sortOnly(scope: SortScope): Promise<void> {
  const [allTabs, lastAccessed, wl] = await Promise.all([
    queryAllTabs(),
    getLastAccessedMap(),
    getWhitelist(),
  ]);
  const wlSet = new Set(wl.urls);
  await applySort(scope, filterEligible(allTabs, wlSet), lastAccessed);
}

export async function groupOnly(): Promise<number> {
  return (await organizeAll()).groupsCreated;
}
