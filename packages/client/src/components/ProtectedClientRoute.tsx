import { Navigate, useLocation } from 'react-router-dom';
import { useClientAuth } from '@/lib/clientAuth';

interface ProtectedClientRouteProps {
  children: React.ReactNode;
}

/**
 * Protected Client Route component
 *
 * Redirects to client portal login if client is not authenticated.
 * Preserves the attempted URL to redirect back after login.
 */
export function ProtectedClientRoute({ children }: ProtectedClientRouteProps) {
  const { isAuthenticated, isLoading } = useClientAuth();
  const location = useLocation();

  // Show nothing while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Redirect to portal login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/portal/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
