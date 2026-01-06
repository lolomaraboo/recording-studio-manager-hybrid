import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { User, LogOut, Menu } from 'lucide-react';
import { useClientPortalAuth } from '@/contexts/ClientPortalAuthContext';
import { useClientPortalBreadcrumbs } from '@/hooks/useClientPortalBreadcrumbs';
import { toast } from 'sonner';

interface ClientPortalHeaderProps {
  onMobileMenuToggle?: () => void;
}

/**
 * Client Portal Header
 *
 * Simplified header for client portal with:
 * - Mobile menu toggle button
 * - Breadcrumb navigation
 * - User menu with profile and logout
 *
 * Navigation is now in ClientPortalSidebar
 */
export function ClientPortalHeader({ onMobileMenuToggle }: ClientPortalHeaderProps) {
  const navigate = useNavigate();
  const { client, logout } = useClientPortalAuth();
  const breadcrumbs = useClientPortalBreadcrumbs();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/client-portal/login');
  };

  // Fallback if client is not loaded yet
  if (!client) {
    return null;
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile menu button (only visible on mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMobileMenuToggle}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumb Navigation */}
          <div className="flex-1 px-4">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((breadcrumb, index) => (
                  <React.Fragment key={breadcrumb.href}>
                    <BreadcrumbItem>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage className="flex items-center gap-2">
                          {breadcrumb.icon}
                          <span className="hidden sm:inline">{breadcrumb.label}</span>
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink to={breadcrumb.href} className="flex items-center gap-2">
                          {breadcrumb.icon}
                          <span className="hidden sm:inline">{breadcrumb.label}</span>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {client.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{client.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {client.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/client-portal/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
