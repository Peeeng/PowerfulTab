/** Batch presentation updates; URL / native membership changes stay immediate. */
export function createTabUpdateRefresh(refresh: () => void): {
  onUpdated: (tabId: number, change: chrome.tabs.TabChangeInfo) => void;
  dispose: () => void;
} {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const dispose = (): void => {
    clearTimeout(timer);
    timer = undefined;
  };
  return {
    onUpdated(_tabId, change) {
      dispose();
      if (change.url !== undefined || change.pinned !== undefined || change.groupId !== undefined) {
        refresh();
      } else {
        timer = setTimeout(() => { timer = undefined; refresh(); }, 500);
      }
    },
    dispose,
  };
}
