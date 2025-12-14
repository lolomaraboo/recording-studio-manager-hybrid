import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Mic,
  Users,
  FileText,
  Settings,
  Music,
  FolderOpen,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon;
}

const navigation: NavItem[] = [
  { key: 'dashboard', href: '/', icon: LayoutDashboard },
  { key: 'sessions', href: '/sessions', icon: Mic },
  { key: 'projects', href: '/projects', icon: FolderOpen },
  { key: 'clients', href: '/clients', icon: Users },
  { key: 'quotes', href: '/quotes', icon: ClipboardList },
  { key: 'invoices', href: '/invoices', icon: FileText },
  { key: 'settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-800 px-6">
        <Music className="h-8 w-8 text-purple-500" />
        <div className="flex flex-col">
          <span className="text-lg font-bold">RSM</span>
          <span className="text-xs text-gray-400">Studio Manager</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.key}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {t(`nav.${item.key}`)}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 p-4">
        <div className="rounded-lg bg-gray-800 p-3">
          <p className="text-xs text-gray-400">Studio Pro</p>
          <p className="text-sm font-medium">John Doe</p>
        </div>
      </div>
    </div>
  );
}
