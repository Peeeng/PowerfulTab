import { useEffect, useState } from 'react';
import type { LastAccessedMap, TabInfo } from '../../core/types';

/** Keep Recent membership and order unchanged until access activity settles for 10s. */
export function useDelayedRecentOrder(
  tabs: TabInfo[],
  timestamps: LastAccessedMap,
  revision: number,
): readonly number[] {
  // Include timestamps, not just rank: repeated activation resets the idle timer.
  // Sort by ID so unrelated browser index moves and ordinary refreshes do not reset it.
  const activity = JSON.stringify(tabs
    .filter((tab) => (timestamps[tab.id] ?? 0) > 0)
    .map((tab) => [tab.id, timestamps[tab.id]] as [number, number])
    .sort((a, b) => a[0] - b[0]));
  const [snapshot, setSnapshot] = useState<{ order: number[]; revision: number }>(() => ({
    order: [], revision,
  }));

  useEffect(() => {
    const desired = (JSON.parse(activity) as [number, number][])
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
    if (snapshot.order.length === 0 || snapshot.revision !== revision) {
      setSnapshot({ order: desired, revision });
      return;
    }
    const timer = setTimeout(() => setSnapshot({ order: desired, revision }), 10_000);
    return () => clearTimeout(timer);
    // Snapshot commits must not start a second timer; only activity or explicit organize resets it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity, revision]);

  const live = new Set(tabs.map((tab) => tab.id));
  return snapshot.order.filter((id) => live.has(id));
}
