/** Only normal windows in the tab's browsing mode can receive it. */
export async function getMoveDestinations(tabId: number): Promise<chrome.windows.Window[]> {
  const [source, windows] = await Promise.all([
    chrome.tabs.get(tabId),
    chrome.windows.getAll({ populate: true, windowTypes: ['normal'] }),
  ]);
  return windows.filter((window) => window.id != null && window.id !== source.windowId
    && window.incognito === source.incognito).sort((a, b) => a.id! - b.id!);
}

/** Revalidate at execution time and preserve the destination's active tab. */
export async function moveTabToWindow(tabId: number, windowId: number): Promise<void> {
  const [source, destination] = await Promise.all([
    chrome.tabs.get(tabId), chrome.windows.get(windowId, { populate: true }),
  ]);
  if (source.windowId === windowId) return;
  if (destination.type !== 'normal' || destination.incognito !== source.incognito) {
    throw new Error('Destination must be a normal window in the same browsing mode');
  }
  const active = destination.tabs?.find((item) => item.active);
  // Chrome removes the source native group when moving across windows.
  await chrome.tabs.move(tabId, { windowId, index: -1 });
  const moved = await chrome.tabs.get(tabId);
  if (moved.active && active?.id != null) await chrome.tabs.update(active.id, { active: true });
}
