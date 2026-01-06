import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { ClientPortalSidebar } from './ClientPortalSidebar';
import { ClientPortalHeader } from './ClientPortalHeader';

/**
 * Client Portal Layout
 *
 * Layout for client portal with sidebar navigation
 * Matches admin design with sidebar + header + main content
 * Features:
 * - Desktop: Fixed sidebar (collapsible)
 * - Mobile: Hamburger menu with drawer overlay
 */
export function ClientPortalLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar (responsive) */}
      <ClientPortalSidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content with header */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <ClientPortalHeader onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
