// 核心类型定义

export interface TabInfo {
  id: number;
  windowId: number;
  url: string;
  title: string;
  favIconUrl?: string;
  pinned: boolean;
  active: boolean;
  groupId: number;
  index: number;
}

export interface DomainGroup {
  /** 稳定的分组键；按一级路径分组时包含 hostname 与首段 path。 */
  key: string;
  hostname: string;
  /** Chrome 标签组及 Dashboard 展示的名称。 */
  label: string;
  tabs: TabInfo[];
}

export type SortMode = 'lastAccessed' | 'domain';
export type SortScope = 'perWindow' | 'merged';
export type GroupMode = 'domain' | 'path';
export type Theme = 'light' | 'dark';

export interface Settings {
  groupMode: GroupMode;
  sortScope: SortScope;
  theme: Theme;
  /** Path 模式下仅按域名分组的 hostname，不改变去重规则。 */
  pathDomainWhitelist: string[];
  /** 最大最终分组数（包含 other）。 */
  maxGroupCount: number;
  /** 预分组达到此标签数量才独立成组，否则归入 other。 */
  minGroupTabs: number;
  groupTabSort: 'created' | 'accessed';
  searchHistoryCount: number;
}

export interface Whitelist {
  /** 用户手动锁定不参与整理的 url 列表 */
  urls: string[];
}

export interface OrganizeSummary {
  closed: number;
  grouped: number;
  groupsCreated: number;
}

export type LastAccessedMap = Record<number, number>;

export type RuntimeMessage =
  | { type: 'getLastAccessed' }
  | { type: 'organizeAll' }
  | { type: 'dedupeOnly' }
  | { type: 'sortOnly'; payload: { sortScope: SortScope } }
  | { type: 'groupOnly' };

export interface RuntimeResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
