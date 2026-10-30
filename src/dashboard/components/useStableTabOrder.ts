import { useEffect, useMemo, useRef, useState } from 'react';
import type { LastAccessedMap, TabInfo } from '../../core/types';
import { reconcileTabOrder } from '../../core/list-order';

export function useStableTabOrder(
  tabs: TabInfo[],
  timestamps: LastAccessedMap,
  mode: 'created' | 'accessed',
  revision: number,
): ReadonlyMap<number, number> {
  const desired = useMemo(() => [...tabs].sort((a, b) => mode === 'created'
    ? (timestamps[a.id] ?? a.id) - (timestamps[b.id] ?? b.id)
    : (timestamps[b.id] ?? 0) - (timestamps[a.id] ?? 0)).map((tab) => tab.id),
  [tabs, timestamps, mode]);
  const resetKey = `${mode}:${revision}`;
  const [snapshot, setSnapshot] = useState(() => ({ resetKey, order: desired }));
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  // The caller supplies ONLY the timestamps selected by the sorting setting.
  // Access events cannot reset the timer when creation-time sorting is selected.
  const activity = JSON.stringify(tabs.map((tab) => [tab.id, timestamps[tab.id] ?? (mode === 'created' ? tab.id : 0)])
    .sort((a, b) => a[0]! - b[0]!));
  useEffect(() => {
    const next = (JSON.parse(activity) as [number, number][])
      .sort((a, b) => mode === 'created' ? a[1] - b[1] : b[1] - a[1])
      .map(([id]) => id);
    const current = snapshotRef.current;
    if (current.resetKey !== resetKey || (next.length === current.order.length
        && next.every((id, index) => id === current.order[index]))) return;
    const timer = setTimeout(() => setSnapshot({ resetKey, order: next }), 3_000);
    return () => clearTimeout(timer);
  }, [activity, mode, resetKey]);
  const order = snapshot.resetKey === resetKey
    ? reconcileTabOrder(snapshot.order, desired)
    : desired;
  // Membership updates immediately; reordering follows the selected rule after 3s.
  if (snapshot.resetKey !== resetKey || order.length !== snapshot.order.length
      || order.some((id, index) => id !== snapshot.order[index])) {
    setSnapshot({ resetKey, order });
  }
  return new Map(order.map((id, index) => [id, index]));
}
