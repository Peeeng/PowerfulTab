import type { DomainGroup, TabInfo } from './types';

/** 彩色组用的淡色系（避开 red/yellow/green 这种高饱和、grey 留给「其他」） */
const CHROME_COLORS: chrome.tabGroups.ColorEnum[] = [
  'blue',
  'cyan',
  'pink',
  'purple',
];

/** 字符串 hash，用来稳定地分配颜色 */
export function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function colorForHostname(hostname: string): chrome.tabGroups.ColorEnum {
  return CHROME_COLORS[hashStr(hostname) % CHROME_COLORS.length] ?? 'grey';
}

export function safeHostname(url: string): string {
  try {
    return new URL(url).hostname || '(local)';
  } catch {
    return '(other)';
  }
}

/** URL 的一级 path；根路径或不可解析 URL 返回空字符串。 */
export function firstPathSegment(url: string): string {
  try {
    const segment = new URL(url).pathname.split('/').find(Boolean) ?? '';
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  } catch {
    return '';
  }
}

/** 生成域名分组键；path 模式使用 `hostname/一级 path`。 */
export function tabGroupKey(
  url: string,
  byFirstPath = false,
  domainOnlyHosts: ReadonlySet<string> = new Set(),
): string {
  const hostname = safeHostname(url);
  if (!byFirstPath || domainOnlyHosts.has(hostname.toLowerCase())) return hostname;
  return `${hostname}/${firstPathSegment(url)}`;
}

/**
 * 把 hostname 简化成 group 标题用的短名称：
 *   aidp.bytedance.net          → aidp        ← 取首段
 *   neeko-aidp.bytedance.net    → neeko       ← 含连字符时取 '-' 前
 *   meego.larkoffice.com        → meego       ← 取首段
 *   bytedance.larkoffice.com    → lark        ← 首段是租户名时回退到根域，再过别名表
 *   www.notion.so               → notion      ← 跳过 www 同理
 *   github.com                  → github
 *   localhost / (local)         → 原样
 *   IP                          → 原样
 */

/** 首段不是真正业务、需要跳过的"租户/占位"段 */
const TENANT_PREFIXES = new Set(['www', 'bytedance']);

/** 根域别名：当回退到 SLD 时把它映射成更熟悉/更短的名称 */
const DOMAIN_ALIAS: Record<string, string> = {
  larkoffice: 'lark',
};

/** 常见 ccTLD 二级后缀（用来识别 SLD 位置） */
const CC_SECOND = new Set(['co', 'com', 'net', 'org', 'gov', 'edu', 'ac']);

export function shortDomainLabel(hostname: string): string {
  if (!hostname || hostname.startsWith('(')) return hostname;
  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return hostname;
  const parts = hostname.split('.').filter(Boolean);
  if (parts.length === 0) return hostname;
  if (parts.length === 1) return parts[0] ?? hostname;

  // 1) 取首段，去掉 '-' 后缀（neeko-aidp → neeko）
  let first = parts[0] ?? '';
  const dashIdx = first.indexOf('-');
  if (dashIdx > 0) first = first.slice(0, dashIdx);

  // 2) 首段是占位/租户名（www / bytedance ...）→ 回退到 SLD
  if (TENANT_PREFIXES.has(first.toLowerCase())) {
    let idx = parts.length - 2;
    if (parts.length >= 3 && CC_SECOND.has(parts[parts.length - 2] ?? '')) {
      idx = parts.length - 3;
    }
    const sld = (parts[idx] ?? hostname).toLowerCase();
    return DOMAIN_ALIAS[sld] ?? sld;
  }

  // 3) 否则用首段；首段也允许走别名表
  const lower = first.toLowerCase();
  return DOMAIN_ALIAS[lower] ?? lower;
}

