import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Load project TypeScript in memory; no generated test files or extra packages.
function loader(overrides = {}, globals = {}) {
  const cache = new Map();
  const load = (file) => {
    const path = resolve(root, file);
    if (cache.has(path)) return cache.get(path);
    const exports = {};
    cache.set(path, exports);
    const context = {
      exports, URL, console, setTimeout, clearTimeout, ...globals,
      require(name) {
        if (name in overrides) return overrides[name];
        if (name.endsWith('.css')) return {};
        if (!name.startsWith('.')) return require(name);
        const base = resolve(dirname(path), name);
        const target = [base, `${base}.ts`, `${base}.tsx`].find(existsSync);
        if (!target) throw new Error(`Missing module: ${name}`);
        return load(target);
      },
    };
    const output = ts.transpileModule(readFileSync(path, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(output, context, { filename: path });
    return exports;
  };
  return load;
}

const load = loader();
const { en, zhCN, normalizeLanguage, createTranslator } = load('src/core/i18n.ts');
const defaultSettings = {
  language: 'en', groupMode: 'domain', theme: 'light', sortScope: 'perWindow',
  pathDomainWhitelist: ['path.example.com'], domainPathWhitelist: ['domain.example.com'],
  minGroupTabs: 3, maxGroupCount: 15, groupTabSort: 'accessed', searchHistoryCount: 1, searchClearTimeoutSeconds: 60,
};

test('both dictionaries cover the same keys and interpolation parameters', () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(zhCN).sort());
  for (const key of Object.keys(en)) {
    assert.ok(en[key].trim() && zhCN[key].trim(), key);
    assert.ok(!/\p{Script=Han}/u.test(en[key]), `Non-English default message: ${key}`);
    const placeholders = (value) => [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    assert.deepEqual(placeholders(en[key]), placeholders(zhCN[key]), key);
  }
  assert.equal(createTranslator()('grouped', { tabs: 4, groups: 2 }), 'Grouped 4 tabs · 2 groups');
  assert.equal(createTranslator('zh-CN')('grouped', { tabs: 4, groups: 2 }), '已分组 4 个标签 · 2 个组');
  assert.equal(createTranslator()('failed', { error: '$& {tabs}' }), 'Failed: $& {tabs}');
  assert.equal(normalizeLanguage('zh-CN'), 'zh-CN');
  for (const value of [undefined, null, '', 'fr', 1, {}]) assert.equal(normalizeLanguage(value), 'en');
});

test('language defaults, normalization, and persistence preserve existing preferences', async () => {
  const stored = { 'powerfultab.settings': { ...defaultSettings } };
  delete stored['powerfultab.settings'].language;
  const storage = loader({ './storage-migration': { migrateStorage: async () => {} } }, {
    chrome: { storage: { local: {
      get: async (key) => ({ [key]: stored[key] }),
      set: async (value) => Object.assign(stored, value),
    } } },
  })('src/core/storage.ts');
  assert.equal((await storage.getSettings()).language, 'en');
  await storage.setSettings({ language: 'zh-CN' });
  assert.equal((await storage.getSettings()).language, 'zh-CN');
  assert.equal(stored['powerfultab.settings'].pathDomainWhitelist[0], 'path.example.com');
  assert.equal(stored['powerfultab.settings'].searchClearTimeoutSeconds, 60);
  await storage.setSettings({ language: 'invalid' });
  assert.equal((await storage.getSettings()).language, 'en');
});

test('settings, controls, hints, search, and empty states render in both languages', () => {
  const SettingsDialog = load('src/components/SettingsDialog.tsx').default;
  const TabSearch = load('src/dashboard/components/TabSearch.tsx').default;
  const CardGrid = load('src/dashboard/components/CardGrid.tsx').default;
  const MoveTabDialog = load('src/components/MoveTabDialog.tsx').default;
  const { I18nProvider } = load('src/components/I18nProvider.tsx');
  const render = (language, element) => renderToStaticMarkup(React.createElement(I18nProvider, { language }, element));
  for (const language of ['en', 'zh-CN']) {
    const t = createTranslator(language);
    for (const groupMode of ['domain', 'path']) {
      const html = renderToStaticMarkup(React.createElement(SettingsDialog, {
        settings: { ...defaultSettings, language, groupMode }, onSave: async () => {}, onClose() {},
      }));
      assert.ok(html.includes(t('settings')) && html.includes(t('save')) && html.includes(t('languageHint')));
      assert.ok(html.includes(`>${t(groupMode === 'path' ? 'pathWhitelist' : 'domainWhitelist')}</label>`));
      assert.ok(!html.includes(`>${t(groupMode === 'path' ? 'domainWhitelist' : 'pathWhitelist')}</label>`));
      assert.equal((html.match(/class="powerful-settings__help-icon"/g) ?? []).length, 9);
      if (language === 'en') assert.ok(!/\p{Script=Han}/u.test(html.replace('简体中文', '')));
    }
    const search = render(language, React.createElement(TabSearch, { query: 'keep me', onQuery() {}, historyCount: 1, clearTimeoutSeconds: 60 }));
    assert.ok(search.includes(t('searchPlaceholder')) && search.includes('keep me'));
    const empty = render(language, React.createElement(CardGrid, {
      tabs: [], searchQuery: '', lastAccessed: {}, createdAt: {}, groupTabSort: 'accessed', orderRevision: 0,
      groupByFirstPath: false, pathDomainWhitelist: new Set(), domainPathWhitelist: new Set(),
      minGroupTabs: 3, maxGroupCount: 15, collapsed: new Set(),
    }));
    assert.ok(empty.includes(t('quiet')) && empty.includes(t('nothingOpen')));
    const move = render(language, React.createElement(MoveTabDialog, { tab: { id: 1, title: 'Original title', url: 'https://example.com' }, onMoved() {}, onClose() {} }));
    assert.ok(move.includes(t('moveTab')) && move.includes(t('loadingWindows')) && move.includes('Original title'));
  }
});

function find(node, predicate) {
  if (!node || typeof node !== 'object') return;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat()) {
    const found = find(child, predicate);
    if (found) return found;
  }
}

