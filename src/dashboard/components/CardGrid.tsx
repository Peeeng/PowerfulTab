import { useMemo } from 'react';
import type { LastAccessedMap, TabInfo } from '../../core/types';
import { applyGroupingRules, groupByDomain, safeHostname } from '../../core/grouping';
import { matchesTabSearch } from '../../core/search';
import { useStableTabOrder } from './useStableTabOrder';

interface Props {
  tabs: TabInfo[];
  searchQuery: string;
  lastAccessed: LastAccessedMap;
  createdAt: LastAccessedMap;
  groupTabSort: 'created' | 'accessed';
  orderRevision: number;
  focusedWindowId?: number;
  groupByFirstPath: boolean;
  pathDomainWhitelist: ReadonlySet<string>;
  maxGroupCount: number;
  minGroupTabs: number;
  collapsed: Set<string>;
  onToggleCollapse: (key: string) => void;
  onActivate: (tab: TabInfo) => void;
  onDuplicate: (tab: TabInfo) => void;
  onClose: (ids: number[]) => void;
  onCloseGroup: (hostname: string, ids: number[]) => void;
}

function faviconUrl(url: string): string {
  try {
    const u = new URL(chrome.runtime.getURL('/_favicon/'));
    u.searchParams.set('pageUrl', url);
    u.searchParams.set('size', '32');
    return u.toString();
  } catch {
    return '';
  }
}

