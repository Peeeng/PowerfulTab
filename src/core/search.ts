import { pinyin } from 'pinyin-pro';
import type { TabInfo } from './types';

// Titles survive tab refreshes; reuse their initials while typing and when
// matching both grouped rows and Recent. Bound the cache for long sessions.
const titleInitials = new Map<string, string>();
const MAX_CACHED_TITLES = 1_000;

function getTitleInitials(title: string): string {
  const cached = titleInitials.get(title);
  if (cached !== undefined) return cached;
  const initials = pinyin(title, { pattern: 'first', toneType: 'none', type: 'array' })
    .join('').toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
  if (titleInitials.size >= MAX_CACHED_TITLES) {
    const oldest = titleInitials.keys().next().value;
    if (oldest !== undefined) titleInitials.delete(oldest);
  }
  titleInitials.set(title, initials);
  return initials;
}

export function matchesTabSearch(tab: TabInfo, query: string): boolean {
  const term = query.trim().toLocaleLowerCase();
  if (!term || tab.title.toLocaleLowerCase().includes(term) || tab.url.toLocaleLowerCase().includes(term)) return true;
  // Literal searches remain unchanged. Initials are an additional match for
  // Latin input; English text and numbers in mixed titles retain their spelling.
  return /^[a-z0-9]+$/.test(term) && /\p{Script=Han}/u.test(tab.title)
    && getTitleInitials(tab.title).includes(term);
}

export function rememberSearch(history: string[], query: string, count = 1): string[] {
  const term = query.trim();
  if (!term) return history.slice(0, count);
  return [term, ...history.filter((item) => item.toLocaleLowerCase() !== term.toLocaleLowerCase())].slice(0, count);
}
