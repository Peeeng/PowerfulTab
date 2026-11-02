import { cloneElement, useEffect, useId, useRef, useState, type ReactElement } from 'react';
import type { Settings } from '../core/types';
import { createTranslator } from '../core/i18n';
import { normalizeMaxGroupCount, normalizeMinGroupTabs, normalizeSearchClearTimeout, parseDomainWhitelist } from '../core/storage';
import './settings-dialog.css';

interface Props {
  settings: Settings;
  onSave: (settings: Settings) => Promise<void>;
  onClose: () => void;
}

function SettingField({ label, hint, multiline = false, children }: {
  label: string;
  hint: string;
  multiline?: boolean;
  children: ReactElement<{ id?: string; 'aria-describedby'?: string }>;
}): JSX.Element {
  const id = useId();
  const hintId = `${id}-hint`;
  const [showHint, setShowHint] = useState(false);
  return (
    <div className={`powerful-settings__field ${multiline ? 'powerful-settings__field--multiline' : 'powerful-settings__row'}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && showHint) { e.preventDefault(); e.stopPropagation(); setShowHint(false); }
      }}>
      <span className="powerful-settings__name">
        <label htmlFor={id}>{label}</label>
        <span className="powerful-settings__help" onMouseEnter={() => setShowHint(true)} onMouseLeave={() => setShowHint(false)}
          onClick={() => setShowHint(true)}>
          <span className="powerful-settings__help-icon" aria-hidden="true">?</span>
          <span id={hintId} role="tooltip" className="powerful-settings__tooltip" hidden={!showHint}>{hint}</span>
        </span>
      </span>
      {cloneElement(children, { id, 'aria-describedby': hintId })}
    </div>
  );
}

export default function SettingsDialog({ settings, onSave, onClose }: Props): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(settings);
  const t = createTranslator(draft.language);
  const [whitelist, setWhitelist] = useState(settings.pathDomainWhitelist.join('\n'));
  const [domainWhitelist, setDomainWhitelist] = useState(settings.domainPathWhitelist.join('\n'));
  const [maxCount, setMaxCount] = useState(String(settings.maxGroupCount));
  const [minTabs, setMinTabs] = useState(String(settings.minGroupTabs));
  const [searchCount, setSearchCount] = useState(String(settings.searchHistoryCount));
  const [searchTimeout, setSearchTimeout] = useState(String(settings.searchClearTimeoutSeconds));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog ref={dialogRef} className="powerful-settings" aria-labelledby="settings-title" onCancel={onClose}
      onClick={(e) => {
        if (e.target !== e.currentTarget || saving) return;
        const bounds = e.currentTarget.getBoundingClientRect();
        if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) {
          onClose();
        }
      }}>
      <form onSubmit={(e) => {
        e.preventDefault();
        setSaving(true);
        void onSave({
          ...draft,
          pathDomainWhitelist: parseDomainWhitelist(whitelist),
          domainPathWhitelist: parseDomainWhitelist(domainWhitelist),
          maxGroupCount: normalizeMaxGroupCount(Number(maxCount)),
          minGroupTabs: normalizeMinGroupTabs(Number(minTabs)),
          searchHistoryCount: Math.max(0, Math.floor(Number(searchCount))),
          searchClearTimeoutSeconds: normalizeSearchClearTimeout(Number(searchTimeout)),
        }).then(onClose).catch(() => {
          setError(true);
          setSaving(false);
        });
      }}>
        <h2 id="settings-title">{t('settings')}</h2>
        <SettingField label={t('language')} hint={t('languageHint')}>
          <select value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value as Settings['language'] })}>
            <option value="en">English</option><option value="zh-CN">简体中文</option>
          </select>
        </SettingField>
        <SettingField label={t('organizeMode')} hint={t('organizeHint')}>
          <select value={draft.groupMode} onChange={(e) => setDraft({ ...draft, groupMode: e.target.value as Settings['groupMode'] })}>
            <option value="domain">{t('domainMode')}</option>
            <option value="path">{t('pathMode')}</option>
          </select>
        </SettingField>
        {draft.groupMode === 'path' ? <SettingField key="path-whitelist" label={t('pathWhitelist')} hint={t('pathWhitelistHint')}>
          <textarea className="powerful-settings__whitelist" rows={2} value={whitelist} onChange={(e) => setWhitelist(e.target.value)} placeholder="example.com" />
        </SettingField> : <SettingField key="domain-whitelist" label={t('domainWhitelist')} hint={t('domainWhitelistHint')}>
          <textarea className="powerful-settings__whitelist" rows={2} value={domainWhitelist} onChange={(e) => setDomainWhitelist(e.target.value)} placeholder="example.com" />
        </SettingField>}
        <SettingField label={t('minTabs')} hint={t('minTabsHint')}>
          <input type="number" min="1" step="1" required value={minTabs} onChange={(e) => setMinTabs(e.target.value)} />
        </SettingField>
        <SettingField label={t('maxGroups')} hint={t('maxGroupsHint')}>
          <input type="number" min="1" step="1" required value={maxCount} onChange={(e) => setMaxCount(e.target.value)} />
        </SettingField>
        <SettingField label={t('tabSort')} hint={t('tabSortHint')}>
          <select value={draft.groupTabSort} onChange={(e) => setDraft({ ...draft, groupTabSort: e.target.value as Settings['groupTabSort'] })}>
            <option value="created">{t('created')}</option>
            <option value="accessed">{t('accessed')}</option>
          </select>
        </SettingField>
        <SettingField label={t('searchRetention')} hint={t('searchRetentionHint')}>
          <input type="number" min="0" step="1" required value={searchCount} onChange={(e) => setSearchCount(e.target.value)} />
        </SettingField>
        <SettingField label={t('searchTimeout')} hint={t('searchTimeoutHint')}>
          <input type="number" min="0" step="1" required value={searchTimeout} onChange={(e) => setSearchTimeout(e.target.value)} />
        </SettingField>
        <SettingField label={t('theme')} hint={t('themeHint')}>
          <select value={draft.theme} onChange={(e) => setDraft({ ...draft, theme: e.target.value as Settings['theme'] })}>
            <option value="light">{t('light')}</option><option value="dark">{t('dark')}</option>
          </select>
        </SettingField>
        {error && <p role="alert">{t('saveFailed')}</p>}
        <div className="powerful-settings__actions">
          <button type="button" disabled={saving} onClick={onClose}>{t('cancel')}</button>
          <button type="submit" disabled={saving}>{t(saving ? 'saving' : 'save')}</button>
        </div>
      </form>
    </dialog>
  );
}
