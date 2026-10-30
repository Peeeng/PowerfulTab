import type { TabInfo } from './types';

/** Same-window activation never needs to refocus the browser window. */
export async function activateTab(tab: TabInfo, currentWindowId: number | undefined): Promise<void> {
  if (!tab.active) await chrome.tabs.update(tab.id, { active: true });
  if (tab.windowId !== currentWindowId) {
    await chrome.windows.update(tab.windowId, { focused: true });
  }
}
