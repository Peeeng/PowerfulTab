import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import DedupeIcon from '../../components/DedupeIcon';
import SettingsIcon from '../../components/SettingsIcon';
import type { Theme } from '../../core/types';
import { useI18n } from '../../components/I18nProvider';

interface Props {
  busy: boolean;
  hint: string;
  theme: Theme;
  onTheme: (t: Theme) => void;
  onDedupe: () => void;
  onSettings: () => void;
  onOrganize: () => void;
}

/** A cheerful floppy-eared puppy resting on the toolbar edge. */
function DogDoodle(): JSX.Element {
  return (
    <svg className="powerful-dog" width="56" height="34" viewBox="0 0 64 38" aria-hidden>
      {/* Curled tail and a round, soft body. */}
      <path d="M52 25 Q63 21 59 12" fill="none" stroke="var(--dog-ear, #bd865f)" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="44" cy="26" rx="14" ry="8" fill="var(--dog-fill, #f5d6c0)" stroke="var(--dog-line, #5a3a2a)" strokeWidth="1.2" />
      <ellipse cx="46" cy="32" rx="6" ry="3" fill="var(--dog-fill, #f5d6c0)" stroke="var(--dog-line, #5a3a2a)" strokeWidth="1.2" />
      {/* Oversized head and floppy caramel ears. */}
      <path d="M12 17 C12 9 17 5 25 5 C34 5 39 11 39 19 C39 28 33 32 25 32 C17 32 12 27 12 17Z"
        fill="var(--dog-fill, #f5d6c0)" stroke="var(--dog-line, #5a3a2a)" strokeWidth="1.2" />
      <path d="M15 9 C9 8 5 15 7 23 C8 29 12 30 15 25 L18 12Z"
        fill="var(--dog-ear, #bd865f)" stroke="var(--dog-line, #5a3a2a)" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M35 9 C41 9 45 17 43 24 C42 29 38 29 35 24 L33 12Z"
        fill="var(--dog-ear, #bd865f)" stroke="var(--dog-line, #5a3a2a)" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Bright eyes, soft muzzle, rosy cheeks, and a tiny tongue. */}
      <circle cx="21" cy="18" r="2.4" fill="var(--dog-line, #5a3a2a)" />
      <circle cx="31" cy="18" r="2.4" fill="var(--dog-line, #5a3a2a)" />
      <circle cx="20.3" cy="17.3" r="0.8" fill="#fff" />
      <circle cx="30.3" cy="17.3" r="0.8" fill="#fff" />
      <ellipse cx="17" cy="23" rx="2" ry="1.2" fill="#ed9c9b" opacity="0.7" />
      <ellipse cx="35" cy="23" rx="2" ry="1.2" fill="#ed9c9b" opacity="0.7" />
      <ellipse cx="26" cy="24" rx="6.5" ry="4" fill="#fff3e7" />
      <path d="M23.6 21.5 Q26 20.3 28.4 21.5 Q28 24 26 24 Q24 24 23.6 21.5Z" fill="var(--dog-line, #5a3a2a)" />
      <path d="M26 24 V25 M22 25 Q24 28 26 25 Q28 28 30 25"
        fill="none" stroke="var(--dog-line, #5a3a2a)" strokeWidth="1" strokeLinecap="round" />
      <path d="M25.7 26 Q29 25.7 29 28 Q28.8 30.2 27.3 30 Q25.7 29.8 25.7 26Z"
        fill="#ee9da9" stroke="#bf7081" strokeWidth="0.6" />
      {/* Little paws over the edge. */}
      <ellipse cx="17" cy="32" rx="5" ry="3" fill="var(--dog-fill, #f5d6c0)" stroke="var(--dog-line, #5a3a2a)" strokeWidth="1.1" />
      <ellipse cx="31" cy="32" rx="5" ry="3" fill="var(--dog-fill, #f5d6c0)" stroke="var(--dog-line, #5a3a2a)" strokeWidth="1.1" />
      <path d="M16 32 V33 M18 32 V33 M30 32 V33 M32 32 V33" stroke="var(--dog-line, #5a3a2a)" strokeWidth="0.7" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export default function Toolbar(props: Props): JSX.Element {
  const t = useI18n();
  const {
    busy,
    hint,
    theme,
    onTheme,
    onDedupe,
    onSettings,
    onOrganize,
  } = props;

  // 3D parallax hover：外层胶囊做 perspective rotateX/Y；内层内容做反向平移产生视差
  const zoneRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLButtonElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const zone = zoneRef.current;
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!zone || !outer || !inner) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reduceMotion) return;

    // 在感应区上挂 perspective，让 rotateX/Y 真正产生 3D 透视
    gsap.set(zone, { perspective: 650 });
    gsap.set(outer, { transformStyle: 'preserve-3d' });

    const outerRX = gsap.quickTo(outer, 'rotationX', { ease: 'power3', duration: 0.5 });
    const outerRY = gsap.quickTo(outer, 'rotationY', { ease: 'power3', duration: 0.5 });
    const innerX = gsap.quickTo(inner, 'x', { ease: 'power3', duration: 0.5 });
    const innerY = gsap.quickTo(inner, 'y', { ease: 'power3', duration: 0.5 });

    const onMove = (e: PointerEvent): void => {
      const rect = zone.getBoundingClientRect();
      // 0~1 归一化坐标
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      // 外层旋转（rotateX 上轻微抬头、rotateY 跟随水平）
      outerRX(gsap.utils.interpolate(12, -12, ny));
      outerRY(gsap.utils.interpolate(-15, 15, nx));
      // 内容反向平移做视差（强度小一些，避免溢出按钮）
      innerX(gsap.utils.interpolate(-4, 4, nx));
      innerY(gsap.utils.interpolate(-3, 3, ny));
    };
    const onLeave = (): void => {
      outerRX(0);
      outerRY(0);
      innerX(0);
      innerY(0);
    };

    zone.addEventListener('pointermove', onMove);
    zone.addEventListener('pointerleave', onLeave);
    return () => {
      zone.removeEventListener('pointermove', onMove);
      zone.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf([outer, inner]);
    };
  }, []);

  const handleOrganize = (): void => {
    onOrganize();
  };

  return (
    <header className="powerful-toolbar">
      <div className="powerful-toolbar__zone" ref={zoneRef}>
        <button
          ref={outerRef}
          className="powerful-toolbar__primary"
          onClick={handleOrganize}
          disabled={busy}
          title={t('organizeTitle')}
          aria-label={t('organize')}
        >
          <span className="powerful-toolbar__primary-bg" aria-hidden />
          <span className="powerful-toolbar__primary-inner" ref={innerRef}>
            <svg
              className="powerful-toolbar__primary-icon"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 7h12 M4 12h8 M4 17h5 M16 13l4 4-4 4 M20 17H10"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{t('organize')}</span>
            <svg
              className="powerful-btn__sparkle"
              width="9"
              height="9"
              viewBox="0 0 16 16"
              aria-hidden
            >
              <path
                d="M8 1.5 C8.4 5.2 9.8 6.6 13.5 7 C9.8 7.4 8.4 8.8 8 12.5 C7.6 8.8 6.2 7.4 2.5 7 C6.2 6.6 7.6 5.2 8 1.5 Z"
                fill="currentColor"
              />
            </svg>
          </span>
        </button>
      </div>

      <DogDoodle />

      <div className="powerful-toolbar__group powerful-toolbar__group--right">
        <button
          className="powerful-toolbar__icon-btn"
          onClick={onDedupe}
          disabled={busy}
          title={t('dedupeTitle')}
          aria-label={t('dedupe')}
        >
          <DedupeIcon />
        </button>
        <button className="powerful-toolbar__icon-btn" onClick={onSettings} disabled={busy} aria-label={t('settings')} title={t('settings')}><SettingsIcon /></button>
        <button
          className="powerful-toolbar__icon-btn"
          onClick={() => onTheme(theme === 'dark' ? 'light' : 'dark')}
          title={t(theme === 'dark' ? 'switchLight' : 'switchDark')}
          aria-label={t('switchTheme')}
        >
          {theme === 'dark' ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="4" fill="currentColor" />
              <path
                d="M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M20 14.5A8 8 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>
      </div>
      {hint && (
        <span className="powerful-toolbar__hint" title={hint} role="status">
          {hint}
        </span>
      )}
    </header>
  );
}
