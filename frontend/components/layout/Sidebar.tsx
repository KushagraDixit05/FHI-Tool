'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Truck,
  Settings,
  Globe,
  LogOut,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/quotes', label: 'Quotes', icon: FileText },
  { href: '/buyers', label: 'Buyers', icon: Users },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/suppliers', label: 'Suppliers', icon: Truck },
  { href: '/settings/master-data', label: 'Master Data', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    document.cookie = 'fhi_token=; path=/; max-age=0';
    toast.success('Logged out successfully');
    router.push('/login');
  };

  return (
    <aside
      className="fhi-sidebar flex flex-col h-full text-white"
      style={{ width: 'var(--fhi-sidebar-width)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm leading-tight">FHI Platform</div>
          <div className="text-white/50 text-xs truncate">Export Trade Calculator</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/50" />}
            </Link>
          );
        })}
      </nav>

      {/* User profile at bottom */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user ? getInitials(user.name) : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.name || 'User'}</div>
            <div className="text-xs text-white/50 truncate capitalize">
              {user?.role?.toLowerCase().replace(/_/g, ' ') || 'role'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/40 hover:text-red-300 transition-colors p-1 rounded"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
