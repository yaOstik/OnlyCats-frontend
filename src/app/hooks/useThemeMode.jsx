import { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme_mode';

function getStoredThemeMode() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === 'light' || raw === 'dark' || raw === 'system') {
    return raw;
  }
  return 'system';
}

function getEffectiveTheme(mode) {
  if (mode === 'light') return 'light';
  if (mode === 'dark') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function useThemeMode() {
  const [themeMode, setThemeMode] = useState(() => getStoredThemeMode());
  const [effectiveTheme, setEffectiveTheme] = useState(() => getEffectiveTheme(getStoredThemeMode()));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    const applyTheme = () => {
      const effective = getEffectiveTheme(themeMode);
      setEffectiveTheme(effective);
      document.documentElement.dataset.theme = effective;
    };

    applyTheme();

    if (themeMode !== 'system') return undefined;
    const matcher = window.matchMedia('(prefers-color-scheme: dark)');
    const onThemeChange = () => applyTheme();
    matcher.addEventListener('change', onThemeChange);
    return () => matcher.removeEventListener('change', onThemeChange);
  }, [themeMode]);

  return {
    themeMode,
    setThemeMode,
    effectiveTheme,
    isDarkTheme: effectiveTheme === 'dark',
  };
}
