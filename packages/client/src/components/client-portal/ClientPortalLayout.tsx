import { Outlet } from 'react-router-dom';
import { ClientPortalHeader } from './ClientPortalHeader';

/**
 * Client Portal Layout
 *
 * Simplified layout for client portal (no sidebar, no AI assistant)
 * Clean and focused design for client self-service
 */
export function ClientPortalLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <ClientPortalHeader />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