function formatAgo(ts: number | undefined): string {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 30 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d`;
  return new Date(ts).toISOString().slice(0, 10);
}

function freshness(ts: number | undefined): number {
  if (!ts) return 0;
  const diff = Date.now() - ts;
  if (diff <= 30 * 60_000) return 1;
  if (diff >= 24 * 3_600_000) return 0;
  return 1 - (diff - 30 * 60_000) / (24 * 3_600_000 - 30 * 60_000);
}

/** Stable hash → 0..359 hue, derived from hostname. Same domain → same drift. */
function hueFromHostname(host: string): number {
  let h = 0;
  for (let i = 0; i < host.length; i++) {
    h = (h * 31 + host.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

/** Stable saturation jitter — 35..65 — derived from hostname. */
function satFromHostname(host: string): number {
  let h = 0;
  for (let i = 0; i < host.length; i++) {
    h = (h * 17 + host.charCodeAt(i) * 7) >>> 0;
  }
  return 35 + (h % 30);
}

function ChevronDown(): JSX.Element {
  return (
    <svg className="cosmo-section__chevron" viewBox="0 0 12 12" aria-hidden>
      <path
        d="M3 4.5 L6 7.5 L9 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function CloseGlyph(): JSX.Element {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
      <path
        d="M3 3 L9 9 M9 3 L3 9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A small hand-drawn 4-point sparkle. */
function Sparkle({ className }: { className?: string }): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden>
      <path
        d="M8 1.5 C8.4 5.2 9.8 6.6 13.5 7 C9.8 7.4 8.4 8.8 8 12.5 C7.6 8.8 6.2 7.4 2.5 7 C6.2 6.6 7.6 5.2 8 1.5 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** A wavy hand-drawn squiggle — used in the summary row. */
function Squiggle(): JSX.Element {
  return (
    <svg
      className="cosmo-doodle"
      width="36"
      height="6"
      viewBox="0 0 36 6"
      aria-hidden
    >
      <path
        d="M1 3 Q 5 0, 9 3 T 17 3 T 25 3 T 33 3"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
    </svg>
  );
}

/** Friendly empty-state doodle: a sleeping tab. */
function ZzzDoodle(): JSX.Element {
  return (
    <svg
      className="cosmo-empty__doodle"
      width="56"
      height="48"
      viewBox="0 0 64 56"
      aria-hidden
    >
      <path
        d="M8 18 L8 46 L56 46 L56 18 L48 18 L44 12 L20 12 L16 18 Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray="3 2"
      />
      <path
        d="M40 6 L48 6 L40 14 L48 14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M52 2 L58 2 L52 8 L58 8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}

interface RowProps {
  tab: TabInfo;
  ts: number | undefined;
  active: boolean;
  focused: boolean;
  windowHue: number;
  showHost: boolean;
  onActivate: () => void;
  onDuplicate: () => void;
  onClose: () => void;
}

function Row({ tab, ts, active, focused, windowHue, showHost, onActivate, onDuplicate, onClose }: RowProps): JSX.Element {
  const stale = freshness(ts) < 0.05 ? '1' : '0';
  return (
    <div
      className="cosmo-row"
      data-active={active ? '1' : '0'}
      data-focused={focused ? '1' : '0'}
      style={{ '--active-window-hue': String(windowHue) } as React.CSSProperties}
      data-stale={stale}
      data-show-host={showHost ? '1' : '0'}
      onClick={onActivate}
      onMouseDown={(e) => {
        // Mouse activation must not move keyboard focus to a row that may be elsewhere.
        if (e.button === 0 && !(e.target as HTMLElement).closest('button')) e.preventDefault();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter') onActivate();
        if (e.key === 'Backspace' || e.key === 'Delete') {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <img className="cosmo-row__fav" src={faviconUrl(tab.url)} alt="" />
      <span className="cosmo-row__title" title={tab.url}>{active && <span className="cosmo-row__window" title={`窗口 ${tab.windowId} 当前标签${focused ? '（当前窗口）' : ''}`}>W{tab.windowId}</span>}{tab.title || tab.url}</span>
      {showHost && <span className="cosmo-row__host">{safeHostname(tab.url)}</span>}
      <div className="cosmo-row__meta">
      <span className="cosmo-row__time">{formatAgo(ts)}</span>
      <div className="cosmo-row__actions">
      <button className="cosmo-row__close cosmo-row__duplicate" aria-label="复制此标签页" title="复制此标签页" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" /></svg>
      </button>
      <button
        className="cosmo-row__close"
        aria-label="关闭此标签页"
        title="关闭此标签页 (Backspace)"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <CloseGlyph />
      </button>
      </div>
      </div>
    </div>
  );
}

export default function CardGrid({
  tabs,
  searchQuery,
  lastAccessed,
  createdAt,
  groupTabSort,
  orderRevision,
  focusedWindowId,
  groupByFirstPath,
  pathDomainWhitelist,
  maxGroupCount,
  minGroupTabs,
  collapsed,
  onToggleCollapse,
  onActivate,
  onDuplicate,
  onClose,
  onCloseGroup,
}: Props): JSX.Element {
  const tabRanks = useStableTabOrder(tabs, groupTabSort === 'created' ? createdAt : lastAccessed, groupTabSort, orderRevision);
  const windowColors = useMemo(() => {
    // 窗口 ID 固定映射到 10 色循环；切换、关闭其他窗口或搜索不会改变其颜色。
    const hues = [210, 30, 145, 270, 330, 185, 60, 115, 245, 0];
    const windows = [...new Set(tabs.map((tab) => tab.windowId))]
      .sort((a, b) => a - b);
    const colors = new Map<number, number>();
    windows.forEach((id) => colors.set(id, hues[((id % hues.length) + hues.length) % hues.length]!));
    return colors;
  }, [tabs]);
  const plannedGroups = useMemo(() => applyGroupingRules(
    groupByDomain(tabs, groupByFirstPath, pathDomainWhitelist), minGroupTabs, maxGroupCount,
  ), [tabs, groupByFirstPath, pathDomainWhitelist, minGroupTabs, maxGroupCount]);
  const groups = useMemo(() => {
    // 先计算完整分组再筛选，避免搜索让原组因不足最少标签数而归入 other。
    const displayGroups = plannedGroups
      .map((g) => ({ ...g, tabs: g.tabs.filter((tab) => matchesTabSearch(tab, searchQuery)) }))
      .filter((g) => g.tabs.length > 0)
      .map((g) => {
        const sorted = [...g.tabs].sort(
          (a, b) => (tabRanks.get(a.id) ?? 0) - (tabRanks.get(b.id) ?? 0),
        );
        const hottest = Math.max(0, ...sorted.map((tab) => lastAccessed[tab.id] ?? 0));
        return { ...g, tabs: sorted, hottest };
      });
    return displayGroups;
  }, [plannedGroups, lastAccessed, tabRanks, searchQuery]);

  const recent = useMemo(() => {
    return [...tabs]
      .filter((tab) => (lastAccessed[tab.id] ?? 0) > 0 && matchesTabSearch(tab, searchQuery))
      .sort((a, b) => (lastAccessed[b.id] ?? 0) - (lastAccessed[a.id] ?? 0))
      .slice(0, 8);
  }, [tabs, lastAccessed, searchQuery]);

  const totalDomains = groups.length;
  const totalTabs = groups.reduce((count, group) => count + group.tabs.length, 0);

  if (searchQuery.trim() && totalTabs === 0) {
    return <div className="cosmo-empty"><span className="cosmo-empty__title">没有匹配的标签</span><span className="cosmo-empty__hint">试试其他关键词，或清空搜索</span></div>;
  }

  if (tabs.length === 0) {
    return (
      <div className="cosmo-empty">
        <ZzzDoodle />
        <span className="cosmo-empty__title">浏览器很安静</span>
        <span className="cosmo-empty__hint">什么都没打开 — 这一刻属于你 ✿</span>
      </div>
    );
  }

  const recentCollapsed = !searchQuery.trim() && collapsed.has('__recent__');

  const recentLabel = (() => {
    const top = recent[0];
    if (!top) return '时间倒序';
    const ago = Date.now() - (lastAccessed[top.id] ?? 0);
    if (ago < 60_000) return '你刚刚还在看';
    if (ago < 600_000) return '不久前路过';
    return '最近的足迹';
  })();

  return (
    <div className="cosmo-list">
      <div className="cosmo-list__summary">
        <span>
          {totalTabs} tabs · {totalDomains} groups
        </span>
        <Squiggle />
      </div>

      {recent.length > 0 && (
        <section
          className="cosmo-section cosmo-section--recent"
          data-collapsed={recentCollapsed ? '1' : '0'}
        >
          <div
            className="cosmo-section__head"
            onClick={() => onToggleCollapse('__recent__')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleCollapse('__recent__');
              }
            }}
          >
            <ChevronDown />
            <Sparkle className="cosmo-section__sparkle" />
            <span className="cosmo-section__title">Recent</span>
            <span className="cosmo-section__count">{recent.length}</span>
            <span className="cosmo-section__time">{recentLabel}</span>
          </div>
          {!recentCollapsed && (
            <div className="cosmo-section__body">
              {recent.map((t) => (
                <Row
                  key={`recent-${t.id}`}
                  tab={t}
                  ts={lastAccessed[t.id]}
                  active={t.active}
                  focused={t.windowId === focusedWindowId}
                  windowHue={windowColors.get(t.windowId) ?? 210}
                  showHost
                  onActivate={() => onActivate(t)}
                  onDuplicate={() => onDuplicate(t)}
                  onClose={() => onClose([t.id])}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {groups.map((g) => {
        const isCollapsed = !searchQuery.trim() && collapsed.has(g.key);
        const top = g.tabs[0];
        const hue = hueFromHostname(g.hostname);
        const sat = satFromHostname(g.hostname);
        const headStyle = {
          ['--section-hue' as string]: String(hue),
          ['--section-sat' as string]: `${sat}%`,
        } as React.CSSProperties;
        return (
          <section
            className="cosmo-section"
            key={g.key}
            data-collapsed={isCollapsed ? '1' : '0'}
          >
            <div
              className="cosmo-section__head"
              style={headStyle}
              onClick={() => onToggleCollapse(g.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleCollapse(g.key);
                }
              }}
            >
              <ChevronDown />
              <img className="cosmo-section__fav" src={faviconUrl(top?.url ?? '')} alt="" />
              <span className="cosmo-section__title">{g.label}</span>
              <span className="cosmo-section__count">{g.tabs.length}</span>
              <span className="cosmo-section__time">{formatAgo(g.hottest)}</span>
              <div className="cosmo-section__actions">
                <button
                  className="cosmo-section__action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseGroup(g.hostname, g.tabs.map((t) => t.id));
                  }}
                >
                  关闭整组
                </button>
              </div>
            </div>
            {!isCollapsed && (
              <div className="cosmo-section__body">
                {g.tabs.map((t) => (
                  <Row
                    key={t.id}
                    tab={t}
                    ts={lastAccessed[t.id]}
                    active={t.active}
                    focused={t.windowId === focusedWindowId}
                    windowHue={windowColors.get(t.windowId) ?? 210}
                    showHost={g.key === '__other__'}
                    onActivate={() => onActivate(t)}
                    onDuplicate={() => onDuplicate(t)}
                    onClose={() => onClose([t.id])}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
