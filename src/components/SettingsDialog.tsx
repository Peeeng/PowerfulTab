import { cloneElement, useEffect, useId, useRef, useState, type ReactElement } from 'react';
import type { Settings } from '../core/types';
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
  const [whitelist, setWhitelist] = useState(settings.pathDomainWhitelist.join('\n'));
  const [domainWhitelist, setDomainWhitelist] = useState(settings.domainPathWhitelist.join('\n'));
  const [maxCount, setMaxCount] = useState(String(settings.maxGroupCount));
  const [minTabs, setMinTabs] = useState(String(settings.minGroupTabs));
  const [searchCount, setSearchCount] = useState(String(settings.searchHistoryCount));
  const [searchTimeout, setSearchTimeout] = useState(String(settings.searchClearTimeoutSeconds));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
          setError('保存失败，请重试');
          setSaving(false);
        });
      }}>
        <h2 id="settings-title">设置</h2>
        <SettingField label="整理方式" hint="一键整理只分组，不关闭标签。可按域名或一级 Path 分组；去重按钮仅关闭完整链接完全一致的重复标签。">
          <select value={draft.groupMode} onChange={(e) => setDraft({ ...draft, groupMode: e.target.value as Settings['groupMode'] })}>
            <option value="domain">按域名分组</option>
            <option value="path">按一级 Path 分组</option>
          </select>
        </SettingField>
        {draft.groupMode === 'path' ? <SettingField key="path-whitelist" label="Path白名单" hint="仅在按 Path 分组时生效：名单内域名改按域名分组。支持逗号、空格或换行分隔，精确匹配域名。">
          <textarea className="powerful-settings__whitelist" rows={2} value={whitelist} onChange={(e) => setWhitelist(e.target.value)} placeholder="example.com" />
        </SettingField> : <SettingField key="domain-whitelist" label="域名白名单" hint="仅在按域名分组时生效：名单内域名改按一级 Path 分组。支持逗号、空格或换行分隔，精确匹配域名。">
          <textarea className="powerful-settings__whitelist" rows={2} value={domainWhitelist} onChange={(e) => setDomainWhitelist(e.target.value)} placeholder="example.com" />
        </SettingField>}
        <SettingField label="最少标签数" hint="默认 3 个；预分组标签数达到该值才独立成组，否则归入 other。">
          <input type="number" min="1" step="1" required aria-label="最少标签数" value={minTabs} onChange={(e) => setMinTabs(e.target.value)} />
        </SettingField>
        <SettingField label="最多分组数" hint="始终生效，默认 15 个（含 other）；大组优先，超限的小组合并到 other。">
          <input type="number" min="1" step="1" required aria-label="最大分组数" value={maxCount} onChange={(e) => setMaxCount(e.target.value)} />
        </SettingField>
        <SettingField label="组内标签排序" hint="创建时间从早到晚，访问时间从近到远；需要改变顺序时防抖 3 秒。安装前已有标签按首次记录顺序兜底。">
          <select value={draft.groupTabSort} onChange={(e) => setDraft({ ...draft, groupTabSort: e.target.value as Settings['groupTabSort'] })}>
            <option value="created">创建时间</option>
            <option value="accessed">访问时间</option>
          </select>
        </SettingField>
        <SettingField label="搜索记录保留" hint="默认保留 1 条搜索记录，设为 0 不记录历史。">
          <input type="number" min="0" step="1" required aria-label="搜索记录保留条数" value={searchCount} onChange={(e) => setSearchCount(e.target.value)} />
        </SettingField>
        <SettingField label="搜索清空时间" hint="单位为秒，默认 60；每次输入重新计时，设为 0 不自动清空。搜索历史不受影响。">
          <input type="number" min="0" step="1" required aria-label="搜索清空时间（秒）" value={searchTimeout} onChange={(e) => setSearchTimeout(e.target.value)} />
        </SettingField>
        <SettingField label="主题" hint="切换明亮或深色界面。">
          <select value={draft.theme} onChange={(e) => setDraft({ ...draft, theme: e.target.value as Settings['theme'] })}>
            <option value="light">明亮</option><option value="dark">深色</option>
          </select>
        </SettingField>
        {error && <p role="alert">{error}</p>}
        <div className="powerful-settings__actions">
          <button type="button" disabled={saving} onClick={onClose}>取消</button>
          <button type="submit" disabled={saving}>{saving ? '保存中…' : '保存'}</button>
        </div>
      </form>
    </dialog>
  );
}
