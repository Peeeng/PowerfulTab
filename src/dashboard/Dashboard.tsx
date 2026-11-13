import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type {
  LastAccessedMap,
  RuntimeMessage,
  RuntimeResponse,
  Settings,
  TabInfo,
  Theme,
} from '../core/types';
import { getCreatedAtMap, getLastAccessedMap, getSettings, getWhitelist, setSettings } from '../core/storage';
import { queryAllTabs } from '../core/tabs';
import { activateTab } from '../core/activate-tab';
import { selectStaleTabIds } from '../core/cleanup';
import { getMoveDestinations, moveTabToWindow } from '../core/move-tab';
import { createTabUpdateRefresh } from './tab-update-refresh';
import Toolbar from './components/Toolbar';
import CardGrid from './components/CardGrid';
import SettingsDialog from '../components/SettingsDialog';
import MoveTabDialog from '../components/MoveTabDialog';
import CleanupDialog from '../components/CleanupDialog';
import TabSearch from './components/TabSearch';
import { I18nProvider } from '../components/I18nProvider';
import { createTranslator, type LocalizedMessage } from '../core/i18n';
import './dashboard.css';

function send<T>(msg: RuntimeMessage): Promise<RuntimeResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (resp: RuntimeResponse<T>) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(resp);
    });
  });
}

interface UndoState {
  count: number;
  /** Chrome session id list to restore via chrome.sessions.restore */
  sessionIds: string[];
}

