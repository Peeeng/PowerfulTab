import { useEffect, useRef, useState } from 'react';
import type { Settings } from '../core/types';
import { normalizeMaxGroupCount, normalizeMinGroupTabs, parseDomainWhitelist } from '../core/storage';
import './settings-dialog.css';

interface Props {
  settings: Settings;
  onSave: (settings: Settings) => Promise<void>;
  onClose: () => void;
}

export default function SettingsDialog({ settings, onSave, onClose }: Props): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(settings);
  const [whitelist, setWhitelist] = useState(settings.pathDomainWhitelist.join('\n'));
  const [maxCount, setMaxCount] = useState(String(settings.maxGroupCount));
  const [minTabs, setMinTabs] = useState(String(settings.minGroupTabs));
  const [searchCount, setSearchCount] = useState(String(settings.searchHistoryCount));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog ref={dialogRef} className="cosmo-settings" aria-labelledby="settings-title" onCancel={onClose}
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
          maxGroupCount: normalizeMaxGroupCount(Number(maxCount)),
          minGroupTabs: normalizeMinGroupTabs(Number(minTabs)),
          searchHistoryCount: Math.max(0, Math.floor(Number(searchCount))),
        }).then(onClose).catch(() => {
          setError('保存失败，请重试');
          setSaving(false);
        });
      }}>
        <h2 id="settings-title">设置</h2>
        <label className="cosmo-settings__row">整理方式
          <select value={draft.groupMode} onChange={(e) => setDraft({ ...draft, groupMode: e.target.value as Settings['groupMode'] })}>
            <option value="domain">按域名分组</option>
            <option value="path">按一级 Path 分组</option>
          </select>
        </label>
        <label htmlFor="settings-whitelist">Path 白名单</label>
        <textarea id="settings-whitelist" rows={3} value={whitelist} onChange={(e) => setWhitelist(e.target.value)} placeholder="cloud.bytedance.net, example.com" />
        <p>白名单域名仅按域名分组；支持逗号、空格或换行分隔。</p>
        <label className="cosmo-settings__row">最少标签数
          <input type="number" min="1" step="1" required aria-label="最少标签数" value={minTabs} onChange={(e) => setMinTabs(e.target.value)} />
        </label>
        <p>默认 5 个；预分组标签数达到该值才独立成组，否则归入 other。</p>
        <label className="cosmo-settings__row">最多分组数
          <input type="number" min="1" step="1" required aria-label="最大分组数" value={maxCount} onChange={(e) => setMaxCount(e.target.value)} />
        </label>
        <p>始终生效，默认 20 个（含 other）；大组优先，超限的小组合并到 other。</p>
        <label className="cosmo-settings__row">组内标签排序
          <select value={draft.groupTabSort} onChange={(e) => setDraft({ ...draft, groupTabSort: e.target.value as Settings['groupTabSort'] })}>
            <option value="created">创建时间</option>
            <option value="accessed">访问时间</option>
          </select>
        </label>
        <label className="cosmo-settings__row">搜索框保留数
          <input type="number" min="0" step="1" required aria-label="搜索历史保留条数" value={searchCount} onChange={(e) => setSearchCount(e.target.value)} />
        </label>
        <p>默认 1，设为 0 不记录历史。</p>
        <label className="cosmo-settings__row">主题
          <select value={draft.theme} onChange={(e) => setDraft({ ...draft, theme: e.target.value as Settings['theme'] })}>
            <option value="light">明亮</option><option value="dark">深色</option>
          </select>
        </label>
        <p>一键整理只分组。去重仅关闭完整链接完全一致的重复标签。</p>
        {error && <p role="alert">{error}</p>}
        <div className="cosmo-settings__actions">
          <button type="button" disabled={saving} onClick={onClose}>取消</button>
          <button type="submit" disabled={saving}>{saving ? '保存中…' : '保存'}</button>
        </div>
      </form>
    </dialog>
  );
}
