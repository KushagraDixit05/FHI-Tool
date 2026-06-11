'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/quotes': 'Quotes',
  '/buyers': 'Buyers',
  '/products': 'Products',
  '/suppliers': 'Suppliers',
  '/settings/master-data': 'Master Data',
};

function getPageTitle(pathname: string): string {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === path || (path !== '/dashboard' && pathname.startsWith(path))) {
      return title;
    }
  }
  return 'FHI Platform';
}

export function Topbar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const title = getPageTitle(pathname);

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
      <h1 className="font-semibold text-slate-800 text-base">{title}</h1>

      <div className="flex items-center gap-3">
        {/* Search hint */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-100 transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span>Search…</span>
          <kbd className="bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded text-[10px] font-mono">⌘K</kbd>
        </div>

        {/* Notifications */}
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
          <Bell className="w-4 h-4" />
          {/* Unread indicator */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
      </div>
    </header>
  );
}
