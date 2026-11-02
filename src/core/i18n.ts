import type { Language } from './types';

export const en = {
  loading: 'Loading…', settings: 'Settings', language: 'Language',
  languageHint: 'English is the default. Save to apply the language to all PowerfulTab views. Your tab titles and group names are not translated.',
  organizeMode: 'Organize by', domainMode: 'Domain', pathMode: 'First-level path',
  organizeHint: 'Organize groups tabs without closing them. Choose domain or first-level path. Deduplicate only closes tabs with identical full URLs.',
  domainWhitelist: 'Domain whitelist', pathWhitelist: 'Path whitelist',
  domainWhitelistHint: 'Domain mode only: listed domains use first-level path grouping. Separate exact hostnames with commas, spaces, or new lines. Subdomains are not included automatically.',
  pathWhitelistHint: 'Path mode only: listed domains use domain grouping. Separate exact hostnames with commas, spaces, or new lines. Subdomains are not included automatically.',
  minTabs: 'Minimum tabs', minTabsHint: 'Default: 3. A planned group needs at least this many tabs; smaller groups go to other.',
  maxGroups: 'Maximum groups', maxGroupsHint: 'Always enabled. Default: 15, including other. Larger groups take priority; excess smaller groups go to other.',
  tabSort: 'Tab order', created: 'Created', accessed: 'Last visited',
  tabSortHint: 'Created: oldest first. Last visited: newest first. Reordering is debounced for 3 seconds. Existing tabs use first-recorded order when creation time is unknown.',
  searchRetention: 'Search history', searchRetentionHint: 'Default: 1 saved search. Set to 0 to disable search history.',
  searchTimeout: 'Search clear delay', searchTimeoutHint: 'Seconds; default: 60. Typing restarts the timer. Set to 0 to disable automatic clearing. Saved search history is kept.',
  theme: 'Theme', themeHint: 'Choose a light or dark interface.', light: 'Light', dark: 'Dark',
  cancel: 'Cancel', save: 'Save', saving: 'Saving…', saveFailed: 'Could not save. Please try again.',
  organize: 'Organize', organizing: 'Organizing…', organizeTitle: 'Group tabs without closing them',
  dedupe: 'Deduplicate', deduping: 'Deduplicating…', dedupeTitle: 'Close duplicates only when the entire URL matches, including path, parameters, and hash',
  switchLight: 'Switch to light theme', switchDark: 'Switch to dark theme', switchTheme: 'Switch theme',
  grouped: 'Grouped {tabs} tabs · {groups} groups', deduped: 'Closed {count} exact duplicates',
  failed: 'Failed: {error}', unknownError: 'Unknown error', activateFailed: 'Could not switch tabs', duplicateFailed: 'Could not duplicate tab',
  moved: 'Tab moved', closed: 'Closed {count} tabs', undo: 'Undo',
  search: 'Search tabs', searchLabel: 'Search URLs, titles, or pinyin initials. Separate keywords with spaces.',
  searchPlaceholder: 'Search URLs, titles, initials…', searchHistory: 'Recent searches',
  historySaveFailed: 'Could not save search history', historyLoadFailed: 'Could not load search history',
  moveTab: 'Move to another window', loadingWindows: 'Loading windows…',
  windowsLoadFailed: 'Could not load windows. The tab may have been closed.',
  noWindows: 'No other windows available. Open another window in the same browsing mode first.',
  sameMode: 'Choose a normal window in the same browsing mode.', moveFailed: 'Move failed: {error}', retry: 'Please try again',
  window: 'Window {id}', windowTabs: 'Window {id} · {count} tabs', emptyWindow: 'Empty window', moving: 'Moving…',
  activeWindow: 'Active tab in window {id}', currentWindow: ' (current window)',
  duplicateTab: 'Duplicate tab', closeTab: 'Close tab', closeTabTitle: 'Close tab (Backspace)', closeGroup: 'Close group',
  justNow: 'Just now', noMatches: 'No matching tabs', trySearch: 'Try other keywords or clear the search',
  quiet: 'Your browser is quiet', nothingOpen: 'Nothing open — enjoy the moment ✿',
  recent: 'Recent', newestFirst: 'Newest first', justVisited: 'You were just here', visitedEarlier: 'Visited a moment ago', recentActivity: 'Recent activity',
  summary: '{tabs} tabs · {groups} groups', tabs: 'Tabs', windows: 'Windows', domains: 'Domains',
  tagline: 'Bring order to your tabs', openView: 'Open tab manager →',
  viewTitle: 'PowerfulTab · Tab Manager', sideTitle: 'PowerfulTab · Side Panel',
} as const;

export type MessageKey = keyof typeof en;
export type MessageParams = Record<string, string | number>;
export interface LocalizedMessage { key: MessageKey; params?: MessageParams }
export type Translator = (key: MessageKey, params?: MessageParams) => string;

