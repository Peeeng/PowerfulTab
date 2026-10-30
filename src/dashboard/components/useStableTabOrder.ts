import { useMemo, useState } from 'react';
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
  const order = snapshot.resetKey === resetKey
    ? reconcileTabOrder(snapshot.order, desired)
    : desired;
  // Adjust this component's state before commit, so refreshes never paint a reordered frame.
  if (snapshot.resetKey !== resetKey || order.length !== snapshot.order.length
      || order.some((id, index) => id !== snapshot.order[index])) {
    setSnapshot({ resetKey, order });
  }
  return new Map(order.map((id, index) => [id, index]));
}
