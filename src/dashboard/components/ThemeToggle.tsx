import type { Theme } from '../../core/types';
import { useI18n } from '../../components/I18nProvider';

interface Props {
  theme: Theme;
  onChange: (t: Theme) => void;
}

export default function ThemeToggle({ theme, onChange }: Props): JSX.Element {
  const t = useI18n();
  return (
    <button
      className="powerful-theme-toggle"
      onClick={() => onChange(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? `☀ ${t('light')}` : `✦ ${t('dark')}`}
    </button>
  );
}
