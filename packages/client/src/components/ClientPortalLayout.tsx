/**
 * CLIENT PORTAL LAYOUT
 *
 * Layout for the client self-service portal.
 * Simplified interface focused on client experience.
 */

import { Link, useLocation } from "react-router-dom";
import { Calendar, FileText, Home, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface ClientPortalLayoutProps {
  children: React.ReactNode;
}

export function ClientPortalLayout({ children }: ClientPortalLayoutProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const logoutMutation = trpc.clientAuth.logout.useMutation();
  const { data: dashboardData } = trpc.clientPortal.dashboard.useQuery();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/client/login";
  };

  const navItems = [
    { href: "/client/dashboard", label: "Dashboard", icon: Home },
    { href: "/client/sessions", label: "Mes Sessions", icon: Calendar },
    { href: "/client/book", label: "Reserver", icon: Calendar },
    { href: "/client/invoices", label: "Factures", icon: FileText },
    { href: "/client/profile", label: "Profil", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold">🎵</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">Portail Client</h1>
              {dashboardData?.stats && (
                <p className="text-xs text-muted-foreground">
                  {dashboardData.stats.upcomingSessions} sessions a venir
                </p>
              )}
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Deconnexion
          </Button>
        </div>
      </header>

      <div className="container mx-auto flex gap-6 py-6">
        {/* Sidebar Navigation */}
        <aside className="w-64 space-y-2">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
