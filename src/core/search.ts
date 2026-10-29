import type { TabInfo } from './types';

export function matchesTabSearch(tab: TabInfo, query: string): boolean {
  const term = query.trim().toLocaleLowerCase();
  return !term || tab.title.toLocaleLowerCase().includes(term) || tab.url.toLocaleLowerCase().includes(term);
}

export function rememberSearch(history: string[], query: string, count = 1): string[] {
  const term = query.trim();
  if (!term) return history.slice(0, count);
  return [term, ...history.filter((item) => item.toLocaleLowerCase() !== term.toLocaleLowerCase())].slice(0, count);
}
