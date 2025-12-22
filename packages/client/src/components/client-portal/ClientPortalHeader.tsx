import { Link, useNavigate } from 'react-router-dom';
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
import { Music, User, LogOut, Calendar, FileText, CreditCard } from 'lucide-react';
import { useClientPortalAuth } from '@/contexts/ClientPortalAuthContext';
import { toast } from 'sonner';

/**
 * Client Portal Header
 *
 * Simple header for client portal with:
 * - Studio branding
 * - Navigation links
 * - User menu with logout
 */
export function ClientPortalHeader() {
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
          {/* Logo */}
          <Link
            to="/client-portal"
            className="flex items-center space-x-2 text-primary font-semibold text-lg"
          >
            <Music className="h-6 w-6" />
            <span>Studio Portal</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/client-portal"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Dashboard
            </Link>
            <Link
              to="/client-portal/bookings"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              My Bookings
            </Link>
            <Link
              to="/client-portal/invoices"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Invoices
            </Link>
            <Link
              to="/client-portal/projects"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Projects
            </Link>
          </nav>

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
              <DropdownMenuItem onClick={() => navigate('/client-portal')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/client-portal/bookings')}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>My Bookings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/client-portal/invoices')}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Invoices</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/client-portal/payments')}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Payment History</span>
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
