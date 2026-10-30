import {
  dedupeOnly,
  groupOnly,
  organizeAll,
  sortOnly,
} from '../core/tabs';
import {
  getLastAccessedMap,
  removeLastAccessed,
  setLastAccessedMap,
  updateLastAccessed,
  recordTabCreation,
} from '../core/storage';
import type { RuntimeMessage, RuntimeResponse } from '../core/types';
import { registerGroupInheritance } from './inherit-group';

registerGroupInheritance();

function notifySearch(windowId: number): void {
  const send = (): void => {
    void chrome.runtime.sendMessage({ type: 'focusSearch', windowId }).catch(() => undefined);
  };
  send();
  // 等待侧边栏页面挂载，避免首次消息早于搜索框监听器。
  [150, 400].forEach((delay) => setTimeout(send, delay));
}

chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId != null) notifySearch(tab.windowId);
});

const visiblePanels = new Set<number>();
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'cosmotab-panel-state') return;
  let windowId: number | undefined;
  port.onMessage.addListener((message: { windowId: number; visible: boolean }) => {
    windowId = message.windowId;
    if (message.visible) visiblePanels.add(windowId);
    else visiblePanels.delete(windowId);
  });
  port.onDisconnect.addListener(() => {
    if (windowId != null) visiblePanels.delete(windowId);
  });
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'focus-search-input') {
    // Open even an existing panel to bring focus back from the web page.
    // Keep this call synchronous with the Chrome command's user gesture.
    if (tab?.windowId == null && tab?.id == null) return;
    const options = tab.windowId != null ? { windowId: tab.windowId } : { tabId: tab.id! };
    void chrome.sidePanel.open(options).then(() => {
      if (tab?.windowId != null) notifySearch(tab.windowId);
      else void chrome.windows.getLastFocused().then((window) => {
        if (window.id != null) notifySearch(window.id);
      });
    }).catch((error) => console.warn('[PowerfulTab] focus search failed', error));
    return;
  }
  if (command !== 'focus-search') return;
  const toggle = (windowId: number, activeTabId?: number): void => {
    if (visiblePanels.has(windowId)) {
      const panel = chrome.sidePanel as typeof chrome.sidePanel & { close?: (options: { windowId: number }) => Promise<void> };
      if (panel.close) void panel.close({ windowId }).catch(console.warn);
      else {
        // 旧版本关闭后恢复可用性，下次无需在用户手势前等待 setOptions。
        const options = activeTabId != null ? { tabId: activeTabId } : {};
        void chrome.sidePanel.setOptions({ ...options, enabled: false }).then(() => {
          visiblePanels.delete(windowId);
          setTimeout(() => void chrome.sidePanel.setOptions({ ...options, enabled: true, path: 'sidepanel.html' }), 100);
        }).catch(console.warn);
      }
    } else {
      // 必须直接调用 open，不能先 await 查询，否则可能丢失用户手势。
      void chrome.sidePanel.open({ windowId }).then(() => notifySearch(windowId))
        .catch((error) => console.warn('[PowerfulTab] toggle search panel failed', error));
    }
  };
  if (tab?.windowId != null) toggle(tab.windowId, tab.id);
  else void chrome.windows.getLastFocused().then((window) => {
    if (window.id != null) toggle(window.id);
  });
});

// 恢复旧版关闭逻辑可能留下的禁用配置。
void chrome.sidePanel.setOptions({ enabled: true, path: 'sidepanel.html' });
void chrome.tabs.query({}).then((tabs) => {
  for (const tab of tabs) {
    if (tab.id != null) void chrome.sidePanel.setOptions({ tabId: tab.id, enabled: true, path: 'sidepanel.html' });
  }
});

// 维护 lastAccessed
chrome.tabs.onActivated.addListener(({ tabId }) => {
  void updateLastAccessed(tabId);
});

// 让点击插件图标 = 打开侧边栏（不再弹 popup）
chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel
    ?.setPanelBehavior({ openPanelOnActionClick: true })
    .catch(() => undefined);
});

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id != null) {
    void updateLastAccessed(tab.id);
    void recordTabCreation(tab.id);
  }
});

// 首次遇到已有标签时按其 id 顺序兜底，创建时间未知，不伪造历史时间。
void chrome.tabs.query({}).then((tabs) => {
  for (const tab of [...tabs].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))) {
    if (tab.id != null) void recordTabCreation(tab.id);
  }
});

chrome.tabs.onUpdated.addListener((tabId, info) => {
  // 只在用户真正激活/导航时更新；纯 status:complete 不更新（避免自动刷新页面被算成"刚刚访问"）
  if (info.url) {
    void updateLastAccessed(tabId);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void removeLastAccessed(tabId);
});

/**
 * 仅为缺失时间戳的 tab 兜底：
 * - 优先使用 Chrome 121+ 提供的 tab.lastAccessed（毫秒精度的真实时间）
 * - 否则按 tab 索引错开兜底（避免全部并列"刚刚"）
 * - 已有时间戳的 tab 一律保留，不覆盖
 */
async function bootstrapLastAccessed(): Promise<void> {
  const [tabs, existing] = await Promise.all([
    chrome.tabs.query({}),
    getLastAccessedMap(),
  ]);
  const next = { ...existing };
  const now = Date.now();
  let touched = false;
  // 按 index 倒序：越靠右假设越"旧"（仅为兜底，体感上比统一 now 更合理）
  const ordered = [...tabs].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  ordered.forEach((t, i) => {
    if (t.id == null) return;
    if (next[t.id]) return; // 保留已有
    const real = (t as chrome.tabs.Tab & { lastAccessed?: number }).lastAccessed;
    if (typeof real === 'number' && real > 0) {
      next[t.id] = real;
    } else {
      // 错开 1 秒，避免被一锅端识别为"刚刚"
      next[t.id] = now - i * 1000;
    }
    touched = true;
  });
  if (touched) await setLastAccessedMap(next);
}

chrome.runtime.onStartup.addListener(() => {
  void bootstrapLastAccessed();
});

chrome.runtime.onInstalled.addListener(() => {
  void bootstrapLastAccessed();
});

// 消息桥
chrome.runtime.onMessage.addListener(
  (msg: RuntimeMessage, _sender, sendResponse: (r: RuntimeResponse) => void) => {
    (async () => {
      try {
        switch (msg.type) {
          case 'getLastAccessed': {
            const map = await getLastAccessedMap();
            sendResponse({ ok: true, data: map });
            return;
          }
          case 'organizeAll': {
            const summary = await organizeAll();
            sendResponse({ ok: true, data: summary });
            return;
          }
          case 'dedupeOnly': {
            const n = await dedupeOnly();
            sendResponse({ ok: true, data: { closed: n } });
            return;
          }
          case 'sortOnly': {
            await sortOnly(msg.payload.sortScope);
            sendResponse({ ok: true });
            return;
          }
          case 'groupOnly': {
            const n = await groupOnly();
            sendResponse({ ok: true, data: { groupsCreated: n } });
            return;
          }
          default: {
            sendResponse({ ok: false, error: 'unknown message' });
          }
        }
      } catch (e) {
        sendResponse({ ok: false, error: (e as Error).message });
      }
    })();
    return true; // 异步响应
  },
);
