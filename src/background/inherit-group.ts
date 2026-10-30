const ACTIVE_HISTORY_KEY = 'cosmotab.activeTabHistory';
type ActiveHistory = Record<number, number[]>;

/** 保存每个窗口最近两个激活标签，跨 service worker 休眠保持来源上下文。 */
export function registerGroupInheritance(): void {
  let history: ActiveHistory = {};
  let pending = chrome.storage.session.get(ACTIVE_HISTORY_KEY).then(async (stored) => {
    history = (stored[ACTIVE_HISTORY_KEY] as ActiveHistory | undefined) ?? {};
    const active = await chrome.tabs.query({ active: true });
    for (const tab of active) {
      if (tab.id != null) remember(tab.windowId, tab.id);
    }
  }).catch((error) => console.warn('[PowerfulTab] active history init failed', error));

  function remember(windowId: number, tabId: number): void {
    history[windowId] = [tabId, ...(history[windowId] ?? []).filter((id) => id !== tabId)].slice(0, 2);
  }

  function enqueue(action: () => Promise<void>): void {
    pending = pending.then(action).catch((error) => {
      console.warn('[PowerfulTab] group inheritance failed', error);
    });
  }

  chrome.tabs.onActivated.addListener(({ windowId, tabId }) => {
    enqueue(async () => {
      remember(windowId, tabId);
      await chrome.storage.session.set({ [ACTIVE_HISTORY_KEY]: history });
    });
  });

  chrome.tabs.onCreated.addListener((tab) => {
    enqueue(async () => {
      if (tab.id == null || tab.pinned || (tab.groupId != null && tab.groupId !== -1)) return;
      const sourceId = tab.openerTabId
        ?? (history[tab.windowId] ?? []).find((id) => id !== tab.id);
      const source = sourceId != null
        ? await chrome.tabs.get(sourceId)
        : (await chrome.tabs.query({ active: true, windowId: tab.windowId })).find((other) => other.id !== tab.id);
      if (!source || source.windowId !== tab.windowId || source.groupId == null || source.groupId === -1) return;
      // 重新读取以防创建后标签已关闭、被固定、移动或用户手动入组。
      const current = await chrome.tabs.get(tab.id);
      if (current.windowId !== source.windowId || current.pinned || current.groupId !== -1) return;
      await chrome.tabs.group({ tabIds: [tab.id], groupId: source.groupId });
    });
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    enqueue(async () => {
      for (const windowId of Object.keys(history)) {
        const id = Number(windowId);
        history[id] = (history[id] ?? []).filter((value) => value !== tabId);
      }
      await chrome.storage.session.set({ [ACTIVE_HISTORY_KEY]: history });
    });
  });
}
