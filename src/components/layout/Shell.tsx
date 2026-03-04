'use client';

import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/sessions', label: 'Sessions', icon: '☰' },
  { href: '/nutrition', label: 'Food', icon: '◉' },
  { href: '/sessions/new', label: 'New', icon: '+' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-500/5 blur-3xl rounded-full" />

      <div className="relative mx-auto max-w-2xl px-4 pb-24 pt-0 md:max-w-3xl md:pb-12 lg:max-w-4xl">
        {/* Desktop top nav — hidden on mobile */}
        <nav className="sticky top-0 z-50 -mx-4 border-b border-white/5 bg-zinc-950/90 backdrop-blur-md px-4 py-3 mb-6 hidden md:block">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-green-400">Kai Fitness</span>
              </div>
              <div className="flex gap-1">
                {NAV_LINKS.map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`rounded-lg px-3 py-1.5 text-xs transition ${
                      pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href))
                        ? 'bg-green-500/15 border border-green-500/25 text-green-300'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <form action="/logout" method="post">
                <button className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 transition">
                  Out
                </button>
              </form>
            </div>
          </div>
        </nav>

        {/* Mobile top bar — visible only on mobile */}
        <div className="sticky top-0 z-50 -mx-4 border-b border-white/5 bg-zinc-950/90 backdrop-blur-md px-4 py-3 mb-4 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-green-400">Kai Fitness</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action="/logout" method="post">
              <button className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 transition">
                Out
              </button>
            </form>
          </div>
        </div>

        {children}
      </div>

      {/* Mobile bottom nav — visible only on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-zinc-950/95 backdrop-blur-md md:hidden safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-4">
          {NAV_LINKS.map(link => {
            const active = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href));
            return (
              <a
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition ${
                  active ? 'text-green-400' : 'text-zinc-500'
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                <span className="text-[9px] font-medium">{link.label}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
