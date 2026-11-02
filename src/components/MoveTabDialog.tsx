import { useEffect, useRef, useState } from 'react';
import type { TabInfo } from '../core/types';
import { useI18n } from './I18nProvider';
import type { LocalizedMessage } from '../core/i18n';
import './settings-dialog.css';

interface Props {
  tab: TabInfo;
  onMoved: () => void;
  onClose: () => void;
}

export default function MoveTabDialog({ tab, onMoved, onClose }: Props): JSX.Element {
  const t = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [windows, setWindows] = useState<chrome.windows.Window[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<LocalizedMessage | null>(null);

  useEffect(() => {
    let disposed = false;
    const dialog = dialogRef.current;
    dialog?.showModal();
    void Promise.all([
      chrome.tabs.get(tab.id),
      chrome.windows.getAll({ populate: true, windowTypes: ['normal'] }),
    ]).then(([source, all]) => {
      if (disposed) return;
      setWindows(all.filter((window) => window.id != null && window.id !== source.windowId
        && window.incognito === source.incognito).sort((a, b) => a.id! - b.id!));
      setLoading(false);
    }).catch(() => {
      if (!disposed) { setError({ key: 'windowsLoadFailed' }); setLoading(false); }
    });
    return () => { disposed = true; dialog?.close(); };
  }, [tab.id]);

  const move = async (windowId: number): Promise<void> => {
    setMoving(true);
    setError(null);
    try {
      // Read again because either window may have changed while the picker was open.
      const [source, destination] = await Promise.all([
        chrome.tabs.get(tab.id), chrome.windows.get(windowId, { populate: true }),
      ]);
      if (source.windowId === windowId) { onClose(); return; }
      if (destination.type !== 'normal' || destination.incognito !== source.incognito) {
        setError({ key: 'sameMode' });
        setMoving(false);
        return;
      }
      const active = destination.tabs?.find((item) => item.active);
      // Moving across windows removes the tab from its source native group.
      await chrome.tabs.move(tab.id, { windowId, index: -1 });
      const moved = await chrome.tabs.get(tab.id);
      if (moved.active && active?.id != null) await chrome.tabs.update(active.id, { active: true });
      onMoved();
      onClose();
    } catch (cause) {
      setError({ key: 'moveFailed', params: { error: cause instanceof Error ? cause.message : t('retry') } });
      setMoving(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="powerful-settings powerful-move" aria-labelledby="move-tab-title"
      onCancel={(event) => { if (moving) event.preventDefault(); else onClose(); }}
      onClick={(event) => {
        if (moving || event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right
          || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}>
      <h2 id="move-tab-title">{t('moveTab')}</h2>
      <p className="powerful-move__source" title={tab.url}>{tab.title || tab.url}</p>
      {loading && <p role="status">{t('loadingWindows')}</p>}
      {!loading && !error && windows.length === 0 && <p>{t('noWindows')}</p>}
      <div className="powerful-move__windows">
        {windows.map((window) => {
          const active = window.tabs?.find((item) => item.active);
          return <button key={window.id} type="button" disabled={moving} onClick={() => void move(window.id!)}
            title={active?.title || t('window', { id: window.id! })}>
            <span>{t('windowTabs', { id: window.id!, count: window.tabs?.length ?? 0 })}</span>
            <span className="powerful-move__window-title">{active?.title || t('emptyWindow')}</span>
          </button>;
        })}
      </div>
      {moving && <p role="status">{t('moving')}</p>}
      {error && <p role="alert">{t(error.key, error.params)}</p>}
      <div className="powerful-settings__actions"><button type="button" disabled={moving} onClick={onClose}>{t('cancel')}</button></div>
    </dialog>
  );
}
