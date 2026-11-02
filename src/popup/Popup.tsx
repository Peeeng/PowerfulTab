import { useEffect, useState } from 'react';
import type { RuntimeMessage, RuntimeResponse, Settings } from '../core/types';
import { getSettings, setSettings } from '../core/storage';
import SettingsDialog from '../components/SettingsDialog';
import DedupeIcon from '../components/DedupeIcon';
import SettingsIcon from '../components/SettingsIcon';
import { I18nProvider } from '../components/I18nProvider';
import { createTranslator, type LocalizedMessage } from '../core/i18n';

function send<T>(msg: RuntimeMessage): Promise<RuntimeResponse<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (resp: RuntimeResponse<T>) => {
      resolve(chrome.runtime.lastError ? { ok: false, error: chrome.runtime.lastError.message } : resp);
    });
  });
}

export default function Popup(): JSX.Element {
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stats, setStats] = useState({ tabs: 0, windows: 0, domains: 0 });
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<LocalizedMessage | null>(null);
  const language = settings?.language ?? 'en';
  const t = createTranslator(language);

  useEffect(() => { document.documentElement.lang = language; }, [language]);

  const refresh = async () => {
    setSettingsState(await getSettings());
    const tabs = await chrome.tabs.query({});
    const domains = new Set<string>();
    for (const tab of tabs) {
      try { if (tab.url) domains.add(new URL(tab.url).hostname); } catch { /* ignore */ }
    }
    setStats({ tabs: tabs.length, windows: new Set(tabs.map((tab) => tab.windowId)).size, domains: domains.size });
  };
  useEffect(() => {
    void refresh();
    const onChange = (changes: { [key: string]: chrome.storage.StorageChange }, area: string): void => {
      if (area === 'local' && changes['powerfultab.settings']) void getSettings().then(setSettingsState);
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  if (!settings) return <div className="powerful-popup">{t('loading')}</div>;

  const organize = async () => {
    setBusy(true);
    const r = await send<{ grouped: number; groupsCreated: number }>({ type: 'organizeAll' });
    setBusy(false);
    setHint(r.ok && r.data ? { key: 'grouped', params: { tabs: r.data.grouped, groups: r.data.groupsCreated } }
      : { key: 'failed', params: { error: r.error ?? t('unknownError') } });
    void refresh();
  };
  const dedupe = async () => {
    setBusy(true);
    const r = await send<{ closed: number }>({ type: 'dedupeOnly' });
    setBusy(false);
    setHint(r.ok && r.data ? { key: 'deduped', params: { count: r.data.closed } }
      : { key: 'failed', params: { error: r.error ?? t('unknownError') } });
    void refresh();
  };

  return (
    <I18nProvider language={language}>
    <div className={`powerful-popup ${settings.theme === 'dark' ? 'powerful-dark' : 'powerful-light'}`}>
      <header className="powerful-popup__header"><h1>PowerfulTab</h1><span className="powerful-popup__sub">{t('tagline')}</span></header>
      <section className="powerful-popup__stats">
        <div><strong>{stats.tabs}</strong><span>{t('tabs')}</span></div>
        <div><strong>{stats.windows}</strong><span>{t('windows')}</span></div>
        <div><strong>{stats.domains}</strong><span>{t('domains')}</span></div>
      </section>
      <section className="powerful-popup__actions">
        <button disabled={busy} onClick={() => void organize()} className="primary" title={t('organizeTitle')}>{t('organize')}</button>
        <button disabled={busy} onClick={() => void dedupe()} title={t('dedupeTitle')} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><DedupeIcon />{t('dedupe')}</button>
        <button disabled={busy} onClick={() => setSettingsOpen(true)} aria-label={t('settings')} title={t('settings')}><SettingsIcon /></button>
      </section>
      {settingsOpen && <SettingsDialog settings={settings} onSave={async (next) => { setSettingsState(await setSettings(next)); }} onClose={() => setSettingsOpen(false)} />}
      <button className="powerful-popup__open" onClick={() => void chrome.tabs.create({ url: chrome.runtime.getURL('index.html') })}>{t('openView')}</button>
      {hint && <div className="powerful-popup__hint">{t(hint.key, hint.params)}</div>}
    </div>
    </I18nProvider>
  );
}