export default function Dashboard(): JSX.Element {
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const [lastAccessed, setLastAccessed] = useState<LastAccessedMap>({});
  const [createdAt, setCreatedAt] = useState<LastAccessedMap>({});
  const [focusedWindowId, setFocusedWindowId] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<LocalizedMessage | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [movingTab, setMovingTab] = useState<TabInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderRevision, setOrderRevision] = useState(0);
  const [selectedWindows, setSelectedWindows] = useState<Set<number> | null>(null);
  // undefined = closed; null = all windows. Freeze the scope while confirming.
  const [cleanupScope, setCleanupScope] = useState<Set<number> | null | undefined>(undefined);

  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLElement>(null);
  const listScrollTop = useRef(0);
  const refreshVersion = useRef(0);
  const currentWindowId = useRef<number>();
  const movePending = useRef(false);
  const latestActiveTabs = useRef(new Map<number, number>());
  const language = settings?.language ?? 'en';
  const t = useMemo(() => createTranslator(language), [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t(document.body.classList.contains('powerful-body--side') ? 'sideTitle' : 'viewTitle');
  }, [language, t]);

  useLayoutEffect(() => {
    // 行顺序不随激活改变；仍保留刷新前的滚动位置。
    if (listRef.current) listRef.current.scrollTop = listScrollTop.current;
  }, [tabs, lastAccessed, createdAt, focusedWindowId]);

  const refresh = async (resetOrder = false): Promise<void> => {
    const version = ++refreshVersion.current;
    const [s, list, r, created, focused] = await Promise.all([
      getSettings(),
      queryAllTabs(),
      send<LastAccessedMap>({ type: 'getLastAccessed' }),
      getCreatedAtMap(),
      chrome.windows.getLastFocused(),
    ]);
    // Ignore older queries that completed after a newer event/refresh.
    if (version !== refreshVersion.current) return;
    setSettingsState(s);
    setTabs(list.map((tab) => {
      const activeId = latestActiveTabs.current.get(tab.windowId);
      return activeId == null ? tab : { ...tab, active: tab.id === activeId };
    }));
    if (r.ok && r.data) setLastAccessed(r.data);
    setCreatedAt(created);
    setFocusedWindowId(focused.id);
    if (resetOrder) setOrderRevision((value) => value + 1);
  };

  useEffect(() => {
    void chrome.windows.getCurrent().then((window) => { currentWindowId.current = window.id; });
    void refresh();
    const updateRefresh = createTabUpdateRefresh(() => { void refresh(); });
    const handler = (): void => {
      updateRefresh.dispose();
      void refresh();
    };
    chrome.tabs.onCreated.addListener(handler);
    chrome.tabs.onRemoved.addListener(handler);
    chrome.tabs.onUpdated.addListener(updateRefresh.onUpdated);
    chrome.tabs.onMoved.addListener(handler);
    chrome.tabs.onAttached.addListener(handler);
    chrome.tabs.onDetached.addListener(handler);
    const onActivated = ({ tabId, windowId }: chrome.tabs.TabActiveInfo): void => {
      latestActiveTabs.current.set(windowId, tabId);
      setTabs((previous) => previous.map((tab) => tab.windowId === windowId
        ? { ...tab, active: tab.id === tabId }
        : tab));
    };
    const onWindowFocus = (windowId: number): void => {
      if (windowId !== chrome.windows.WINDOW_ID_NONE) setFocusedWindowId(windowId);
    };
    chrome.tabs.onActivated.addListener(onActivated);
    chrome.windows.onFocusChanged.addListener(onWindowFocus);

    // background 写入 lastAccessed → 通过 storage 变化感知，立刻拉新
    const onStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ): void => {
      if (area !== 'local') return;
      if (changes['powerfultab.lastAccessed']) {
        setLastAccessed((changes['powerfultab.lastAccessed'].newValue as LastAccessedMap | undefined) ?? {});
      }
      if (changes['powerfultab.settings']) void refresh();
    };
    chrome.storage.onChanged.addListener(onStorageChange);

    // 定时兜底：让相对时间（"5m / 2h"）随时间推进而重渲染
    const tick = setInterval(() => {
      void refresh();
    }, 30_000);

    return () => {
      chrome.tabs.onCreated.removeListener(handler);
      chrome.tabs.onRemoved.removeListener(handler);
      chrome.tabs.onUpdated.removeListener(updateRefresh.onUpdated);
      chrome.tabs.onMoved.removeListener(handler);
      chrome.tabs.onAttached.removeListener(handler);
      chrome.tabs.onDetached.removeListener(handler);
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.windows.onFocusChanged.removeListener(onWindowFocus);
      chrome.storage.onChanged.removeListener(onStorageChange);
      clearInterval(tick);
      updateRefresh.dispose();
    };
  }, []);


  // Auto-clear undo toast after 5s.
  useEffect(() => {
    if (!undo) return;
    undoTimerRef.current = setTimeout(() => setUndo(null), 5000);
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, [undo]);

  const tabIds = useMemo(() => new Set(tabs.map((t) => t.id)), [tabs]);
  void tabIds;
  const visibleWindows = useMemo(() => {
    if (!selectedWindows) return null;
    const liveIds = new Set(tabs.map((tab) => tab.windowId));
    const live = new Set([...selectedWindows].filter((id) => liveIds.has(id)));
    return live.size > 0 ? live : null;
  }, [selectedWindows, tabs]);
  useEffect(() => {
    setSelectedWindows((previous) => {
      if (!previous) return previous;
      const liveIds = new Set(tabs.map((tab) => tab.windowId));
      const live = new Set([...previous].filter((id) => liveIds.has(id)));
      return live.size === previous.size ? previous : live.size > 0 ? live : null;
    });
  }, [tabs]);

  if (!settings) {
    return <div className="powerful-dash powerful-dash--loading">{t('loading')}</div>;
  }

  const themeClass = settings.theme === 'dark' ? 'powerful-dark' : 'powerful-light';
  const pathDomainWhitelist = new Set(settings.pathDomainWhitelist);
  const domainPathWhitelist = new Set(settings.domainPathWhitelist);

  const apply = async (patch: Partial<Settings>): Promise<void> => {
    const next = await setSettings(patch);
    setSettingsState(next);
  };


  /** Close tabs with undo support: capture session IDs after Chrome closes them. */
  const closeWithUndo = async (ids: number[]): Promise<void> => {
    if (ids.length === 0) return;
    await chrome.tabs.remove(ids);
    // Sessions API needs a beat to populate.
    await new Promise((r) => setTimeout(r, 60));
    let sessionIds: string[] = [];
    try {
      const sessions = await chrome.sessions.getRecentlyClosed({ maxResults: Math.min(ids.length, chrome.sessions.MAX_SESSION_RESULTS ?? 25) });
      sessionIds = sessions
        .map((s) => s.tab?.sessionId ?? s.window?.sessionId)
        .filter((x): x is string => typeof x === 'string')
        .slice(0, ids.length);
    } catch {
      sessionIds = [];
    }
    setUndo({ count: ids.length, sessionIds });
    void refresh();
  };

  const onCleanup = async (previewIds: number[], cutoff: number): Promise<number> => {
    setBusy(true);
    try {
      const [liveTabs, visits, whitelist] = await Promise.all([
        queryAllTabs(), getLastAccessedMap(), getWhitelist(),
      ]);
      const preview = new Set(previewIds);
      const ids = selectStaleTabIds(liveTabs, visits, cutoff, cleanupScope ?? null, new Set(whitelist.urls))
        .filter((id) => preview.has(id));
      await closeWithUndo(ids);
      setHint({ key: 'cleanupDone', params: { count: ids.length } });
      return ids.length;
    } finally {
      setBusy(false);
    }
  };

  const restoreUndo = async (): Promise<void> => {
    if (!undo) return;
    for (const sid of undo.sessionIds) {
      try {
        await chrome.sessions.restore(sid);
      } catch {
        /* ignore individual restore failures */
      }
    }
    setUndo(null);
    void refresh();
  };

  const onOrganize = async (): Promise<void> => {
    setBusy(true);
    setHint({ key: 'organizing' });
    const r = await send<{ closed: number; grouped: number; groupsCreated: number }>({
      type: 'organizeAll',
    });
    setBusy(false);
    if (r.ok && r.data) {
      setHint({ key: 'grouped', params: { tabs: r.data.grouped, groups: r.data.groupsCreated } });
    } else {
      setHint({ key: 'failed', params: { error: r.error ?? t('unknownError') } });
    }
    void refresh(true);
  };

  const onDedupe = async (): Promise<void> => {
    setBusy(true);
    setHint({ key: 'deduping' });
    const r = await send<{ closed: number }>({ type: 'dedupeOnly' });
    setBusy(false);
    setHint(r.ok && r.data ? { key: 'deduped', params: { count: r.data.closed } }
      : { key: 'failed', params: { error: r.error ?? t('unknownError') } });
    void refresh();
  };

  const onActivate = (tab: TabInfo): void => {
    listScrollTop.current = listRef.current?.scrollTop ?? 0;
    void activateTab(tab, currentWindowId.current ?? focusedWindowId)
      .catch(() => setHint({ key: 'activateFailed' }));
  };

  const onDuplicate = (tab: TabInfo): void => {
    void chrome.tabs.duplicate(tab.id).then(() => refresh()).catch(() => setHint({ key: 'duplicateFailed' }));
  };

  const onMove = async (tab: TabInfo): Promise<void> => {
    if (movePending.current || movingTab) return;
    movePending.current = true;
    listScrollTop.current = listRef.current?.scrollTop ?? 0;
    try {
      const destinations = await getMoveDestinations(tab.id);
      if (destinations.length === 1) {
        await moveTabToWindow(tab.id, destinations[0].id!);
        setHint({ key: 'moved' });
        void refresh();
      } else {
        setMovingTab(tab);
      }
    } catch (cause) {
      setHint({ key: 'moveFailed', params: { error: cause instanceof Error ? cause.message : t('retry') } });
    } finally {
      movePending.current = false;
    }
  };

  const onToggleCollapse = (key: string): void => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // No more confirm dialog — single source of close action goes straight to undoable close.
  const onClose = (ids: number[]): void => {
    void closeWithUndo(ids);
  };

  const onCloseGroup = (_hostname: string, ids: number[]): void => {
    void closeWithUndo(ids);
  };

  return (
    <I18nProvider language={language}>
    <div className={`powerful-dash ${themeClass}`}>
      <Toolbar
        busy={busy}
        hint={hint ? t(hint.key, hint.params) : ''}
        theme={settings.theme}
        onTheme={(t: Theme) => void apply({ theme: t })}
        onOrganize={onOrganize}
        onDedupe={onDedupe}
        onSettings={() => setSettingsOpen(true)}
        onCleanup={() => setCleanupScope(visibleWindows ? new Set(visibleWindows) : null)}
      />

      {settingsOpen && <SettingsDialog settings={settings} onSave={apply} onClose={() => setSettingsOpen(false)} />}
      {cleanupScope !== undefined && <CleanupDialog tabs={tabs} lastAccessed={lastAccessed}
        windowIds={cleanupScope} onConfirm={onCleanup} onClose={() => setCleanupScope(undefined)} />}
      {movingTab && <MoveTabDialog tab={movingTab} onClose={() => setMovingTab(null)} onMoved={() => {
        setHint({ key: 'moved' });
        void refresh();
      }} />}

      <TabSearch query={searchQuery} onQuery={setSearchQuery} historyCount={settings.searchHistoryCount}
        clearTimeoutSeconds={settings.searchClearTimeoutSeconds} />

      <main ref={listRef} className="powerful-dash__main" onScroll={(e) => { listScrollTop.current = e.currentTarget.scrollTop; }}>
        <CardGrid
          tabs={tabs}
          searchQuery={searchQuery}
          lastAccessed={lastAccessed}
          createdAt={createdAt}
          groupTabSort={settings.groupTabSort}
          orderRevision={orderRevision}
          recentTabCount={settings.recentTabCount}
          selectedWindows={selectedWindows}
          onSelectWindows={setSelectedWindows}
          focusedWindowId={focusedWindowId}
          groupByFirstPath={settings.groupMode === 'path'}
          pathDomainWhitelist={pathDomainWhitelist}
          domainPathWhitelist={domainPathWhitelist}
          maxGroupCount={settings.maxGroupCount}
          minGroupTabs={settings.minGroupTabs}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          onActivate={onActivate}
          onDuplicate={onDuplicate}
          onMove={(tab) => void onMove(tab)}
          onClose={onClose}
          onCloseGroup={onCloseGroup}
        />
      </main>

      {undo && (
        <div className="powerful-toast" role="status" aria-live="polite">
          <span className="powerful-toast__msg">{t('closed', { count: undo.count })}</span>
          {undo.sessionIds.length > 0 && (
            <button className="powerful-toast__action" onClick={() => void restoreUndo()}>
              {t('undo')}
            </button>
          )}
        </div>
      )}
    </div>
    </I18nProvider>
  );
}
