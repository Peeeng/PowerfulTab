import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createTranslator } from '../core/i18n';
import type { Language } from '../core/types';

const I18nContext = createContext(createTranslator());

export function I18nProvider({ language, children }: { language: Language; children: ReactNode }): JSX.Element {
  const t = useMemo(() => createTranslator(language), [language]);
  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
}

export function useI18n(): ReturnType<typeof createTranslator> { return useContext(I18nContext); }