test('settings language preview is a draft; Save applies and Cancel never saves', async () => {
  let slots = [], index = 0, saved, closes = 0;
  const mockReact = {
    ...React, useEffect() {}, useRef: () => ({ current: null }),
    useState(initial) {
      const i = index++;
      if (!(i in slots)) slots[i] = initial;
      return [slots[i], (value) => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
    },
  };
  const Dialog = loader({ react: mockReact })('src/components/SettingsDialog.tsx').default;
  const render = () => { index = 0; return Dialog({ settings: defaultSettings, onSave: async (value) => { saved = value; }, onClose: () => { closes++; } }); };
  let tree = render();
  find(tree, (n) => n.type === 'select' && n.props.value === 'en').props.onChange({ target: { value: 'zh-CN' } });
  tree = render();
  assert.ok(find(tree, (n) => n.props?.label === '语言'));
  find(tree, (n) => n.type === 'button' && n.props.type === 'button').props.onClick();
  assert.equal(saved, undefined); assert.equal(closes, 1); assert.equal(defaultSettings.language, 'en');
  slots = []; tree = render();
  find(tree, (n) => n.type === 'select' && n.props.value === 'en').props.onChange({ target: { value: 'zh-CN' } });
  tree = render(); find(tree, (n) => n.type === 'form').props.onSubmit({ preventDefault() {} });
  await Promise.resolve();
  assert.equal(saved.language, 'zh-CN'); assert.equal(saved.searchHistoryCount, 1);
  assert.equal(saved.domainPathWhitelist[0], 'domain.example.com');
});

test('translated tab lists keep original user titles, URLs, and group labels', () => {
  const CardGrid = load('src/dashboard/components/CardGrid.tsx').default;
  const { I18nProvider } = load('src/components/I18nProvider.tsx');
  const tab = { id: 1, windowId: 2, url: 'https://data.example.com/dorado/instance', title: 'Original 百度 title',
    active: true, groupId: -1, pinned: false, index: 0 };
  for (const language of ['en', 'zh-CN']) {
    const html = renderToStaticMarkup(React.createElement(I18nProvider, { language }, React.createElement(CardGrid, {
      tabs: [tab], searchQuery: '', lastAccessed: { 1: Date.now() }, createdAt: { 1: 1 },
      groupTabSort: 'accessed', orderRevision: 0, groupByFirstPath: false,
      pathDomainWhitelist: new Set(), domainPathWhitelist: new Set(['data.example.com']),
      minGroupTabs: 1, maxGroupCount: 15, collapsed: new Set(), focusedWindowId: 2,
    })));
    const t = createTranslator(language);
    assert.ok(html.includes(tab.title) && html.includes(tab.url) && html.includes('data.dorado'));
    assert.ok(html.includes(t('duplicateTab')) && html.includes(t('closeGroup')) && html.includes(t('recent')));
    assert.ok(html.includes(t('justNow')) && html.includes(t('activeWindow', { id: 2 })));
  }
});

test('deduplicate buttons are icon-only with localized hover and accessible labels', () => {
  const Toolbar = load('src/dashboard/components/Toolbar.tsx').default;
  const { I18nProvider } = load('src/components/I18nProvider.tsx');
  for (const language of ['en', 'zh-CN']) {
    const t = createTranslator(language);
    const html = renderToStaticMarkup(React.createElement(I18nProvider, { language }, React.createElement(Toolbar, {
      busy: false, hint: '', theme: 'light', onTheme() {}, onDedupe() {}, onSettings() {}, onOrganize() {},
    })));
    const button = html.match(new RegExp(`<button[^>]*aria-label="${t('dedupe')}"[^>]*>([\\s\\S]*?)</button>`));
    assert.ok(button, 'Accessible deduplicate button exists');
    assert.ok(button[0].includes(t('dedupeTitle')));
    assert.ok(button[1].includes('<svg') && !button[1].includes(t('dedupe')));
    assert.ok(html.includes('class="powerful-dog" width="56" height="34"'), 'Compact puppy decoration is retained');
    assert.ok(!html.includes('class="powerful-cat"'));
  }
  const popup = readFileSync(resolve(root, 'src/popup/Popup.tsx'), 'utf8');
  assert.ok(popup.includes("aria-label={t('dedupe')}"));
  assert.ok(!popup.includes("<DedupeIcon />{t('dedupe')}"));
});

test('changing language preserves the current query and auto-clear deadline', () => {
  let slots = [], index = 0, dirty = false, pending = [], tree, now = 0, nextId = 1, language = 'en';
  const timers = new Map();
  const props = { query: '', historyCount: 1, clearTimeoutSeconds: 60, onQuery(value) { props.query = value; dirty = true; } };
  const react = {
    useState(initial) {
      const i = index++; slots[i] ??= { value: initial };
      return [slots[i].value, (value) => { slots[i].value = typeof value === 'function' ? value(slots[i].value) : value; dirty = true; }];
    },
    useRef(initial) { const i = index++; slots[i] ??= { current: initial }; return slots[i]; },
    useEffect(fn, deps) {
      const i = index++, old = slots[i];
      if (!old || deps.some((value, j) => !Object.is(value, old.deps[j]))) pending.push(() => { old?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; });
    },
  };
  const Search = loader({ react, '../../components/I18nProvider': { useI18n: () => createTranslator(language) },
    '../../core/storage': { getSearchHistory: async () => [], setSearchHistory: async () => {} },
  }, {
    Date: { now: () => now },
    setTimeout(fn, ms) { const id = nextId++; timers.set(id, { at: now + ms, fn }); return id; },
    clearTimeout(id) { timers.delete(id); },
    document: { visibilityState: 'visible', querySelector: () => null, addEventListener() {}, removeEventListener() {} },
    chrome: { runtime: { onMessage: { addListener() {}, removeListener() {} } } },
  })('src/dashboard/components/TabSearch.tsx').default;
  const render = () => { do { dirty = false; index = 0; tree = Search(props); const jobs = pending; pending = []; jobs.forEach((fn) => fn()); } while (dirty); };
  const advance = (ms) => {
    const end = now + ms;
    while (true) {
      const next = [...timers].filter(([, value]) => value.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      now = next[1].at; timers.delete(next[0]); next[1].fn(); if (dirty) render();
    }
    now = end;
  };
  render();
  find(tree, (n) => n.type === 'input').props.onChange({ target: { value: 'Original query' } }); render();
  advance(30000); language = 'zh-CN'; render();
  assert.equal(find(tree, (n) => n.type === 'input').props.placeholder, zhCN.searchPlaceholder);
  assert.equal(props.query, 'Original query');
  advance(29999); assert.equal(props.query, 'Original query'); advance(1); assert.equal(props.query, '');
  slots.forEach((slot) => slot.cleanup?.());
});

test('metadata and English listing respect character limits and have no extra permissions', () => {
  const src = readFileSync(resolve(root, 'manifest.config.ts'), 'utf8');
  const description = src.match(/description:\s*\n\s*'([^']+)'/)[1];
  assert.ok(description.length <= 132 && !/\p{Script=Han}/u.test(description));
  const listing = readFileSync(resolve(root, 'release/02-store-listing.md'), 'utf8');
  const short = listing.match(/## Short description[^\n]*\n\n```text\n([^\n]+)/)[1];
  assert.ok(short.length <= 132);
  assert.ok(src.includes("permissions: ['tabs', 'tabGroups', 'sessions', 'storage', 'favicon', 'sidePanel']"));
  for (const path of ['index.html', 'sidepanel.html', 'popup.html']) assert.ok(readFileSync(resolve(root, path), 'utf8').includes('lang="en"'));
});
