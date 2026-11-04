import { useEffect, useMemo, useState } from 'react';
import type { LastAccessedMap, TabInfo } from '../../core/types';
import { applyGroupingRules, groupByDomain, safeHostname } from '../../core/grouping';
import { matchesTabSearch } from '../../core/search';
import { useStableTabOrder } from './useStableTabOrder';
import { useDeletionDelayedGroups } from './useDeletionDelayedGroups';
import { useI18n } from '../../components/I18nProvider';
import type { Translator } from '../../core/i18n';

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
  domainPathWhitelist: ReadonlySet<string>;
  maxGroupCount: number;
  minGroupTabs: number;
  collapsed: Set<string>;
  onToggleCollapse: (key: string) => void;
  onActivate: (tab: TabInfo) => void;
  onDuplicate: (tab: TabInfo) => void;
  onMove: (tab: TabInfo) => void;
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

function formatAgo(ts: number | undefined, t: Translator): string {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  if (diff < 60_000) return t('justNow');
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
    <svg className="powerful-section__chevron" viewBox="0 0 12 12" aria-hidden>
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
      className="powerful-doodle"
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
      className="powerful-empty__doodle"
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
  onMove: () => void;
  onClose: () => void;
}

function Row({ tab, ts, active, focused, windowHue, showHost, onActivate, onDuplicate, onMove, onClose }: RowProps): JSX.Element {
  const t = useI18n();
  const stale = freshness(ts) < 0.05 ? '1' : '0';
  return (
    <div
      className="powerful-row"
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
      <img className="powerful-row__fav" src={faviconUrl(tab.url)} alt="" />
      <span className="powerful-row__title" title={tab.url}>{active && <span className="powerful-row__window" title={`${t('activeWindow', { id: tab.windowId })}${focused ? t('currentWindow') : ''}`}>W{tab.windowId}</span>}{tab.title || tab.url}</span>
      {showHost && <span className="powerful-row__host">{safeHostname(tab.url)}</span>}
      <div className="powerful-row__meta">
      <span className="powerful-row__time">{formatAgo(ts, t)}</span>
      <div className="powerful-row__actions">
      <button className="powerful-row__close powerful-row__move" aria-label={t('moveTab')} title={t('moveTab')}
        onClick={(event) => { event.stopPropagation(); onMove(); }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M13 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-8M13 3h8v8M21 3l-11 11" />
        </svg>
      </button>
      <button className="powerful-row__close powerful-row__duplicate" aria-label={t('duplicateTab')} title={t('duplicateTab')} onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" /></svg>
      </button>
      <button
        className="powerful-row__close"
        aria-label={t('closeTab')}
        title={t('closeTabTitle')}
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
  domainPathWhitelist,
  maxGroupCount,
  minGroupTabs,
  collapsed,
  onToggleCollapse,
  onActivate,
  onDuplicate,
  onMove,
  onClose,
  onCloseGroup,
}: Props): JSX.Element {
  const t = useI18n();
  const [recentAccessed, setRecentAccessed] = useState(lastAccessed);
  // Compare timestamp values, not refreshed object identities. Activation
  // highlighting and ordinary tab refreshes must not restart this debounce.
  const recentActivity = JSON.stringify(Object.entries(lastAccessed).sort(([a], [b]) => Number(a) - Number(b)));
  useEffect(() => {
    const timer = setTimeout(() => {
      setRecentAccessed(Object.fromEntries(JSON.parse(recentActivity) as [string, number][]));
    }, 500);
    return () => clearTimeout(timer);
  }, [recentActivity]);
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
  const desiredGroups = useMemo(() => applyGroupingRules(
    groupByDomain(tabs, groupByFirstPath, pathDomainWhitelist, domainPathWhitelist), minGroupTabs, maxGroupCount,
  ), [tabs, groupByFirstPath, pathDomainWhitelist, domainPathWhitelist, minGroupTabs, maxGroupCount]);
  const groupingRulesKey = JSON.stringify([
    groupByFirstPath, [...pathDomainWhitelist].sort(), [...domainPathWhitelist].sort(),
    minGroupTabs, maxGroupCount, orderRevision,
  ]);
  const plannedGroups = useDeletionDelayedGroups(tabs, desiredGroups, groupingRulesKey);
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
      .filter((tab) => (recentAccessed[tab.id] ?? 0) > 0 && matchesTabSearch(tab, searchQuery))
      .sort((a, b) => (recentAccessed[b.id] ?? 0) - (recentAccessed[a.id] ?? 0))
      .slice(0, 8);
  }, [tabs, recentAccessed, searchQuery]);

  const totalDomains = groups.length;
  const totalTabs = groups.reduce((count, group) => count + group.tabs.length, 0);

  if (searchQuery.trim() && totalTabs === 0) {
    return <div className="powerful-empty"><span className="powerful-empty__title">{t('noMatches')}</span><span className="powerful-empty__hint">{t('trySearch')}</span></div>;
  }

  if (tabs.length === 0) {
    return (
      <div className="powerful-empty">
        <ZzzDoodle />
        <span className="powerful-empty__title">{t('quiet')}</span>
        <span className="powerful-empty__hint">{t('nothingOpen')}</span>
      </div>
    );
  }

  const recentCollapsed = !searchQuery.trim() && collapsed.has('__recent__');

  const recentLabel = (() => {
    const top = recent[0];
    if (!top) return t('newestFirst');
    const ago = Date.now() - (lastAccessed[top.id] ?? 0);
    if (ago < 60_000) return t('justVisited');
    if (ago < 600_000) return t('visitedEarlier');
    return t('recentActivity');
  })();

  return (
    <div className="powerful-list">
      <div className="powerful-list__summary">
        <span>
          {t('summary', { tabs: totalTabs, groups: totalDomains })}
        </span>
        <Squiggle />
      </div>

      {recent.length > 0 && (
        <section
          className="powerful-section powerful-section--recent"
          data-collapsed={recentCollapsed ? '1' : '0'}
        >
          <div
            className="powerful-section__head"
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
            <Sparkle className="powerful-section__sparkle" />
            <span className="powerful-section__title">{t('recent')}</span>
            <span className="powerful-section__count">{recent.length}</span>
            <span className="powerful-section__time">{recentLabel}</span>
          </div>
          {!recentCollapsed && (
            <div className="powerful-section__body">
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
                  onMove={() => onMove(t)}
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
            className="powerful-section"
            key={g.key}
            data-collapsed={isCollapsed ? '1' : '0'}
          >
            <div
              className="powerful-section__head"
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
              <img className="powerful-section__fav" src={faviconUrl(top?.url ?? '')} alt="" />
              <span className="powerful-section__title">{g.label}</span>
              <span className="powerful-section__count">{g.tabs.length}</span>
              <span className="powerful-section__time">{formatAgo(g.hottest, t)}</span>
              <div className="powerful-section__actions">
                <button
                  className="powerful-section__action"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseGroup(g.hostname, g.tabs.map((t) => t.id));
                  }}
                >
                  {t('closeGroup')}
                </button>
              </div>
            </div>
            {!isCollapsed && (
              <div className="powerful-section__body">
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
                    onMove={() => onMove(t)}
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
