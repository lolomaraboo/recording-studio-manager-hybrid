/**
 * CLIENT PORTAL LAYOUT
 * 
 * Layout dédié au portail client self-service.
 * Interface simplifiée et centrée sur l'expérience client.
 */

import { Link, useLocation } from "wouter";
import { Calendar, FileText, Home, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

interface ClientPortalLayoutProps {
  children: React.ReactNode;
}

export function ClientPortalLayout({ children }: ClientPortalLayoutProps) {
  const [location] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation();
  const { data: profile } = trpc.clientPortal.getMyClientProfile.useQuery();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = getLoginUrl();
  };

  const navItems = [
    { href: "/client/dashboard", label: "Dashboard", icon: Home },
    { href: "/client/sessions", label: "Mes Sessions", icon: Calendar },
    { href: "/client/book", label: "Réserver", icon: Calendar },
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
              {profile && (
                <p className="text-xs text-muted-foreground">{profile.name}</p>
              )}
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </header>

      <div className="container mx-auto flex gap-6 py-6">
        {/* Sidebar Navigation */}
        <aside className="w-64 space-y-2">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </a>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
