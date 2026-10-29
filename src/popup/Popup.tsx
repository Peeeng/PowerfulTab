import { useEffect, useState } from 'react';
import type { RuntimeMessage, RuntimeResponse, Settings } from '../core/types';
import { getSettings, setSettings } from '../core/storage';
import SettingsDialog from '../components/SettingsDialog';
import DedupeIcon from '../components/DedupeIcon';
import SettingsIcon from '../components/SettingsIcon';

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
  const [hint, setHint] = useState('');

  const refresh = async () => {
    setSettingsState(await getSettings());
    const tabs = await chrome.tabs.query({});
    const domains = new Set<string>();
    for (const tab of tabs) {
      try { if (tab.url) domains.add(new URL(tab.url).hostname); } catch { /* ignore */ }
    }
    setStats({ tabs: tabs.length, windows: new Set(tabs.map((tab) => tab.windowId)).size, domains: domains.size });
  };
  useEffect(() => { void refresh(); }, []);

  if (!settings) return <div className="cosmo-popup">加载中…</div>;

  const organize = async () => {
    setBusy(true);
    const r = await send<{ grouped: number; groupsCreated: number }>({ type: 'organizeAll' });
    setBusy(false);
    setHint(r.ok && r.data ? `归类 ${r.data.grouped} · 新建组 ${r.data.groupsCreated}` : `失败：${r.error ?? 'unknown'}`);
    void refresh();
  };
  const dedupe = async () => {
    setBusy(true);
    const r = await send<{ closed: number }>({ type: 'dedupeOnly' });
    setBusy(false);
    setHint(r.ok && r.data ? `关闭完全重复 ${r.data.closed} 个` : `失败：${r.error ?? 'unknown'}`);
    void refresh();
  };

  return (
    <div className={`cosmo-popup ${settings.theme === 'dark' ? 'cosmo-dark' : 'cosmo-light'}`}>
      <header className="cosmo-popup__header"><h1>PowerfulTab</h1><span className="cosmo-popup__sub">把标签页变成宇宙</span></header>
      <section className="cosmo-popup__stats">
        <div><strong>{stats.tabs}</strong><span>标签</span></div>
        <div><strong>{stats.windows}</strong><span>窗口</span></div>
        <div><strong>{stats.domains}</strong><span>域名</span></div>
      </section>
      <section className="cosmo-popup__actions">
        <button disabled={busy} onClick={() => void organize()} className="primary" title="只分组，不关闭标签">一键整理</button>
        <button disabled={busy} onClick={() => void dedupe()} title="仅完整链接完全一致才去重" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><DedupeIcon />去重</button>
        <button disabled={busy} onClick={() => setSettingsOpen(true)} aria-label="设置" title="设置"><SettingsIcon /></button>
      </section>
      {settingsOpen && <SettingsDialog settings={settings} onSave={async (next) => { setSettingsState(await setSettings(next)); }} onClose={() => setSettingsOpen(false)} />}
      <button className="cosmo-popup__open" onClick={() => void chrome.tabs.create({ url: chrome.runtime.getURL('index.html') })}>打开宇宙视图 →</button>
      {hint && <div className="cosmo-popup__hint">{hint}</div>}
    </div>
  );
}
