import { useEffect, useRef, useState } from 'react';
import type { TabInfo } from '../core/types';
import { useI18n } from './I18nProvider';
import type { LocalizedMessage } from '../core/i18n';
import { getMoveDestinations, moveTabToWindow } from '../core/move-tab';
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
    void getMoveDestinations(tab.id).then((destinations) => {
      if (disposed) return;
      setWindows(destinations);
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
      await moveTabToWindow(tab.id, windowId);
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
