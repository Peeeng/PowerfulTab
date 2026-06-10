const PREFIX = 'powerfultab';
const LOCAL_SUFFIXES = ['settings', 'whitelist', 'lastAccessed', 'searchHistory', 'createdAt'];
let migration: Promise<void> | undefined;

async function migrateArea(area: chrome.storage.StorageArea, suffixes: string[]): Promise<void> {
  const stored = await area.get(null);
  const updates: Record<string, unknown> = {};
  const replaced: string[] = [];
  for (const suffix of suffixes) {
    const target = `${PREFIX}.${suffix}`;
    // Extension storage belongs to this extension. Discover the previous
    // namespace by the known data suffix, without keeping an old brand alias.
    const candidates = Object.keys(stored).filter((key) => key !== target && key.endsWith(`.${suffix}`));
    if (candidates.length !== 1) continue;
    const source = candidates[0]!;
    if (!Object.prototype.hasOwnProperty.call(stored, target)) updates[target] = stored[source];
    replaced.push(source);
  }
  if (Object.keys(updates).length > 0) await area.set(updates);
  // Remove old keys only after the replacement values have been persisted.
  if (replaced.length > 0) await area.remove(replaced);
}

/** All storage reads/writes wait for the same migration, including worker start. */
export function migrateStorage(): Promise<void> {
  migration ??= Promise.all([
    migrateArea(chrome.storage.local, LOCAL_SUFFIXES),
    migrateArea(chrome.storage.session, ['activeTabHistory']),
  ]).then(() => undefined).catch((error: unknown) => {
    migration = undefined;
    throw error;
  });
  return migration;
}
