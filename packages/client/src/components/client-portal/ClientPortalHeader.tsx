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
import { User, LogOut, Menu } from 'lucide-react';
import { useClientPortalAuth } from '@/contexts/ClientPortalAuthContext';
import { toast } from 'sonner';

interface ClientPortalHeaderProps {
  onMobileMenuToggle?: () => void;
}

/**
 * Client Portal Header
 *
 * Simplified header for client portal with:
 * - Mobile menu toggle button
 * - Page title (optional)
 * - User menu with profile and logout
 *
 * Navigation is now in ClientPortalSidebar
 */
export function ClientPortalHeader({ onMobileMenuToggle }: ClientPortalHeaderProps) {
  const navigate = useNavigate();
  const { client, logout } = useClientPortalAuth();

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

          {/* Page title placeholder - can be dynamically set per page */}
          <div className="flex-1">
            {/* Empty for now - pages can add their own title here */}
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
