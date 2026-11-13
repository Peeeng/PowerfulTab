import { useEffect, useRef, useState } from 'react';
import type { LastAccessedMap, TabInfo } from '../core/types';
import { DEFAULT_RETENTION_INDEX, RETENTION_PERIODS, selectStaleTabIds } from '../core/cleanup';
import { getWhitelist } from '../core/storage';
import { useI18n } from './I18nProvider';
import './settings-dialog.css';

interface Props {
  tabs: TabInfo[];
  lastAccessed: LastAccessedMap;
  windowIds: ReadonlySet<number> | null;
  onConfirm: (ids: number[], cutoff: number) => Promise<number>;
  onClose: () => void;
}

export default function CleanupDialog({ tabs, lastAccessed, windowIds, onConfirm, onClose }: Props): JSX.Element {
  const t = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pending = useRef(false);
  const [periodIndex, setPeriodIndex] = useState(DEFAULT_RETENTION_INDEX);
  const [referenceTime] = useState(() => Date.now());
  const [whitelist, setWhitelist] = useState<Set<string> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const period = RETENTION_PERIODS[periodIndex]!;
  const cutoff = referenceTime - period.hours * 3_600_000;
  const ids = whitelist ? selectStaleTabIds(tabs, lastAccessed, cutoff, windowIds, whitelist) : [];

  useEffect(() => {
    let disposed = false;
    const dialog = dialogRef.current;
    dialog?.showModal();
    void getWhitelist().then((value) => {
      if (!disposed) setWhitelist(new Set(value.urls));
    }).catch((cause: unknown) => {
      if (!disposed) setError(cause instanceof Error ? cause.message : t('retry'));
    });
    return () => { disposed = true; dialog?.close(); };
  }, []);

  const confirm = async (): Promise<void> => {
    if (pending.current || !whitelist || ids.length === 0) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(ids, cutoff);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('retry'));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="powerful-settings powerful-cleanup" aria-labelledby="cleanup-title"
      onCancel={(event) => { if (pending.current) event.preventDefault(); else onClose(); }}
      onClick={(event) => {
        if (pending.current || event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right
          || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}>
      <form onSubmit={(event) => { event.preventDefault(); void confirm(); }}>
        <h2 id="cleanup-title">{t('cleanupTabs')}</h2>
        <div className="powerful-cleanup__period">
          <label htmlFor="cleanup-period">{t('retainVisits')}</label>
          <output htmlFor="cleanup-period">{period.label}</output>
        </div>
        <input id="cleanup-period" type="range" min="0" max={RETENTION_PERIODS.length - 1} step="1"
          value={periodIndex} disabled={busy} aria-valuetext={period.label} aria-describedby="cleanup-description"
          onChange={(event) => setPeriodIndex(Number(event.target.value))} />
        <div className="powerful-cleanup__ticks" aria-hidden="true">
          {RETENTION_PERIODS.map((item, index) => <span key={item.label} data-selected={index === periodIndex ? '1' : '0'}>{item.label}</span>)}
        </div>
        <p id="cleanup-description">{t('cleanupDescription', { period: period.label })}</p>
        <p>{windowIds ? t('cleanupSelectedWindows', { count: windowIds.size }) : t('cleanupAllWindows')}</p>
        <p>{t('cleanupProtected')}</p>
        {ids.length > (chrome.sessions.MAX_SESSION_RESULTS ?? 25) && <p>{t('cleanupUndoLimit')}</p>}
        {!error && <p role="status" aria-live="polite">{t(busy ? 'closingTabs' : whitelist ? 'cleanupPreview' : 'loadingCleanup', { count: ids.length })}</p>}
        {error && <p role="alert">{t('cleanupFailed', { error })}</p>}
        <div className="powerful-settings__actions">
          <button type="button" disabled={busy} onClick={onClose}>{t('cancel')}</button>
          <button type="submit" disabled={busy || !whitelist || ids.length === 0}>{t('closeOldTabs', { count: ids.length })}</button>
        </div>
      </form>
    </dialog>
  );
}