export function groupByDomain(
  tabs: TabInfo[],
  byFirstPath = false,
  domainOnlyHosts: ReadonlySet<string> = new Set(),
): DomainGroup[] {
  const buckets = new Map<string, DomainGroup>();
  for (const t of tabs) {
    const hostname = safeHostname(t.url);
    const useFirstPath = byFirstPath && !domainOnlyHosts.has(hostname.toLowerCase());
    const firstPath = useFirstPath ? firstPathSegment(t.url) : '';
    const key = useFirstPath ? `${hostname}/${firstPath}` : hostname;
    let group = buckets.get(key);
    if (!group) {
      group = {
        key,
        hostname,
        // Path 名称保留完整业务前缀，不应用域名简称的连字符截断或别名。
        label: firstPath
          ? `${hostname.split('.')[0] || hostname}.${firstPath}`
          : shortDomainLabel(hostname),
        tabs: [],
      };
      buckets.set(key, group);
    }
    group.tabs.push(t);
  }
  return [...buckets.values()];
}

/**
 * 先将不足最少标签数的预分组归入 other，再应用可选的最大组数限制。
 * 最大组数包含 other，other 不受最少标签数限制，始终放在最后。
 */
export function applyGroupingRules(
  groups: DomainGroup[],
  minGroupTabs: number,
  maxGroups?: number,
): DomainGroup[] {
  const minimum = Number.isFinite(minGroupTabs) ? Math.max(1, Math.floor(minGroupTabs)) : 5;
  let keep = groups.filter((group) => group.tabs.length >= minimum);
  const overflow = groups.filter((group) => group.tabs.length > 0 && group.tabs.length < minimum);
  if (maxGroups !== undefined) {
    const limit = Number.isFinite(maxGroups) ? Math.max(1, Math.floor(maxGroups)) : 20;
    keep = keep
      .map((group, index) => ({ group, index }))
      .sort((a, b) => b.group.tabs.length - a.group.tabs.length || a.index - b.index)
      .map(({ group }) => group);
    if (keep.length + (overflow.length > 0 ? 1 : 0) > limit) {
      overflow.push(...keep.slice(limit - 1));
      keep = keep.slice(0, limit - 1);
    }
  }
  if (overflow.length === 0) return keep;
  const other: DomainGroup = {
    key: '__other__',
    hostname: '(other)',
    label: 'other',
    tabs: overflow.flatMap((group) => group.tabs),
  };
  return [...keep, other];
}

/**
 * 把同窗口同分组键的 tab 合并到一个 tab group：
 * 上游应用最少标签数/最大组数规则后，所有最终组（包括单标签 other）均建组。
 *
 * 关键：先把本轮所有 tab 从旧 group 中 ungroup，再统一建新组——
 * 否则 chrome.tabs.group() 不带 groupId 时每次都建新组，会出现同名组重复并排。
 *
 * 返回本轮新增的 group 数。
 */
export async function applyTabGroups(
  windowId: number,
  groups: DomainGroup[],
  orderByGroups = false,
): Promise<number> {
  // 0) 把本轮参与整理的所有 tab 先 ungroup 干净（旧组会因失去成员被 Chrome 自动销毁）
  const allIds: number[] = [];
  for (const g of groups) {
    for (const t of g.tabs) {
      if (t.groupId !== -1) allIds.push(t.id);
    }
  }
  if (allIds.length > 0) {
    try {
      await chrome.tabs.ungroup(allIds);
    } catch (e) {
      console.warn('[CosmoTab] ungroup before regroup failed', e);
    }
  }

  // 1) 最终非空组全部创建，other 即使只有一个标签也保留
  let created = 0;
  const multi = groups.filter((g) => g.tabs.length > 0);
  for (const g of multi) {
    const tabIds = g.tabs.map((t) => t.id);
    try {
      const groupId = await chrome.tabs.group({
        tabIds,
        createProperties: { windowId },
      });
      // Chrome 入组不保证按 tabIds 排列，显式在组内排列，不移动到其他组之间。
      const members = await chrome.tabs.query({ groupId });
      const firstIndex = Math.min(...members.map((tab) => tab.index));
      await chrome.tabs.move(tabIds, { index: firstIndex });
      await chrome.tabGroups.update(groupId, {
        title: g.label,
        color: g.key === '__other__' ? 'grey' : colorForHostname(g.key),
        collapsed: false,
      });
      if (orderByGroups) {
        // 依次移到窗口末尾，确保大组在前，other 最后；不移动受保护标签。
        await chrome.tabGroups.move(groupId, { index: -1 });
      }
      created += 1;
    } catch (e) {
      console.warn('[CosmoTab] group failed for', g.hostname, e);
    }
  }
  return created;
}