export const zhCN: Record<MessageKey, string> = {
  loading: '加载中…', settings: '设置', language: '语言',
  languageHint: '默认英语，保存后应用到所有 PowerfulTab 界面。标签标题与分组名称不翻译。',
  organizeMode: '整理方式', domainMode: '按域名分组', pathMode: '按一级 Path 分组',
  organizeHint: '一键整理只分组，不关闭标签。可按域名或一级 Path 分组；去重仅关闭完整链接完全一致的重复标签。',
  domainWhitelist: '域名白名单', pathWhitelist: 'Path白名单',
  domainWhitelistHint: '仅在按域名分组时生效：名单内域名改按一级 Path 分组。支持逗号、空格或换行分隔，精确匹配域名，不自动包含子域名。',
  pathWhitelistHint: '仅在按 Path 分组时生效：名单内域名改按域名分组。支持逗号、空格或换行分隔，精确匹配域名，不自动包含子域名。',
  minTabs: '最少标签数', minTabsHint: '默认 3 个；预分组标签数达到该值才独立成组，否则归入 other。',
  maxGroups: '最多分组数', maxGroupsHint: '始终生效，默认 15 个（含 other）；大组优先，超限的小组合并到 other。',
  tabSort: '组内标签排序', created: '创建时间', accessed: '访问时间',
  tabSortHint: '创建时间从早到晚，访问时间从近到远；需要改变顺序时防抖 3 秒。安装前已有标签按首次记录顺序兜底。',
  searchRetention: '搜索记录保留', searchRetentionHint: '默认保留 1 条搜索记录，设为 0 不记录历史。',
  searchTimeout: '搜索清空时间', searchTimeoutHint: '单位为秒，默认 60；每次输入重新计时，设为 0 不自动清空。搜索历史不受影响。',
  theme: '主题', themeHint: '切换明亮或深色界面。', light: '明亮', dark: '深色',
  cancel: '取消', save: '保存', saving: '保存中…', saveFailed: '保存失败，请重试',
  organize: '一键整理', organizing: '整理中…', organizeTitle: '一键整理：仅分组，不关闭标签',
  dedupe: '去重', deduping: '去重中…', dedupeTitle: '仅关闭完整链接完全一致的重复标签（包含 path、参数和 hash）',
  switchLight: '切换到明亮', switchDark: '切换到深色', switchTheme: '切换主题',
  grouped: '已分组 {tabs} 个标签 · {groups} 个组', deduped: '已关闭完全重复 {count} 个',
  failed: '失败：{error}', unknownError: '未知错误', activateFailed: '切换标签失败', duplicateFailed: '复制标签失败',
  moved: '已移动标签', closed: '已关闭 {count} 个标签', undo: '撤销',
  search: '标签检索', searchLabel: '搜索 URL、标签名称或拼音首字母，多个关键词用空格分隔',
  searchPlaceholder: '搜索 URL、名称或首字母，空格分词…', searchHistory: '最近搜索记录',
  historySaveFailed: '搜索记录保存失败', historyLoadFailed: '搜索记录读取失败',
  moveTab: '移动到其他窗口', loadingWindows: '读取窗口中…', windowsLoadFailed: '无法读取窗口，标签页可能已关闭',
  noWindows: '没有其他可用窗口，请先打开同一浏览模式的新窗口。', sameMode: '请选择同一浏览模式的普通窗口',
  moveFailed: '移动失败：{error}', retry: '请重试', window: '窗口 {id}', windowTabs: '窗口 {id} · {count} 个标签',
  emptyWindow: '空窗口', moving: '移动中…', activeWindow: '窗口 {id} 当前标签', currentWindow: '（当前窗口）',
  duplicateTab: '复制此标签页', closeTab: '关闭此标签页', closeTabTitle: '关闭此标签页 (Backspace)', closeGroup: '关闭整组',
  justNow: '刚刚', noMatches: '没有匹配的标签', trySearch: '试试其他关键词，或清空搜索', quiet: '浏览器很安静', nothingOpen: '什么都没打开 — 这一刻属于你 ✿',
  recent: '最近访问', newestFirst: '时间倒序', justVisited: '你刚刚还在看', visitedEarlier: '不久前路过', recentActivity: '最近的足迹',
  summary: '{tabs} 个标签 · {groups} 个组', tabs: '标签', windows: '窗口', domains: '域名',
  tagline: '让标签页井然有序', openView: '打开标签管理视图 →', viewTitle: 'PowerfulTab · 标签管理', sideTitle: 'PowerfulTab · 侧边栏',
};

export function normalizeLanguage(value: unknown): Language {
  return value === 'zh-CN' ? 'zh-CN' : 'en';
}

export function createTranslator(language: Language = 'en'): Translator {
  const messages = language === 'zh-CN' ? zhCN : en;
  return (key, params = {}) => messages[key].replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match));
}
