import type { DatasetRef } from '../data/registry';
import type { useInstallPrompt, useTheme } from '../hooks';
import { useState } from 'react';

const THEME_LABEL = { auto: 'Theme: auto', light: 'Theme: light', dark: 'Theme: dark' } as const;
const THEME_ICON = { auto: '◐', light: '☀', dark: '☾' } as const;

export function Header({
  refInfo,
  theme,
  install,
}: {
  refInfo: DatasetRef;
  theme: ReturnType<typeof useTheme>;
  install: ReturnType<typeof useInstallPrompt>;
}) {
  const [iosHint, setIosHint] = useState(false);
  return (
    <header className="topbar">
      <a className="brand" href={`#/${refInfo.jurisdiction.slug}/${refInfo.entity.slug}`}>
        <svg viewBox="0 0 64 64" width="28" height="28" aria-hidden="true">
          <rect width="64" height="64" rx="14" fill="var(--brand)" />
          <rect x="12" y="34" width="9" height="18" rx="2" fill="#86b6ef" />
          <rect x="27.5" y="24" width="9" height="28" rx="2" fill="#cde2fb" />
          <rect x="43" y="14" width="9" height="38" rx="2" fill="#fff" />
        </svg>
        <span>Economy Visuals</span>
      </a>
      <div className="topbar-actions">
        {install.canInstall && (
          <button className="btn btn-primary" onClick={install.install}>
            Install app
          </button>
        )}
        {!install.canInstall && install.showIosHint && (
          <button className="btn" onClick={() => setIosHint((v) => !v)} aria-expanded={iosHint}>
            Install
          </button>
        )}
        <button className="btn btn-icon" onClick={theme.cycle} aria-label={THEME_LABEL[theme.theme]} title={THEME_LABEL[theme.theme]}>
          <span aria-hidden="true">{THEME_ICON[theme.theme]}</span>
        </button>
      </div>
      {iosHint && (
        <p className="ios-hint" role="status">
          On iPhone or iPad: tap the Share button, then <strong>Add to Home Screen</strong>.
        </p>
      )}
    </header>
  );
}
