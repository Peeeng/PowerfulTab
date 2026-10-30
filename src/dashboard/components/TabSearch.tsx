import { useEffect, useRef, useState } from 'react';
import { getSearchHistory, setSearchHistory } from '../../core/storage';
import { rememberSearch } from '../../core/search';

interface Props {
  query: string;
  onQuery: (query: string) => void;
  historyCount: number;
}

export default function TabSearch({ query, onQuery, historyCount }: Props): JSX.Element {
  const [history, setHistory] = useState<string[]>([]);
  const historyRef = useRef<string[]>([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const writes = useRef(Promise.resolve());
  const composing = useRef(false);
  const edited = useRef(false);
  const countRef = useRef(historyCount);
  countRef.current = historyCount;

  const remember = (term: string): void => {
    clearTimeout(saveTimer.current);
    if (!term.trim()) return;
    const next = rememberSearch(historyRef.current, term, countRef.current);
    historyRef.current = next;
    setHistory(next);
    writes.current = writes.current.then(() => setSearchHistory(next, countRef.current))
      .then(() => setError('')).catch(() => setError('搜索记录保存失败'));
  };
  const schedule = (term: string): void => {
    clearTimeout(saveTimer.current);
    if (!composing.current) saveTimer.current = setTimeout(() => remember(term), 500);
  };
  const choose = (term: string): void => {
    onQuery(term);
    remember(term);
    setOpen(false);
    setSelected(-1);
    inputRef.current?.focus();
  };

  useEffect(() => {
    let disposed = false;
    void getSearchHistory(historyCount).then((stored) => {
      if (!disposed && !edited.current) {
        historyRef.current = stored;
        setHistory(stored);
      }
    }).catch(() => { if (!disposed) setError('搜索记录读取失败'); });
    return () => { disposed = true; clearTimeout(saveTimer.current); };
  }, [historyCount]);

  useEffect(() => {
    const next = historyRef.current.slice(0, historyCount);
    historyRef.current = next;
    setHistory(next);
    setSelected(-1);
  }, [historyCount]);

  useEffect(() => {
    let disposed = false;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const cancelFocus = (): void => { timers.forEach(clearTimeout); timers = []; };
    const focus = (): void => {
      if (document.visibilityState !== 'visible' || document.querySelector('dialog[open]')) return;
      inputRef.current?.focus();
    };
    const requestFocus = (): void => {
      cancelFocus();
      focus();
      // 侧边栏挂载时浏览器焦点可能仍在网页，等待打开动画完成后重试。
      timers = [100, 300, 700].map((delay) => setTimeout(focus, delay));
    };
    const onMessage = (message: { type?: string; windowId?: number }): void => {
      if (message.type !== 'focusSearch') return;
      void chrome.windows.getCurrent().then((window) => {
        if (!disposed && window.id === message.windowId) requestFocus();
      });
    };
    const onSearchShortcut = (event: KeyboardEvent): void => {
      if (event.isComposing || !event.ctrlKey || !event.shiftKey || event.altKey || event.metaKey
          || event.code !== 'KeyF') return;
      // Standalone dashboard pages can also focus without a background command.
      // Side panels use Chrome's configured shortcut, rather than hard-coding a second binding.
      if (location.pathname.endsWith('/sidepanel.html')) return;
      event.preventDefault();
      requestFocus();
    };
    requestFocus();
    // 只在初次挂载或明确的打开/快捷键消息时聚焦。
    // 激活、复制、删除标签也会触发窗口 focus，不能把它当作打开界面。
    document.addEventListener('pointerdown', cancelFocus);
    document.addEventListener('keydown', cancelFocus);
    document.addEventListener('keydown', onSearchShortcut);
    chrome.runtime.onMessage.addListener(onMessage);
    return () => {
      disposed = true;
      cancelFocus();
      document.removeEventListener('pointerdown', cancelFocus);
      document.removeEventListener('keydown', cancelFocus);
      document.removeEventListener('keydown', onSearchShortcut);
      chrome.runtime.onMessage.removeListener(onMessage);
    };
  }, []);

  return (
    <section className="cosmo-search" aria-label="标签检索">
      <form className="cosmo-search__form" role="search" onSubmit={(e) => {
        e.preventDefault(); remember(query); setOpen(false);
      }}>
        <div className="cosmo-search__field">
          <input ref={inputRef} autoFocus type="search" autoComplete="off" role="combobox"
            aria-label="搜索 URL 或标签名称" aria-autocomplete="list" aria-expanded={open && history.length > 0}
            aria-controls="search-history" aria-activedescendant={open && selected >= 0 ? `search-history-${selected}` : undefined}
            placeholder="搜索 URL 或标签名称…" value={query}
            onFocus={() => { setOpen(true); setSelected(-1); }} onClick={() => setOpen(true)}
            onBlur={() => { setOpen(false); if (!composing.current) remember(query); }}
            onCompositionStart={() => { composing.current = true; clearTimeout(saveTimer.current); }}
            onCompositionEnd={(e) => { composing.current = false; schedule(e.currentTarget.value); }}
            onChange={(e) => { edited.current = true; onQuery(e.target.value); setOpen(true); setSelected(-1); schedule(e.target.value); }}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                if (!history.length) return;
                e.preventDefault(); setOpen(true);
                setSelected((index) => (index + (e.key === 'ArrowDown' ? 1 : -1) + history.length) % history.length);
              } else if (e.key === 'Enter' && open && selected >= 0) {
                e.preventDefault(); choose(history[selected]!);
              } else if (e.key === 'Escape') {
                e.preventDefault(); setOpen(false); setSelected(-1);
              }
            }} />
          {open && history.length > 0 && <div id="search-history" role="listbox" aria-label="最近搜索记录" className="cosmo-search__history">
            {history.map((term, index) => <div key={term} id={`search-history-${index}`} role="option" aria-selected={selected === index}
              title={term} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(term)}>{term}</div>)}
          </div>}
        </div>
      </form>
      {error && <span role="status">{error}</span>}
    </section>
  );
}
