import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Music, X } from 'lucide-react';
import {
  Home,
  Calendar,
  FileText,
  FolderOpen,
  CreditCard,
  User,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useClientPortalAuth } from '@/contexts/ClientPortalAuthContext';
import { toast } from 'sonner';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/client-portal',
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: 'My Bookings',
    href: '/client-portal/bookings',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    title: 'Invoices',
    href: '/client-portal/invoices',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: 'Projects',
    href: '/client-portal/projects',
    icon: <FolderOpen className="h-5 w-5" />,
  },
  {
    title: 'Payment History',
    href: '/client-portal/payments',
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    title: 'Profile',
    href: '/client-portal/profile',
    icon: <User className="h-5 w-5" />,
  },
];

interface ClientPortalSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

/**
 * Client Portal Sidebar
 *
 * Sidebar navigation for client portal with same design as admin
 * Features:
 * - Collapsible sidebar (desktop)
 * - Mobile drawer with overlay
 * - Active link highlighting
 * - Client branding
 * - Logout button
 */
export function ClientPortalSidebar({
  isMobileOpen = false,
  onMobileClose,
}: ClientPortalSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useClientPortalAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile breakpoint
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load sidebar state from localStorage
  useEffect(() => {
    const storedCollapsed = localStorage.getItem('clientPortalSidebarCollapsed');
    if (storedCollapsed) {
      setIsCollapsed(storedCollapsed === 'true');
    }
  }, []);

  // Save sidebar state to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('clientPortalSidebarCollapsed', String(newState));
  };

  // Close mobile menu when navigating
  useEffect(() => {
    if (isMobile && isMobileOpen && onMobileClose) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/client-portal/login');
  };

  // Sidebar content component (reused for both desktop and mobile)
  const SidebarContent = () => (
    <>
      {/* Header with logo and collapse/close button */}
      <div
        className={cn(
          'px-4 py-4 flex items-center',
          isCollapsed && !isMobile ? 'justify-center' : 'justify-between'
        )}
      >
        {!(isCollapsed && !isMobile) && (
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Studio Portal
            </span>
          </div>
        )}
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="h-8 w-8"
            title="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.href} to={item.href}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    isCollapsed && !isMobile && 'justify-center'
                  )}
                  title={isCollapsed && !isMobile ? item.title : undefined}
                >
                  {item.icon}
                  {!(isCollapsed && !isMobile) && <span className="flex-1">{item.title}</span>}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button at bottom */}
      <div className="p-4">
        {!(isCollapsed && !isMobile) ? (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Log out</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="w-full text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
            title="Log out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        )}
      </div>
    </>
  );

  // Mobile: Drawer with overlay
  if (isMobile) {
    return (
      <>
        {/* Mobile drawer */}
        <div
          className={cn(
            'fixed top-0 left-0 h-screen w-64 bg-card border-r border-border z-50 transition-transform duration-300 ease-in-out md:hidden flex flex-col',
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <SidebarContent />
        </div>

        {/* Overlay - covers everything except drawer */}
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            style={{ left: '256px' }} // Start after drawer (w-64 = 256px)
            onClick={onMobileClose}
          />
        )}
      </>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <div
      className={cn(
        'hidden md:flex h-screen flex-col border-r border-border bg-card transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <SidebarContent />
    </div>
  );
}
