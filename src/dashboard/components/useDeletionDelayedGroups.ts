import { useEffect, useRef, useState } from 'react';
import type { DomainGroup, TabInfo } from '../../core/types';

/** Remove closed rows immediately, but hold group membership/order for 3s. */
export function useDeletionDelayedGroups(
  tabs: TabInfo[],
  desired: DomainGroup[],
  rulesKey: string,
): DomainGroup[] {
  // Ignore titles, icons, timestamps, and active state when detecting structural
  // changes, so ordinary refreshes cannot cancel or restart a deletion delay.
  const members = tabs.map((tab) => [tab.id, `${tab.windowId}:${tab.url}`] as const)
    .sort((a, b) => a[0] - b[0]);
  const signature = JSON.stringify(members);
  const [snapshot, setSnapshot] = useState(() => ({
    rulesKey, signature, members, groups: desired, pending: false, revision: 0,
  }));
  const latest = useRef(desired);
  latest.current = desired;
  let current = snapshot;
  if (snapshot.rulesKey !== rulesKey || snapshot.signature !== signature) {
    const previous = new Map(snapshot.members);
    const next = new Map(members);
    const removed = snapshot.members.some(([id]) => !next.has(id));
    const onlyRemoved = removed && snapshot.rulesKey === rulesKey
      && members.every(([id, value]) => previous.get(id) === value);
    current = {
      rulesKey, signature, members,
      groups: onlyRemoved ? snapshot.groups : desired,
      pending: onlyRemoved,
      revision: snapshot.revision + 1,
    };
    setSnapshot(current);
  }
  useEffect(() => {
    if (!current.pending) return;
    const timer = setTimeout(() => {
      setSnapshot((previous) => ({ ...previous, groups: latest.current, pending: false }));
    }, 3_000);
    return () => clearTimeout(timer);
  }, [current.pending, current.revision]);

  const live = new Map(tabs.map((tab) => [tab.id, tab]));
  return current.groups.map((group) => ({
    ...group,
    tabs: group.tabs.flatMap((tab) => {
      const updated = live.get(tab.id);
      return updated ? [updated] : [];
    }),
  })).filter((group) => group.tabs.length > 0);
}
