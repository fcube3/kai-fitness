'use client';

import { useTheme } from '@/lib/theme-context';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 transition dark:border-white/10 dark:bg-zinc-900"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}
